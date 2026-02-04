import { getSourcesByArea, searchSources } from "./services/sourcesService";
import { GoogleGenAI } from "@google/genai";
import { ResearchArea, GameState } from "./types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("VITE_GEMINI_API_KEY não definida no build (GitHub Actions).");
}

const ai = new GoogleGenAI({ apiKey });

const SUBTHEMES: Record<ResearchArea, string[]> = {
  [ResearchArea.GOVERNANCE_KNOWLEDGE]: [
    "Auditoria do conhecimento",
    "Governança para inovação",
    "Maturidade em GC",
    "Estruturas de decisão",
  ],
  [ResearchArea.KNOWLEDGE_MGMT]: [
    "Capital intelectual",
    "Framework 8'C",
    "Planejamento colaborativo",
    "Gestão de mudanças",
  ],
  [ResearchArea.INTEGRATION_ENG]: [
    "Engenharia da integração",
    "Redes de aprendizagem",
    "Centro de Memória Viva",
    "Sincronização de sistemas",
  ],
  [ResearchArea.UCR]: [
    "Educação corporativa em rede",
    "Trilhas de aprendizagem",
    "Sustentabilidade educacional",
    "Ecossistemas digitais",
  ],
};

export const getGeminiFeedback = async (
  prompt: string,
  state: GameState,
  action: string,
  team: string[]
) => {
  const model = "gemini-3-pro-preview";

  const UFSC_COLLECTION = "https://repositorio.ufsc.br/handle/123456789/76395";

  const pastProposalsSummary = state.report
    .slice(0, 5)
    .map(
      (r) =>
        `Area: ${r.area}, Veredito: ${r.verdict}, Proposta: ${r.proposal.substring(
          0,
          50
        )}...`
    )
    .join("\n");

  const sources = searchSources(action, state.phase === "CORE_GAME" ? undefined : undefined);
const topSources = sources.slice(0, 5);

const evidenceBlock =
  topSources.length === 0
    ? "Nenhuma evidência científica localizada nos repositórios institucionais."
    : topSources
        .map(
          (s, i) =>
            `${i + 1}) [${s.tipo}] ${s.titulo} — ${s.autores} (${s.ano}) — ${s.instituicao}\nLink: ${s.link}`
        )
        .join("\n\n");
  
  const systemInstruction = `
Você é o facilitador do Nexus ENGIN/UFSC e deve avaliar propostas estratégicas com BASE EM EVIDÊNCIA.

CONTEXTO COLETIVO:
${pastProposalsSummary || "Início da base de dados."}
EVIDÊNCIAS CIENTÍFICAS DISPONÍVEIS:
${evidenceBlock}

INSTRUÇÕES:
- Avalie a proposta considerando coerência estratégica
- Use as evidências quando pertinentes
- Indique claramente se a proposta é CORRETA ou INCORRETA
`;

  PRIORIDADE DE BUSCA (OBRIGATÓRIA):
1) PRIMEIRO: Repositório UFSC (DSpace) — coleção ENGIN/EGC: ${UFSC_COLLECTION}
   - Use a busca para encontrar teses/dissertações relacionadas ao DESAFIO e à PROPOSTA.
   - Prefira links do tipo: https://repositorio.ufsc.br/handle/...
2) Se NÃO houver evidência suficiente na UFSC: amplie para outras fontes acadêmicas abertas na web.

REGRAS:
- Se a resposta for genérica ou repetir o problema sem estratégia, o veredito é "NEGATIVA".
- Identifique conceitos técnicos (ex: 8'C, Auditoria do conhecimento, Governança etc.).
- Quando CORRETA: diga que a proposta "corrobora" com ao menos 1 autor/obra e cite.
- Quando NEGATIVA: diga por que diverge e cite ao menos 1 autor/obra que oriente o caminho correto.
- NÃO invente citações.
- NÃO afirme que acessou Scopus/Web of Science diretamente (sem APIs). Use somente resultados obtidos via busca.

FORMATO (JSON obrigatório) — responda SOMENTE em JSON:
{
  "verdict": "CORRETA" | "NEGATIVA",
  "explanation": string,
  "sourceType": "UFSC" | "MISTA" | "EXTERNA",
  "stabilityDelta": number,
  "innovationDelta": number,
  "references": string[]
}

REFERÊNCIAS:
- "references" deve conter itens no formato:
  "Autor (Ano) — Título — LINK — Trecho: <1-2 frases curtas>"
- Sempre que possível, use LINK da UFSC (handle).
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `
DESAFIO: ${prompt}
PROPOSTA: "${action}"
EQUIPE: ${team.join(", ")}

INSTRUÇÃO DE BUSCA:
1) Pesquise PRIMEIRO dentro da coleção UFSC:
   site:repositorio.ufsc.br/handle/123456789/76395 <palavras-chave do DESAFIO e da PROPOSTA>
2) Se não achar evidência suficiente, amplie a busca para outras fontes acadêmicas abertas.
3) Produza o JSON final, incluindo referências com autor+título+link+trecho.
`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    return {
      verdict: "NEGATIVA",
      explanation:
        "Não foi possível obter evidências (UFSC/web) nesta tentativa. Tente novamente com termos mais específicos.",
      sourceType: "EXTERNA",
      stabilityDelta: -10,
      innovationDelta: 0,
      references: [],
    };
  }
};

export const generateChallenge = async (area: ResearchArea) => {
  const model = "gemini-3-flash-preview";
  const subthemes = SUBTHEMES[area].join(", ");

  const instruction = `
Crie um desafio curto e impactante para a área: "${area}".
Subtemas: ${subthemes}.

REGRAS CRÍTICAS:
1. Use o TEMPO PRESENTE (Ex: "A empresa sofre...", "Você enfrenta...").
2. Seja CONCISO (máximo 3 frases). Não seja cansativo.
3. Apresente uma crise técnica real sem dar a solução.

JSON: { "title": string, "description": string }
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: instruction,
      config: { responseMimeType: "application/json" },
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return {
      title: "Crise de Fluxo",
      description:
        "O sistema detecta perda massiva de capital intelectual agora. Qual sua manobra de EGC?",
    };
  }
};
