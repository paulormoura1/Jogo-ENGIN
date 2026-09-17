import { getSourcesByArea, searchSources } from "./src/services/sourcesService";
import { GoogleGenAI } from "@google/genai";
import { ResearchArea, GameState } from "./src/tipos";

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
const FALLBACK_CHALLENGES: Record<
  ResearchArea,
  { title: string; description: string }[]
> = {
  [ResearchArea.GOVERNANCE_KNOWLEDGE]: [
  {
    title: "Conhecimento sem Governança",
    description:
      "A organização possui informações estratégicas distribuídas entre diferentes setores, mas não existem responsabilidades claramente definidas sobre sua gestão e utilização. Decisões importantes são tomadas sem critérios consistentes de acesso, registro e compartilhamento do conhecimento. Como especialista, que estrutura de governança você implantaria, como ela funcionaria e por que seria adequada para essa situação?",
  },
  {
    title: "Baixa Maturidade em Gestão do Conhecimento",
    description:
      "A organização desenvolve iniciativas isoladas de gestão do conhecimento, porém não possui mecanismos para avaliar sua maturidade nem acompanhar seus resultados. A direção pretende transformar essas iniciativas em práticas institucionais permanentes. Que estratégia você adotaria para avaliar a maturidade em GC e orientar essa evolução organizacional?",
  },
  {
    title: "Decisões sem Conhecimento Integrado",
    description:
      "Gestores de diferentes setores utilizam informações e critérios distintos para tomar decisões, dificultando a coordenação institucional e o aprendizado organizacional. Conhecimentos relevantes existem, mas não chegam de forma estruturada aos responsáveis pelas decisões. Como você estruturaria uma intervenção de governança do conhecimento para melhorar esse processo e por quê?",
  },
  {
    title: "Governança para Inovação",
    description:
      "A organização deseja ampliar sua capacidade de inovação, mas ideias, experiências e conhecimentos permanecem dispersos entre equipes e projetos. Não há uma estrutura clara para transformar esse conhecimento em subsídio às decisões estratégicas. Que mecanismos de governança do conhecimento você implantaria para apoiar a inovação e como eles seriam aplicados?",
  },
],
 [ResearchArea.KNOWLEDGE_MGMT]: [
  {
    title: "Capital Intelectual em Risco",
    description:
      "A organização depende fortemente do conhecimento de profissionais experientes, mas parte desse conhecimento não está registrada nem compartilhada com as equipes. A saída de pessoas-chave começa a comprometer processos e resultados. Como especialista, que solução de gestão do conhecimento você implantaria para preservar e desenvolver esse capital intelectual, como ela funcionaria e por quê?",
  },
  {
    title: "Conhecimento que Não Circula",
    description:
      "As equipes acumulam experiências e conhecimentos relevantes durante os projetos, porém esse aprendizado permanece restrito aos grupos que participaram das atividades. Outros setores repetem erros e desenvolvem soluções que já existem internamente. Que estratégia você adotaria para ampliar o compartilhamento e a reutilização do conhecimento na organização?",
  },
  {
    title: "Planejamento sem Colaboração",
    description:
      "Os setores realizam seus planejamentos de forma isolada e utilizam pouco o conhecimento produzido por outras equipes. Como consequência, surgem atividades duplicadas, decisões desconectadas e baixa aprendizagem entre as áreas. Como você estruturaria um processo colaborativo de gestão do conhecimento para melhorar esse planejamento?",
  },
  {
    title: "Conhecimento em Processo de Mudança",
    description:
      "A organização está implantando novos processos e tecnologias, mas parte dos profissionais mantém práticas anteriores e encontra dificuldades para incorporar novos conhecimentos ao trabalho. A mudança começa a perder consistência entre os setores. Que ações de gestão do conhecimento você adotaria para apoiar essa transformação e por que seriam adequadas?",
  },
],
 [ResearchArea.INTEGRATION_ENG]: [
  {
    title: "Setores Desconectados",
    description:
      "Diferentes setores da organização executam processos relacionados, mas trabalham de forma isolada e utilizam sistemas que não se comunicam adequadamente. Informações precisam ser registradas mais de uma vez e decisões são prejudicadas pela falta de integração. Como especialista, que solução de integração você implantaria, como ela funcionaria e por que seria adequada?",
  },
  {
    title: "Rede de Aprendizagem Fragmentada",
    description:
      "Equipes distribuídas pela organização desenvolvem conhecimentos e soluções relevantes, porém existem poucas conexões entre esses grupos. Experiências permanecem restritas aos setores de origem e oportunidades de aprendizagem conjunta são perdidas. Como você estruturaria uma rede de aprendizagem capaz de integrar essas equipes e seus conhecimentos?",
  },
  {
    title: "Memória Organizacional Dispersa",
    description:
      "Conhecimentos importantes sobre projetos, decisões e experiências anteriores estão distribuídos entre documentos, sistemas e profissionais. Quando uma equipe precisa recuperar esse conhecimento, encontra informações fragmentadas ou depende de pessoas específicas. Como você estruturaria um Centro de Memória Viva para integrar, preservar e disponibilizar esse conhecimento?",
  },
  {
    title: "Sistemas sem Sincronização",
    description:
      "A organização utiliza diferentes sistemas para apoiar suas atividades, mas dados e informações não circulam adequadamente entre eles. Essa fragmentação provoca retrabalho, inconsistências e dificuldades na coordenação entre as áreas. Que estratégia de integração e sincronização você adotaria para conectar esses sistemas e melhorar o fluxo de informação?",
  },
],
 [ResearchArea.UCR]: [
  {
    title: "Educação Corporativa Desconectada",
    description:
      "A organização oferece ações de capacitação em diferentes unidades, mas os programas funcionam de forma isolada e o conhecimento produzido não circula entre os participantes. A instituição pretende transformar essas iniciativas em uma estrutura integrada de educação corporativa. Como você estruturaria uma Universidade Corporativa em Rede para conectar pessoas, conhecimentos e unidades organizacionais?",
  },
  {
    title: "Trilhas de Aprendizagem Fragmentadas",
    description:
      "Os profissionais participam de cursos e capacitações, porém não existe uma trajetória de desenvolvimento articulada às competências necessárias para suas funções. As ações educacionais ocorrem de forma pontual e com pouca continuidade. Como você estruturaria trilhas de aprendizagem em rede para promover o desenvolvimento contínuo dos profissionais?",
  },
  {
    title: "Sustentabilidade da Educação Corporativa",
    description:
      "A organização desenvolve diversos programas de aprendizagem, mas encontra dificuldades para manter essas iniciativas ao longo do tempo e demonstrar sua contribuição para os objetivos institucionais. Como especialista, que estratégia você adotaria para fortalecer a sustentabilidade da educação corporativa em rede e como ela seria aplicada?",
  },
  {
    title: "Ecossistema Digital de Aprendizagem",
    description:
      "A organização utiliza diferentes plataformas e recursos digitais para capacitação, mas esses ambientes funcionam de forma fragmentada e oferecem poucas oportunidades de interação e compartilhamento de conhecimento. Como você estruturaria um ecossistema digital de aprendizagem capaz de integrar tecnologias, pessoas e conhecimento em rede?",
  },
],
};

