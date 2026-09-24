import { scientificSearch } from "./scientificSearchService";
import { ResearchArea } from "../tipos";
import { EGC_SOURCES } from "../data/egcSources";
import { GC_SOURCES } from "../data/gcSources";

export async function enrichSourceUFSCFirst(
  source: any,
  challengeContext?: string,
  area?: ResearchArea
) {
  const title = source?.titulo ?? source?.title ?? "";
  const year = typeof source?.ano === "number" ? source.ano : undefined;

  if (!title) return source;

const governanceContext =
  area === ResearchArea.GOVERNANCE_KNOWLEDGE && challengeContext
    ? challengeContext
        .replace(/[?.!,;:]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length >= 7)
        .slice(0, 8)
        .join(" ")
    : "";

const knowledgeManagementContext =
  area === ResearchArea.KNOWLEDGE_MGMT && challengeContext
    ? challengeContext
        .replace(/[?.!,;:]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length >= 7)
        .slice(0, 8)
        .join(" ")
    : "";

const integrationEngineeringContext =
  area === ResearchArea.INTEGRATION_ENG && challengeContext
    ? challengeContext
        .replace(/[?.!,;:]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length >= 7)
        .slice(0, 8)
        .join(" ")
    : "";
  
const searchTitle =
  area === ResearchArea.GOVERNANCE_KNOWLEDGE
    ? `${title} ${governanceContext}`.trim()
    : area === ResearchArea.KNOWLEDGE_MGMT
      ? `${title} ${knowledgeManagementContext}`.trim()
      : challengeContext
        ? `${title} ${title} ${challengeContext}`
        : title;

const res = await scientificSearch({
  title: searchTitle,
  area,
});
  // Se não achou nada confiável, mantém como está (sem inventar link genérico)
  if (!res?.best?.link) return source;

  const best = res.best;

  return {
    ...source,
    // mantém o seu padrão de campos
    titulo: best.title || source.titulo,
    autores: (best.authors && best.authors.length ? best.authors : source.autores) || source.autores,
    ano: best.year ?? source.ano,
    link: best.link || source.link,
    // opcional (se quiser inspecionar no debug)
    sourceType: res.sourceType,
  };
}
export async function enrichSourceUFSCFirstMultiple(
  source: any,
  challengeContext?: string,
  area?: ResearchArea,
  limit: number = 3
) {
  const title = source?.titulo ?? source?.title ?? "";

  if (!title) return [];

  const searchTitle =
    challengeContext
      ? `${title} ${challengeContext}`.trim()
      : title;

  const res = await scientificSearch({
    title: searchTitle,
    area,
  });

  const candidates = Array.isArray(res?.candidates)
    ? res.candidates
    : [];

  const validCandidates = candidates
    .filter(
      (candidate: any) =>
        candidate?.link &&
        candidate.link !== "https://repositorio.ufsc.br/" &&
        candidate.link !== "https://repositorio.ufsc.br"
    )
    .slice(0, limit);

  if (validCandidates.length === 0) {
    return [];
  }

  return validCandidates.map((candidate: any) => ({
    ...source,
    titulo: candidate.title || source.titulo,
    autores:
      candidate.authors && candidate.authors.length
        ? candidate.authors
        : source.autores,
    ano: candidate.year ?? source.ano,
    doi: candidate.doi ?? source.doi,
    link: candidate.link,
    sourceType: candidate.source ?? res.sourceType,
  }));
}

export type AnySource =
  | (typeof EGC_SOURCES)[number]
  | (typeof GC_SOURCES)[number];

// ✅ Lazy init para evitar TDZ em caso de import circular
let ALL_SOURCES_CACHE: AnySource[] | null = null;

function getAllSourcesInternal(): AnySource[] {
  if (ALL_SOURCES_CACHE) return ALL_SOURCES_CACHE;

  // defensivo: garante arrays válidos mesmo se algum módulo vier undefined em runtime
  const egc = Array.isArray(EGC_SOURCES) ? EGC_SOURCES : [];
  const gc = Array.isArray(GC_SOURCES) ? GC_SOURCES : [];

  ALL_SOURCES_CACHE = [...egc, ...gc];
  return ALL_SOURCES_CACHE;
}

/**
 * Regra do jogo:
 * - Sempre devolver alguma fonte para evitar telas “sem autores/link”.
 * - Se não houver fontes cadastradas para o eixo (area), retorna fallback (ALL_SOURCES).
 */
export function getSourcesByArea(area: ResearchArea): AnySource[] {
  const all = getAllSourcesInternal();
  return all.filter((s) => s.area === area);
}

export function searchSources(term: string, area?: ResearchArea): AnySource[] {
  const all = getAllSourcesInternal();

  const q = (term ?? "").trim().toLowerCase();
  if (!q) return area ? getSourcesByArea(area) : all;

  const base = area ? getSourcesByArea(area) : all;

  return base.filter((s) => {
    const hay = [
      s.titulo ?? "",
      s.autores ?? "",
      (s as any).instituicao ?? "",
      ...(((s as any).palavrasChave ?? []) as string[]),
      (s as any).observacao ?? "",
      String((s as any).ano ?? ""),
    ]
      .join(" ")
      .toLowerCase();

    return hay.includes(q);
  });
}

export function getAllSources(): AnySource[] {
  return getAllSourcesInternal();
}
