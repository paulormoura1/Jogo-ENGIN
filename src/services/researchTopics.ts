import { ResearchArea } from "../tipos";

export const normalizeText = (value: string) => value.normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

// Match concept stems at a word boundary ("loss" must not match "glossary").
export const hasConcept = (normalized: string, term: string) => (` ${normalized}`).includes(` ${term}`);

const AREAS: Record<ResearchArea, { searches: string[]; domains: string[][] }> = {
  [ResearchArea.GOVERNANCE_KNOWLEDGE]: {
    searches: ["governança do conhecimento", "knowledge governance"],
    domains: [["governanca", "conhecimento"], ["governance", "knowledge"]],
  },
  [ResearchArea.KNOWLEDGE_MGMT]: {
    searches: ["gestão do conhecimento", "knowledge management"],
    domains: [["gestao", "conhecimento"], ["knowledge", "management"], ["capital", "intelectual"], ["intellectual", "capital"]],
  },
  [ResearchArea.INTEGRATION_ENG]: {
    searches: ["integração do conhecimento", "organizational knowledge integration"],
    domains: [["integracao", "conhecimento"], ["integration", "knowledge"], ["integracao", "organizacional"], ["integration", "organizational"], ["engenharia", "integracao"]],
  },
  [ResearchArea.UCR]: {
    searches: ["universidade corporativa em rede", "corporate university learning network"],
    domains: [["universidade", "corporativa"], ["corporate", "university"], ["educacao", "corporativa"], ["corporate", "education"]],
  },
};

const TOPICS = [
  { triggers: ["reten", "reter", "perd", "saida", "rotativ", "deixara"], pt: "retenção do conhecimento", en: "knowledge retention", terms: ["retenc", "retention", "perda", "loss", "turnover", "rotativ"] },
  { triggers: ["compartilh", "troca", "circul", "colabor", "silos"], pt: "compartilhamento do conhecimento", en: "knowledge sharing", terms: ["compartilh", "sharing", "colaboracao", "colaborativ", "collaboration", "collaborative", "silo", "transfer"] },
  { triggers: ["aprendiz", "capacit", "competenc", "curso", "educa", "formacao"], pt: "aprendizagem organizacional", en: "organizational learning", terms: ["aprendiz", "learning", "competenc", "training", "capacit", "educa"] },
  { triggers: ["memoria", "registro", "document", "licoes", "experiencia"], pt: "memória organizacional", en: "organizational memory", terms: ["memoria", "memory", "document", "licoes", "lessons", "experience", "experiencia"] },
  { triggers: ["integr", "conect", "interoper", "fragment", "sistema"], pt: "integração do conhecimento", en: "knowledge integration", terms: ["integra", "interoper", "fragment", "conect", "connect"] },
  { triggers: ["govern", "politica", "diretri", "responsav", "coordena"], pt: "governança do conhecimento", en: "knowledge governance", terms: ["govern", "politic", "polic", "diretri", "respons", "coordina", "coordena"] },
  { triggers: ["indicador", "avali", "matur", "monitor", "medir"], pt: "maturidade do conhecimento", en: "knowledge management maturity", terms: ["matur", "avali", "evaluat", "assess", "monitor", "indicator", "indicador"] },
  { triggers: ["inov", "criacao", "novas ideias"], pt: "inovação organizacional", en: "organizational innovation", terms: ["inova", "innova", "creation", "criacao"] },
  { triggers: ["deciso", "decidir", "decisao", "criterio"], pt: "tomada de decisão", en: "decision making", terms: ["decis", "decision", "criter", "judgment"] },
  { triggers: ["acesso", "disponiv", "informac", "contatos pessoais"], pt: "acesso à informação", en: "information access", terms: ["acesso", "access", "disponib", "availability", "information flow", "fluxo de informacao"] },
];

export function researchPlan(area: ResearchArea, challenge = "") {
  const text = normalizeText(challenge);
  const topics = TOPICS.filter(topic => topic.triggers.some(term => hasConcept(text, term)));
  const base = AREAS[area];
  return {
    domains: base.domains, topics,
    ufscQueries: [`"${base.searches[0]}"`, ...topics.slice(0, 2).map(t => `"${base.searches[0]}" "${t.pt}"`)],
    externalQueries: [base.searches[1], ...topics.slice(0, 2).map(t => `${base.searches[1]} ${t.en}`)],
  };
}

export function topicalRelevance(area: ResearchArea, challenge: string, title: string, abstract = "") {
  const plan = researchPlan(area, challenge);
  const text = normalizeText(`${title} ${abstract}`);
  const domain = plan.domains.some(group => group.every(term => hasConcept(text, term)));
  if (!domain) return { score: 0, topics: [] as string[] };
  const matched = plan.topics.filter(topic => topic.terms.some(term => hasConcept(text, term)));
  if (plan.topics.length && !matched.length) return { score: 0, topics: [] as string[] };
  return { score: Math.min(0.85, 0.55 + matched.length * 0.1), topics: matched.map(t => t.pt) };
}