export const getGeminiFeedback = async (
  prompt: string,
  state: GameState,
  action: string,
  team: string[],
  area: ResearchArea
) => {
const model = "gemini-3-pro-preview";

  const UFSC_COLLECTION = "https://repositorio.ufsc.br/handle/123456789/76395";
const areaSources = getSourcesByArea(area);
  const sourcesContext = areaSources
  .map(
    (s) =>
      `Fonte: ${s.titulo} (${s.ano ?? "s.d."}) — ${s.autores}. Palavras-chave: ${s.palavrasChave.join(", ")}.`
  )
  .join("\n");
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
- Indique claramente se a proposta é CORRETA ou NEGATIVA

PRIORIDADE DE BUSCA (OBRIGATÓRIA):
1) PRIMEIRO: Repositório UFSC (DSpace) — coleção ENGIN/EGC: ${UFSC_COLLECTION}
   - Use a busca para encontrar teses/dissertações relacionadas ao DESAFIO e à PROPOSTA.
   - Prefira links do tipo: https://repositorio.ufsc.br/handle/...
2) Se NÃO houver evidência suficiente na UFSC: amplie para outras fontes acadêmicas abertas na web.

REGRAS:
- Se a resposta for genérica ou repetir o problema sem estratégia, o veredito é "NEGATIVA".
- Identifique conceitos técnicos (ex: 8'C, Auditoria do conhecimento, Governança etc.).
- Quando CORRETA: diga que a proposta corrobora com ao menos 1 autor/obra e cite.
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
      Fontes de referência para esta área:
${sourcesContext}

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
    console.error("ERRO GENERATE CHALLENGE:", error);
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
 const model = "gemini-3.8-flash";
  const subthemes = SUBTHEMES[area].join(", ");

  const instruction = `
Crie um desafio curto, realista e impactante para a área: "${area}".
Subtemas possíveis: ${subthemes}.

REGRAS CRÍTICAS:
1. Use o TEMPO PRESENTE.
   Exemplos:
   - "A organização enfrenta..."
   - "A equipe apresenta..."
   - "O sistema demonstra..."
   - "A empresa sofre..."

2. Seja CONCISO.
   O desafio completo deve ter no máximo 4 frases curtas.

3. Apresente uma situação-problema realista relacionada à área e aos subtemas informados.

4. NÃO apresente a solução.

5. A descrição deve obrigatoriamente terminar com uma MISSÃO CLARA para o jogador.

6. Essa missão deve exigir decisão, aplicação ou proposição de solução.
   Use perguntas como:
   - "Como especialista, o que você faria para enfrentar essa situação?"
   - "Que solução você implantaria e como ela seria aplicada?"
   - "Que estratégia você adotaria para resolver esse problema?"
   - "Como você estruturaria uma intervenção para melhorar essa situação?"
   - "Que ações você recomendaria e por quê?"

7. A pergunta final deve estar diretamente relacionada ao problema apresentado e à área "${area}".

8. Evite perguntas genéricas como:
   - "O que você acha?"
   - "Qual sua opinião?"
   - "O que faria?"
   sem explicar o contexto da decisão.

9. A missão deve estimular o jogador a explicar:
   - o que faria;
   - como aplicaria;
   - e por que essa solução seria adequada.

10. Não use linguagem excessivamente acadêmica ou complexa.
    O texto deve ser claro, aplicado e compatível com um jogo de tomada de decisão.

Retorne SOMENTE JSON válido neste formato:

{
  "title": "título curto do desafio",
  "description": "situação-problema + missão clara para o jogador"
}
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: instruction,
      config: { responseMimeType: "application/json" },
    });

    return JSON.parse(response.text || "{}");
} catch (error) {
  console.error("ERRO GENERATE CHALLENGE:", error);

  const challenges = FALLBACK_CHALLENGES[area];

  const storageKey = `nexus_last_challenge_${area}`;
  const lastIndexRaw = sessionStorage.getItem(storageKey);
  const lastIndex =
    lastIndexRaw !== null ? Number(lastIndexRaw) : -1;

  let randomIndex = Math.floor(Math.random() * challenges.length);

  // Impede que a mesma pergunta apareça duas vezes consecutivas.
  if (challenges.length > 1) {
    while (randomIndex === lastIndex) {
      randomIndex = Math.floor(Math.random() * challenges.length);
    }
  }

  sessionStorage.setItem(storageKey, String(randomIndex));

  return challenges[randomIndex];
}
};
