import { articleIndex } from "./dados/articleIndex";
import React, { useEffect, useState } from "react";
import { AREA_ICONS, RESEARCH_DESCRIPTIONS } from "./constants";
import { generateChallenge } from "./geminiService";
import { ActionRecord, Challenge, GamePhase, GameState, ResearchArea } from "./src/tipos";
import { enrichSourceUFSCFirst, getSourcesByArea } from "./src/services/sourcesService";
import { enrichWithOpenAlex } from "./src/services/openAlexService";

interface ExtendedActionRecord extends ActionRecord {
  references?: string[];
  sourceType?: string;
  timestamp: string;
}

interface RankingEntry {
  playerName: string;
  area: ResearchArea;
  points: number;
}

const evaluateProposalWithSources = (proposal: string, area: ResearchArea) => {
  const sources = getSourcesByArea(area);
  const text = (proposal || "").toLowerCase();

  const perSource = sources.map((s) => {
    const keywords = s.palavrasChave || [];
    const hits = keywords.filter((k: string) => text.includes(String(k).toLowerCase())).length;
    const coverage = keywords.length ? hits / keywords.length : 0;

    return { source: s, hits, coverage };
  });

  const totalHits = perSource.reduce((sum, s) => sum + s.hits, 0);
  const score = Math.min(100, totalHits * 10);

  const usedSources = perSource.filter((x) => x.coverage >= 0.4).map((x) => x.source);
  const recommendedSources = perSource.filter((x) => x.coverage < 0.4).map((x) => x.source);

  // ✅ REGRA PEDAGÓGICA: erro também ensina
  if (usedSources.length === 0 && recommendedSources.length === 0) {
    const fallbackSources = sources.slice(0, 3);
    recommendedSources.push(...fallbackSources);
  }

  return { score, usedSources, recommendedSources };
};

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMsg = "Timeout na análise da IA") {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMsg)), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState & { report: ExtendedActionRecord[] }>(() => {
    const savedReport = localStorage.getItem("engin_nexus_reports_v2");
    const initialReport = savedReport ? JSON.parse(savedReport) : [];

    return {
      phase: GamePhase.INTRO,
      stability: 60,
      innovation: 10,
      energy: {
        [ResearchArea.GOVERNANCE_KNOWLEDGE]: 100,
        [ResearchArea.KNOWLEDGE_MGMT]: 100,
        [ResearchArea.INTEGRATION_ENG]: 100,
        [ResearchArea.UCR]: 100,
      },
      activePlayers: [],
      history: ["Nexus Online.", "Memória Coletiva Sincronizada."],
      report: initialReport,
    };
  });

  const [ranking, setRanking] = useState<RankingEntry[]>(() => {
    const savedRanking = localStorage.getItem("engin_nexus_ranking_v2");
    return savedRanking ? JSON.parse(savedRanking) : [];
  });

  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [playerInput, setPlayerInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastRecord, setLastRecord] = useState<ExtendedActionRecord | null>(null);

  const [feedback, setFeedback] = useState<{
    verdict: string;
    explanation: string;
    references?: string[];
    sourceType?: string;
    stabilityDelta?: number;
    innovationDelta?: number;
    usedSources?: any[];
    recommendedSources?: any[];
  } | null>(null);

  const [newPlayerName, setNewPlayerName] = useState("");
  const [showDatabase, setShowDatabase] = useState(false);
  const [showRanking, setShowRanking] = useState(false);

  useEffect(() => {
    localStorage.setItem("engin_nexus_reports_v2", JSON.stringify(gameState.report));
  }, [gameState.report]);

  useEffect(() => {
    localStorage.setItem("engin_nexus_ranking_v2", JSON.stringify(ranking));
  }, [ranking]);

  const canSubmit = (playerInput || "").trim().split(/\s+/).filter((w) => w.length > 0).length >= 3;

  const addPlayer = (name: string) => {
    const cleanName = (name || "").trim();
    if (!cleanName || gameState.activePlayers.includes(cleanName)) return;
    setGameState((prev) => ({ ...prev, activePlayers: [...prev.activePlayers, cleanName] }));
    setNewPlayerName("");
  };

  const startGame = () => {
    if (gameState.activePlayers.length < 1) {
      alert("Identifique o Especialista.");
      return;
    }
    setGameState((prev) => ({ ...prev, phase: GamePhase.CORE_GAME }));
  };

  const handleAreaSelect = async (area: ResearchArea) => {
    setLoading(true);
    setFeedback(null);
    setPlayerInput("");

    const challengeData = await generateChallenge(area);
    setCurrentChallenge({
      id: Math.random().toString(36),
      title: challengeData.title,
      description: challengeData.description,
      requiredArea: area,
    });

    setLoading(false);
  };

 const normalizeSourceItem = (s: any) => {
  const tituloBase = String(s?.titulo ?? s?.title ?? "Referência");
  const anoNum = typeof s?.ano === "number" ? s.ano : undefined;
  const titulo = anoNum ? `${tituloBase} (${anoNum})` : tituloBase;

  // autores
  const autoresRaw = s?.autores ?? s?.authors;
  const autores =
    Array.isArray(autoresRaw)
      ? autoresRaw.filter(Boolean).join(", ")
      : typeof autoresRaw === "string"
        ? autoresRaw
        : "Autor(es) não informado(s)";

  // DOI (normaliza removendo doi.org/)
  const doiRaw = typeof s?.doi === "string" ? s.doi.trim() : "";
  const doi = doiRaw ? doiRaw.replace(/^https?:\/\/doi\.org\//i, "").trim() : "";

  // link (prioriza DOI)
  let linkRaw = typeof s?.link === "string" ? s.link.trim() : "";

  // se link contém doi.org, extrai DOI
  if (!doi && linkRaw && /doi\.org\//i.test(linkRaw)) {
    const part = linkRaw.split(/doi\.org\//i)[1]?.trim();
    if (part) linkRaw = `https://doi.org/${part}`;
  }

  // se tem DOI, força link DOI
  if (doi) linkRaw = `https://doi.org/${doi}`;
// ✅ captura DOI também se vier no link (doi.org/...)
const doiFromLink =
  !doi && linkRaw && /doi\.org\//i.test(linkRaw)
    ? linkRaw.split(/doi\.org\//i)[1]?.trim()
    : "";

const doiFinal = (doi || doiFromLink || "").trim();
   
  // garante absoluto
  if (linkRaw && !/^https?:\/\//i.test(linkRaw)) {
    linkRaw = `https://${linkRaw.replace(/^\/+/, "")}`;
  }

  // fallback
  if (!linkRaw) linkRaw = "https://repositorio.ufsc.br/";

  return {
  titulo,
  autores,
  link: linkRaw,
  ano: anoNum,
  doi: doiFinal || undefined, // ✅ agora o objeto tem DOI
};
};
  const dedupeByDoi = <T extends { doi?: string }>(items: T[]) => {
    const seen = new Map<string, T>();
    const out: T[] = [];

    for (const item of items) {
      const doi = typeof item?.doi === "string" ? item.doi.toLowerCase().trim() : "";

      if (!doi) {
        out.push(item);
        continue;
      }

      const existing = seen.get(doi);
      if (!existing) {
        seen.set(doi, item);
        out.push(item);
      } else {
        const merged = {
          ...item,
          ...existing,
          titulo: (existing as any).titulo || (item as any).titulo,
          autores: (existing as any).autores || (item as any).autores,
          link: (existing as any).link || (item as any).link,
          ano: (existing as any).ano ?? (item as any).ano,
          doi,
        } as T;

        seen.set(doi, merged);
        const idx = out.indexOf(existing);
        if (idx >= 0) out[idx] = merged;
      }
    }

    return out;
  };

  const buildCacheKey = (source: { doi?: string; titulo: string }) => {
    const doi = (source?.doi ?? "").toLowerCase().trim();
    if (doi) return `doi:${doi}`;
    const title = (source?.titulo ?? "").toLowerCase().trim();
    return `title:${title}`;
  };

  const submitAction = async () => {
    console.log("[CLICK] submitAction disparou. playerInput =", playerInput);
    if (!currentChallenge || !canSubmit || loading) return;

    const emergencyExplanation = "Falha temporária ao avaliar sua proposta. Tente novamente em instantes.";
    let combinedExplanation = "";

    setLoading(true);

    // ✅ safeMapped sempre existe (para emergency fallback)
    const safeMapped = (() => {
      try {
        const areaSources = getSourcesByArea(currentChallenge.requiredArea) || [];
        return areaSources.slice(0, 3).map(normalizeSourceItem);
      } catch {
        return [
          { autores: "UFSC/EGC", titulo: "Repositório UFSC (busca)", link: "https://repositorio.ufsc.br/" },
        ];
      }
    })();

    try {
      // 1️⃣ Tenta Gemini
      let feedbackData: any = null;

      try {
        feedbackData = await withTimeout(
          Promise.resolve(
            getGeminiFeedback(
              currentChallenge.description,
              gameState,
              playerInput,
              gameState.activePlayers,
              currentChallenge.requiredArea
            )
          ),
          45000
        );
      } catch (e) {
        console.warn("Gemini falhou (429/503/etc), usando fallback local:", e);
        feedbackData = null;
      }

      // 2️⃣ Avaliação local (blindada)
      const area = currentChallenge.requiredArea;

      let localEval: any = { usedSources: [], recommendedSources: [] };
      try {
        localEval = evaluateProposalWithSources(playerInput, area) ?? localEval;
      } catch (e) {
        console.error("[LOCAL_EVAL] evaluateProposalWithSources falhou:", e);
        localEval = { usedSources: [], recommendedSources: [] };
      }

      // 3️⃣ UFSC-FIRST nos itens locais
      let usedMapped: any[] = [];
      let recommendedMapped: any[] = [];

      try {
        usedMapped = (await Promise.all((localEval.usedSources ?? []).map(enrichSourceUFSCFirst))).map(normalizeSourceItem);

        recommendedMapped = (await Promise.all((localEval.recommendedSources ?? []).map(enrichSourceUFSCFirst))).map(
          normalizeSourceItem
        );
      } catch (e) {
        console.error("[LOCAL_MAP] falhou ao mapear fontes:", e);
        usedMapped = [];
        recommendedMapped = [];
      }

      // 4️⃣ Fallback pedagógico (sempre mostrar referências)
      if (usedMapped.length === 0 && recommendedMapped.length === 0) {
        const areaSources = getSourcesByArea(area);
        recommendedMapped = (areaSources || []).slice(0, 3).map(normalizeSourceItem);
      }

      // 5️⃣ Se Gemini falhou, gera feedback científico local
      if (!feedbackData) {
        const topRefs = (usedMapped.length ? usedMapped : recommendedMapped).slice(0, 3);
        const refsText = topRefs.map((r) => `- ${r.autores}: ${r.titulo}`).join("\n");

        feedbackData = {
          verdict: "CORRETA",
          explanation:
            `Proposta recebida com sucesso: "${playerInput}"\n\n` + `Base científica do eixo:\n${refsText}`,
          pointsEarned: 10,
          references: topRefs.map((r) => `${r.autores} — ${r.titulo}`),
          sourceType: "LOCAL_FALLBACK",
        };
      }

      // 6️⃣ Pontuação
      const pointsEarned: number = typeof feedbackData.pointsEarned === "number" ? feedbackData.pointsEarned : 10;

      // 7️⃣ Enriquecimento OpenAlex (somente RECOMENDADAS do fluxo LOCAL UFSC-FIRST)
      const enrichedRecommendedMapped = await Promise.all(
        (recommendedMapped || []).map(async (source) => {
          const cacheKey = `openalex:${buildCacheKey(source as any)}`;

          try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) return JSON.parse(cached);
          } catch {
            // ignora
          }

          let enriched: any = null;
          try {
            enriched = await enrichWithOpenAlex({
              doi: (source as any)?.doi,
              title: source.titulo,
            });
          } catch (e) {
            enriched = null;
          }

          // ✅ UFSC-first: se não enriquecer, ao menos garantir "busca específica" UFSC (não link genérico)
          if (!enriched) {
            const titleQ = encodeURIComponent(source.titulo || "");
            const ufscSearch = `https://repositorio.ufsc.br/simple-search?query=${titleQ}`;
            const linkIsGeneric =
              !source.link ||
              source.link === "https://repositorio.ufsc.br/" ||
              source.link === "https://repositorio.ufsc.br";

            return { ...source, link: linkIsGeneric ? ufscSearch : source.link };
          }

          const doi = typeof enriched.doi === "string" ? enriched.doi.trim() : "";
          const doiHref = doi ? `https://doi.org/${doi.replace(/^https?:\/\/doi\.org\//i, "")}` : "";
             // 🔎 tenta encontrar mapeamento por DOI
            const mappingByDoi = (enriched as any)?.doi
            ? articleIndex.find(
           (item) =>
          item.doi?.toLowerCase().trim() ===
          (enriched as any)?.doi?.toLowerCase().trim()
           )
          : undefined;
          
        const finalSource = {
           ...source,
       titulo: enriched.titulo || source.titulo,
              autores: enriched.autores || source.autores,
               ano: (enriched as any).ano ?? (source as any).ano,
             doi: (enriched as any).doi ?? (source as any).doi,
             // 🔒 prioridade absoluta já tratada dentro do enrichWithOpenAlex
                 link: enriched.link || source.link,
                 driveUrl: mappingByDoi?.driveUrl,
                  ufscHandle: mappingByDoi?.ufscHandle,
                  };

          try {
            localStorage.setItem(cacheKey, JSON.stringify(finalSource));
          } catch {
            // ignora
          }

          return finalSource;
        })
      );

      // 8️⃣ Dedup final (APENAS UMA VEZ) -> este é o que vai para UI
      const dedupedRecommended = dedupeByDoi(enrichedRecommendedMapped as any[]);

     console.log("UFSC-FIRST + OpenAlex recommended (best-effort):", dedupedRecommended?.slice?.(0, 3));

console.log(
  "DEBUG DEDUP FULL:",
  (dedupedRecommended || []).map((s: any) => ({
    titulo: s?.titulo,
    doi: s?.doi,
    link: s?.link,
  }))
);

console.log(
  "DEBUG DOI COUNT:",
  (dedupedRecommended || []).filter((s: any) => !!s?.doi).length,
  "/",
  (dedupedRecommended || []).length
);

      // 9️⃣ Explicação combinada
      combinedExplanation = String(feedbackData?.explanation ?? "").trim() || combinedExplanation || emergencyExplanation;

      const record: ExtendedActionRecord = {
        area: currentChallenge.requiredArea,
        title: currentChallenge.title,
        proposal: playerInput,
        verdict: feedbackData.verdict,
        explanation: combinedExplanation,
        executors: [...gameState.activePlayers],
        references: feedbackData.references ?? [],
        sourceType: feedbackData.sourceType ?? "local",
        pointsEarned,
        usedSources: usedMapped,
        recommendedSources: dedupedRecommended,
        timestamp: new Date().toLocaleString("pt-BR"),
      };

      setLastRecord(record);

      console.log("ANTES do setFeedback", {
        hasRec: recommendedMapped.length,
        hasUsed: usedMapped.length,
      });

      console.log(
        "DEBUG RECOMMENDED (flat):",
        (dedupedRecommended as any[]).map((s) => ({
          titulo: s?.titulo,
          autores: s?.autores,
          ano: s?.ano,
          doi: s?.doi,
          link: s?.link,
        }))
      );

      setFeedback({
        verdict: feedbackData.verdict,
        explanation: combinedExplanation,
        pointsEarned,
        references: feedbackData.references ?? [],
        sourceType: feedbackData.sourceType ?? "local",
        usedSources: usedMapped,
        recommendedSources: dedupedRecommended,
      });

      console.log("DEPOIS do setFeedback");
    } catch (err) {
      console.error("submitAction error:", err);

      setFeedback({
        verdict: "ANALISE_INDISPONIVEL",
        explanation: emergencyExplanation,
        pointsEarned: 0,
        references: safeMapped.map((r: any) => `${r.autores} — ${r.titulo}`),
        sourceType: "EMERGENCY_FALLBACK",
        usedSources: [],
        recommendedSources: safeMapped,
      });
    } finally {
      setLoading(false);
    }
  };

  const buildQuery = (s: any) => {
    const titulo = (s?.titulo ?? "").toString().trim();
    const autores = (s?.autores ?? "").toString().trim();
    const doiLike = (s?.doi ?? "").toString().trim();
    const rawLink = (s?.link ?? "").toString().trim();

    const doiLink = rawLink.includes("doi.org/") ? rawLink.split("doi.org/")[1]?.trim() : "";
    const doi = doiLike || doiLink;

    const q = [titulo, autores, doi].filter(Boolean).join(" ");
    return q || titulo || autores || rawLink;
  };

  return (
    <div className="min-h-screen terminal-bg text-blue-50 p-3 md:p-8 font-inter overflow-x-hidden">
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border-b border-blue-900/50 pb-4">
        <div
          className="flex items-center gap-3 cursor-pointer w-full sm:w-auto justify-center sm:justify-start"
          onClick={() => {
            setShowDatabase(false);
            setShowRanking(false);
          }}
        >
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center glow shrink-0">
            <span className="font-orbitron font-bold text-white text-lg">N</span>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="font-orbitron text-lg md:text-xl font-bold tracking-widest text-blue-400">NEXUS ENGIN</h1>
            <p className="text-sm md:text-base text-slate-200/90 font-mono uppercase">Memória Coletiva UFSC</p>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-between w-full sm:w-auto">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowDatabase(!showDatabase);
                setShowRanking(false);
              }}
              className={`px-3 py-1.5 rounded-full border text-[9px] font-orbitron transition-all ${
                showDatabase ? "bg-blue-600 text-white" : "border-blue-900 text-blue-400"
              }`}
            >
              REP ({gameState.report.length})
            </button>

            <button
              onClick={() => {
                setShowRanking(!showRanking);
                setShowDatabase(false);
              }}
              className={`p-1.5 rounded-lg border transition-all ${
                showRanking ? "bg-yellow-600 border-yellow-400 text-white" : "bg-slate-900 border-blue-900 text-yellow-500"
              }`}
              title="Classificação"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </button>
          </div>

          <div className="flex gap-3 md:gap-6 border-l border-blue-900/50 pl-4 shrink-0">
            <StatBar label="ESTAB" value={gameState.stability} color={gameState.stability < 30 ? "bg-red-500" : "bg-green-500"} />
            <StatBar label="INOVA" value={gameState.innovation} color="bg-blue-400" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {showRanking ? (
          <div className="animate-in fade-in duration-500 space-y-4">
            <h2 className="font-orbitron text-lg text-yellow-500 border-b border-yellow-900/30 pb-2">RANKING</h2>
            <div className="bg-slate-900/80 rounded-xl border border-yellow-900/20 overflow-x-auto">
              <table className="w-full text-left text-[10px] md:text-xs font-mono min-w-[300px]">
                <thead className="bg-yellow-950/20 text-yellow-500 uppercase font-orbitron">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Especialista</th>
                    <th className="p-3">Tema</th>
                    <th className="p-3 text-right">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-900/10">
                  {ranking
                    .slice()
                    .sort((a, b) => b.points - a.points)
                    .map((r, i) => (
                      <tr key={i} className="hover:bg-yellow-500/5">
                        <td className="p-3 text-yellow-600 font-bold">{i + 1}</td>
                        <td className="p-3 text-white font-bold truncate max-w-[80px] md:max-w-none">{r.playerName}</td>
                        <td className="p-3 text-blue-300 truncate max-w-[100px] md:max-w-none">{r.area}</td>
                        <td className="p-3 text-right text-yellow-400 font-bold">{r.points}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : showDatabase ? (
          <div className="animate-in fade-in duration-500 space-y-4">
            <h2 className="font-orbitron text-lg text-blue-400 border-b border-blue-900/30 pb-2 uppercase tracking-tighter">
              Memória Coletiva
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gameState.report.map((rec, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border bg-slate-900/60 space-y-2 ${
                    rec.verdict === "CORRETA" ? "border-green-500/20" : "border-red-500/20"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[7px] text-blue-400 uppercase font-bold truncate max-w-[70%]">{rec.area}</span>
                    <span
                      className={`text-[7px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        rec.verdict === "CORRETA" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {rec.verdict}
                    </span>
                  </div>
                  <h3 className="text-[10px] font-bold text-white leading-tight uppercase line-clamp-2">{rec.title}</h3>
                  <p className="text-[9px] text-blue-100/50 italic line-clamp-3">"{rec.proposal}"</p>
                  <div className="bg-black/20 p-2.5 rounded text-[9px] text-blue-200 leading-normal">{rec.explanation}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-slate-900/80 p-6 rounded-xl border border-blue-900/30 shadow-lg text-base">
                <h3 className="text-2xl font-orbitron text-blue-400 mb-3 uppercase tracking-widest">Acesso</h3>

                {gameState.phase === GamePhase.INTRO ? (
                  <div className="flex gap-2">
                    <input
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Identificação..."
                      className="bg-black/40 border border-blue-900/50 rounded p-2 text-[10px] w-full focus:border-blue-400 outline-none"
                    />
                    <button
                      onClick={() => addPlayer(newPlayerName)}
                      className="bg-blue-600 hover:bg-blue-500 px-4 py-1 rounded text-[10px] font-bold"
                    >
                      ADD
                    </button>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {gameState.activePlayers.map((p) => (
                    <span key={p} className="bg-blue-900/30 border border-blue-500/20 px-2 py-1 rounded text-[9px] text-blue-300">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-blue-900/30 h-40 lg:h-64 overflow-hidden flex flex-col hidden sm:flex">
                <h3 className="text-[10px] font-orbitron text-blue-500 mb-2 uppercase">Log do Sistema</h3>
                <div className="flex-1 overflow-y-auto font-mono text-[8px] text-blue-400/40 space-y-1.5 scrollbar-hide">
                  {gameState.history.map((h, i) => (
                    <div key={i} className="border-l border-blue-900/30 pl-1.5">{`> ${h}`}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              {gameState.phase === GamePhase.INTRO && (
                <div className="bg-blue-900/5 p-8 md:p-14 border border-blue-500/10 rounded-3xl text-center space-y-6 animate-in fade-in zoom-in duration-700">
                  <h2 className="text-4xl md:text-6xl font-orbitron font-bold text-blue-400 tracking-tighter">NEXUS DE CRISE</h2>
                  <p className="text-[10px] md:text-xs text-blue-100/60 max-w-sm mx-auto leading-relaxed">
                    Facilitador de crescimento estratégico. Todas as propostas negativas tornam-se ativos de rede. Nada é apagado.
                  </p>
                  <button
                    onClick={startGame}
                    className="w-full sm:w-auto px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-orbitron text-[10px] tracking-widest shadow-lg transform transition active:scale-95"
                  >
                    INICIAR OPERAÇÃO
                  </button>
                </div>
              )}

              {gameState.phase === GamePhase.CORE_GAME && !currentChallenge && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in--bottom-4">
                  {Object.values(ResearchArea).map((area) => (
                    <button
                      key={area}
                      onClick={() => handleAreaSelect(area)}
                      className="p-5 bg-slate-900/60 border border-blue-900/40 rounded-2xl hover:border-blue-400 text-left transition-all active:bg-blue-900/20 group"
                    >
                      <div className="text-blue-500 mb-3 group-hover:scale-110 transition-transform">{AREA_ICONS[area]}</div>
                      <h4 className="font-orbitron text-xs text-white mb-1 uppercase tracking-tight">{area}</h4>
                      <p className="text-[9px] text-blue-300/40 leading-snug line-clamp-2">{RESEARCH_DESCRIPTIONS[area]}</p>
                    </button>
                  ))}
                </div>
              )}

              {currentChallenge && (
                <div className="bg-slate-900 border border-blue-500/20 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                  <div className="bg-blue-950/80 p-3 border-b border-blue-500/10 text-[8px] font-orbitron text-blue-300 flex justify-between">
                    <span>STATUS: OPERACIONAL</span>
                    <span className="text-blue-500 uppercase">{currentChallenge.requiredArea}</span>
                  </div>

                  <div className="p-5 md:p-8 space-y-6">
                    {feedback ? (
                      <div className="space-y-5 animate-in slide-in-from-bottom-2">
                        <div
                          className={`p-5 rounded-xl border ${
                            feedback.verdict === "CORRETA" ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                          }`}
                        >
                          <h4 className={`font-orbitron text-lg mb-3 ${feedback.verdict === "CORRETA" ? "text-green-400" : "text-red-400"}`}>
                            {feedback.verdict}
                          </h4>

                          <p className="text-[9px] font-orbitron text-yellow-400 uppercase tracking-widest mb-2">
                            Pontos ganhos nesta rodada:{" "}
                            <span className="text-white font-bold">{lastRecord?.pointsEarned}</span>
                          </p>

                          <p className="text-[10px] md:text-xs text-blue-50 leading-relaxed mb-4">{feedback.explanation}</p>

                          {(lastRecord?.usedSources?.length || 0) > 0 && (
                            <div className="mt-4 space-y-2">
                              <p className="text-[9px] font-orbitron text-green-400 uppercase tracking-widest">Fontes acionadas</p>
                              <ul className="space-y-1 text-[9px] text-blue-100/70">
                                {lastRecord?.usedSources?.slice(0, 3).map((s: any, idx: number) => (
                                  <li key={idx} className="leading-snug">
                                    <span className="text-white font-bold">{s.autores || "Autor não informado"}</span>{" "}
                                    <span className="text-blue-200/80">— {s.titulo}</span>{" "}
                                    {s.doi ? (
                                      <span className="ml-1 text-[9px] text-blue-200/60">
                                      (DOI: <span className="text-blue-200/80">{s.doi}</span>)
                                      </span>
                                      ) : null}
                                    {s.link ? (
                                      <a
                                        href={s.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-yellow-400 underline ml-1 inline-block break-all"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        abrir
                                      </a>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {((feedback as any)?.recommendedSources?.length || 0) > 0 && (
                            <div className="mt-4 space-y-2">
                              <p className="text-[9px] font-orbitron text-yellow-400 uppercase tracking-widest">Recomendações para evoluir</p>
                              <ul className="space-y-1 text-[9px] text-blue-100/70">
                                {(feedback as any)?.recommendedSources?.slice(0, 3).map((s: any, idx: number) => (
                                  <li key={idx} className="leading-snug">
                                    <span className="text-white font-bold">{s.autores}</span>{" "}
                                    <span className="text-blue-200/80">— {s.titulo}</span>{" "}
                                   {(() => {
                                   const q = `${(s?.titulo ?? "").toString()} ${(s?.autores ?? "").toString()}`.trim();
                                    const qEnc = encodeURIComponent(q);

                                  const raw = (s?.link ?? "").trim();
                                 const mainHref = raw && !/^https?:\/\//i.test(raw) ? `https://${raw}` : raw;

                               const doiCandidate = String(s?.doi ?? "").trim() || raw;
                               const doiText = doiCandidate
                               .replace(/^doi:\s*/i, "")
                               .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
                                .trim()
                               .replace(/[)\].,;:]+$/g, "");
                                const doiHref = doiText.startsWith("10.") ? `https://doi.org/${doiText}` : "";
                                  const safeHref = (u: string) => {
                                  if (!u) return "";
                                  const cleaned = u.trim();
                                  if (!/^https?:\/\//i.test(cleaned)) return "";
                                  return cleaned;
                                  };
                              const finalHref = safeHref(doiHref || mainHref);

                      const titleForQuery = (s?.titulo ?? q).toString();

                    const rawMain = (s as any)?.link || "";
                     const ufscHandle =
                        typeof rawMain === "string" && rawMain.includes("repositorio.ufsc.br/handle/")
                     ? rawMain
                      : "";

                     // ✅ link específico por artigo (se existir no item)
                  const driveItemUrl = (s as any)?.driveUrl || "";

                    const links = [
                    { label: "Google Acadêmico", href: safeHref(`https://scholar.google.com/scholar?q=${qEnc}`) },
                     { label: "ERIC", href: safeHref(`https://eric.ed.gov/?q=${qEnc}`) },

                    // ✅ UFSC só se for DIRETO (handle)
                  ...(ufscHandle
                  ? [{ label: "UFSC/EGC (direto)", href: safeHref(ufscHandle) }]
                  : []),

                 // ✅ Drive só se for link do arquivo/artigo
                ...(driveItemUrl
                ? [{ label: "Drive (arquivo)", href: safeHref(driveItemUrl) }]
               : []),

                     {
                label: "Scopus",
                  href: safeHref(
                 `https://www.scopus.com/results/results.uri?sort=plf-f&src=s&sot=b&sdt=b&sl=TITLE-ABS-KEY%28${encodeURIComponent(
                 titleForQuery
                 )}%29`
                   ),
                 },
                   ];
                         return (
                      <div className="mt-1 space-y-1">
                     {/* DOI (canal 1) */}
                    {!!doiText && (
                       <a
                   href={`https://doi.org/${doiText}`}
                   target="_blank"
                   rel="noopener noreferrer"
                  className="text-[9px] text-blue-200/80 underline block break-all"
                    onClick={(e) => e.stopPropagation()}
               >
                DOI: {doiText}
                 </a>
                )}

                 {/* Abrir artigo (mainHref) */}
                  {!!(doiText || finalHref) && (
                <a
                  href={doiText ? `https://doi.org/${doiText}` : finalHref}
                target="_blank"
                 rel="noopener noreferrer"
                   className="text-yellow-400 underline block break-all"
                      onClick={(e) => e.stopPropagation()}
                     >
                      Abrir artigo
                        </a>
                        )}

                       {/* Outras fontes (canal 3) */}
                        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
                        {links.map((l) => (
                          <a
                           key={l.label}
                          href={l.href}
                           target="_blank"
                            rel="noopener noreferrer"
                             className="text-[9px] text-cyan-300 underline"
                              onClick={(e) => e.stopPropagation()}
                              >
                              {l.label}
                               </a>
                                ))}
                                </div>
                                </div>
                                );
                                 })()}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            setCurrentChallenge(null);
                            setFeedback(null);
                          }}
                          className="w-full py-4 bg-blue-600 text-white font-orbitron text-[9px] rounded-xl tracking-widest uppercase"
                        >
                          Retornar
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <h2 className="text-lg md:text-xl font-orbitron text-white leading-tight">{currentChallenge.title}</h2>
                            <div className="border-l-2 border-blue-600 pl-4 py-1">
                              <p className="text-blue-100/70 text-xs md:text-sm font-light italic leading-relaxed">
                                {currentChallenge.description}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <textarea
                              value={playerInput}
                              onChange={(e) => setPlayerInput(e.target.value)}
                              placeholder="Descreva sua manobra estratégica..."
                              className="w-full h-32 md:h-40 bg-black/40 border border-blue-900/30 rounded-xl p-4 text-[11px] md:text-xs font-mono text-blue-50 focus:border-blue-500 outline-none resize-none placeholder:text-blue-900"
                            />

                            <button
                              disabled={!canSubmit || loading}
                              onClick={submitAction}
                              className={`w-full py-4 md:py-5 font-orbitron text-[10px] rounded-xl tracking-[0.2em] transition-all uppercase shadow-xl ${
                                canSubmit && !loading
                                  ? "bg-green-600 hover:bg-green-500 text-white"
                                  : "bg-slate-800 text-slate-600 border border-slate-700"
                              }`}
                            >
                              {loading ? "ANALISANDO..." : "Transmitir Proposta"}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const StatBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="text-center group shrink-0">
    <p className="text-[7px] uppercase text-blue-400 mb-1 font-orbitron tracking-tighter opacity-70">{label}</p>
    <div className="w-16 md:w-24 h-1 bg-slate-800 rounded-full overflow-hidden border border-blue-900/20">
      <div className={`h-full transition-all duration-1000 ${color}`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

// placeholder local (seu projeto real deve substituir)
async function getGeminiFeedback(
  _challengeDescription: string,
  _gameState: any,
  playerInput: string,
  _activePlayers: string[],
  _requiredArea: string
) {
  return {
    verdict: "CORRETA",
    explanation: `Proposta recebida com sucesso: "${playerInput}"`,
    pointsEarned: 10,
    references: [],
    sourceType: "local",
  };
}

export default App;
