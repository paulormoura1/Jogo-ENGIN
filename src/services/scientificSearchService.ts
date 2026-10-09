import { ResearchArea } from "../tipos";
import { researchPlan, topicalRelevance } from "./researchTopics";
import { dedupeReferences, normalizeDoi, safeArticleLink } from "./referenceUtils";
import { screenAbstractsLocally } from "./localReferenceValidation";

export type SourceType = "ufsc" | "external" | "mixed" | "none";
export type SearchQuery = {
  title: string; year?: number; authors?: string[]; keywords?: string[];
  area?: ResearchArea; challenge?: string; proposal?: string; limit?: number;
};
export type Evidence = {
  title: string; authors: string[]; year?: number; doi?: string; link: string;
  venue?: string; source: "UFSC" | "OpenAlex" | "Crossref";
  confidence: number; ufscHandle?: string; abstract?: string; topics?: string[];
  relevanceReason?: string; evidenceExcerpt?: string; semanticValidated?: boolean;
  validationMethod?: "local" | "gemini";
  documentType?: string;
  metadataVerified?: boolean;
};
export type SearchTrace = { steps: Array<{ step: string; ok: boolean; note?: string }> };
export type SearchResult = {
  best: Evidence | null; candidates: Evidence[]; sourceType: SourceType; trace: SearchTrace;
  validation: "semantic" | "local" | "none"; notice: string;
};

const API_BASE = (import.meta.env.VITE_RESEARCH_API_URL || `${import.meta.env.BASE_URL}api`).replace(/\/$/, "");
const STATIC_REFERENCES = import.meta.env.VITE_STATIC_REFERENCES === "true";
const inFlight = new Map<string, Promise<SearchResult>>();
const CACHE_PREFIX = "nexus_references_v9:";

export async function scientificSearch(query: SearchQuery): Promise<SearchResult> {
  const area = query.area;
  if (!area || !Object.values(ResearchArea).includes(area)) return emptyResult("Área de pesquisa não informada.");
  const key = JSON.stringify([API_BASE, STATIC_REFERENCES, import.meta.env.VITE_DISABLE_GEMINI === "true", area, query.challenge || query.title, query.proposal || "", query.limit || 4]);
  const cached = readCache(key);
  if (cached) return cached;
  const running = inFlight.get(key);
  if (running) return running;
  const work = runSearch(query, area).then(result => {
    // Provisional results expire quickly so an outage or key change can recover.
    try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ exp: Date.now() + (result.validation === "semantic" ? 86400000 : 60000), result })); } catch { /* optional storage */ }
    return result;
  }).finally(() => inFlight.delete(key));
  inFlight.set(key, work);
  return work;
}

async function runSearch(query: SearchQuery, area: ResearchArea): Promise<SearchResult> {
  const trace: SearchTrace = { steps: [] };
  const challenge = query.challenge || query.title;
  const plan = researchPlan(area, challenge);
  const limit = Math.max(3, Math.min(6, query.limit || 4));
  let ufscAvailable = true;
  let catalogDate = "";
  const ufscResults = STATIC_REFERENCES ? [await (async () => {
    try {
      const data = await fetchJson(`${import.meta.env.BASE_URL}ufsc-catalog.json`);
      if (data.version !== 1 || !Array.isArray(data.areas?.[area]) ||
          typeof data.retrievedAt !== "string" || !Number.isFinite(Date.parse(data.retrievedAt))) throw new Error("Catálogo inválido");
      catalogDate = new Date(data.retrievedAt).toLocaleDateString("pt-BR", { timeZone: "UTC" });
      const candidates = data.areas[area].filter((item: unknown): item is Evidence => validEvidence(item) &&
        (item as Evidence).source === "UFSC" && /^https:\/\/repositorio\.ufsc\.br\/(?:xmlui\/)?handle\/\d+\/\d+$/.test((item as Evidence).link));
      trace.steps.push({ step: "ufsc.catalog", ok: true, note: `${candidates.length} obras do catálogo de ${catalogDate}` });
      return candidates;
    } catch {
      ufscAvailable = false;
      trace.steps.push({ step: "ufsc.catalog", ok: false, note: "Catálogo indisponível" });
      return [];
    }
  })()] : await Promise.all(plan.ufscQueries.map(async term => {
    try {
      const data = await fetchJson(`${API_BASE}/ufsc?query=${encodeURIComponent(term)}`, 28000);
      if (!Array.isArray(data.candidates)) throw new Error("Resposta inválida do repositório");
      trace.steps.push({ step: "ufsc", ok: true, note: `${data.candidates.length} obras recuperadas` });
      return data.candidates.filter(validEvidence) as Evidence[];
    } catch {
      ufscAvailable = false;
      trace.steps.push({ step: "ufsc", ok: false, note: "Consulta ao repositório indisponível" });
      return [];
    }
  }));
  let ufsc = rank(dedupeReferences(ufscResults.flat()), area, challenge);
  const ufscValidation = await validateMeaning(ufsc, query, trace);
  ufsc = ufscValidation.candidates;
  // Fill a shortage even when UFSC returns a single good hit.
  let external: Evidence[] = [];
  let externalValidation: Awaited<ReturnType<typeof validateMeaning>> | undefined;
  if (ufsc.length < limit) {
    const results = await Promise.all(plan.externalQueries.flatMap(term => [
      collect("OpenAlex", () => searchOpenAlex(term), trace),
      collect("Crossref", () => searchCrossref(term), trace),
    ]));
    external = rank(dedupeReferences(results.flat()), area, challenge);
    externalValidation = await validateMeaning(external, query, trace);
    external = externalValidation.candidates;
  }
  const candidates = (await Promise.all(dedupeReferences([...ufsc, ...external]).slice(0, limit).map(item =>
    reconcileDoiMetadata(item, trace)))).filter((item): item is Evidence => item !== null);
  const semantic = candidates.length > 0 && candidates.every(item => item.semanticValidated);
  const sourceType: SourceType = candidates.length === 0 ? "none" : candidates.every(c => c.source === "UFSC") ? "ufsc" : candidates.some(c => c.source === "UFSC") ? "mixed" : "external";
  const notices: string[] = [];
  if (catalogDate) notices.push(`Obras da UFSC consultadas no catálogo atualizado em ${catalogDate}.`);
  if (!ufscAvailable) notices.push("Não foi possível consultar a UFSC nesta rodada; a busca foi ampliada para fontes acadêmicas abertas.");
  if (!semantic && candidates.length) notices.push("Estas leituras foram sugeridas pelo conteúdo dos resumos. A relação com a proposta precisa de revisão: abra as obras e confira se ajudam a responder ao desafio.");
  if (semantic) notices.push("Estas leituras foram sugeridas com ajuda de IA. Abra as obras e confira se ajudam a responder ao desafio.");
  if (trace.steps.some(step => ["OpenAlex", "Crossref"].includes(step.step) && !step.ok)) notices.push("Parte das fontes externas ficou indisponível; a busca pode estar incompleta.");
  if (candidates.length < 3) notices.push(`Foram encontradas ${candidates.length} obras relacionadas ao desafio. Outras leituras podem ser necessárias; a quantidade não altera sua nota.`);
  if ((ufscValidation.available || externalValidation?.available) && !candidates.length) notices.push("Nenhuma obra recuperada passou pela avaliação de pertinência ao desafio.");
  return { best: candidates[0] || null, candidates, sourceType, trace, validation: semantic ? "semantic" : candidates.length ? "local" : "none", notice: notices.join(" ") };
}

function rank(items: Evidence[], area: ResearchArea, challenge: string): Evidence[] {
  return items.filter(validEvidence).flatMap(item => {
    const doi = normalizeDoi(item.doi);
    const link = safeArticleLink(item.link) || (doi ? `https://doi.org/${doi}` : "");
    if (!item.title.trim() || !item.authors.some(a => a.trim()) || !link) return [];
    const match = topicalRelevance(area, challenge, item.title, item.abstract);
    if (match.score < 0.55) return [];
    return [{ ...item, doi: doi || undefined, link, confidence: match.score, topics: match.topics,
      semanticValidated: false }];
  }).sort((a, b) => b.confidence - a.confidence).slice(0, 24);
}

async function validateMeaning(candidates: Evidence[], query: SearchQuery, trace: SearchTrace) {
  if (!candidates.length) return { available: false, candidates };
  const local = () => {
    const screened = screenAbstractsLocally(candidates, query);
    trace.steps.push({ step: "local.abstracts", ok: true, note: `${screened.length} obras passaram pela triagem dos resumos` });
    return { available: false, candidates: screened };
  };
  if (STATIC_REFERENCES || import.meta.env.VITE_DISABLE_GEMINI === "true") return local();
  try {
    const data = await fetchJson(`${API_BASE}/validate`, 25000, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ area: query.area, challenge: query.challenge || query.title, proposal: query.proposal || "", candidates }),
    });
    if (!data.available) return local();
    if (!Array.isArray(data.matches)) throw new Error("Avaliação inválida");
    const accepted: Evidence[] = [];
    for (const match of data.matches) {
      const candidate = candidates[match.index];
      if (!Number.isInteger(match.index) || !candidate || typeof match.score !== "number" || !Number.isFinite(match.score) || match.score < 0.85 || match.score > 1 ||
          typeof match.reason !== "string" || !match.reason.trim() || typeof match.excerpt !== "string" || match.excerpt.trim().length < 40 || match.excerpt.length > 350) continue;
      const normalized = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
      if (!candidate.abstract || !normalized(candidate.abstract).includes(normalized(match.excerpt))) continue;
      accepted.push({ ...candidate, confidence: match.score, semanticValidated: true, validationMethod: "gemini", relevanceReason: match.reason, evidenceExcerpt: match.excerpt });
    }
    trace.steps.push({ step: "meaning", ok: true, note: `${accepted.length} obras pertinentes` });
    return { available: true, candidates: dedupeReferences(accepted).sort((a, b) => b.confidence - a.confidence) };
  } catch {
    trace.steps.push({ step: "meaning", ok: false, note: "Avaliação de conteúdo indisponível" });
    return local();
  }
}

async function collect(provider: string, operation: () => Promise<Evidence[]>, trace: SearchTrace) {
  try {
    const results = await operation();
    trace.steps.push({ step: provider, ok: true, note: `${results.length} obras recuperadas` });
    return results;
  } catch {
    trace.steps.push({ step: provider, ok: false, note: "Fonte indisponível nesta tentativa" });
    return [];
  }
}

function decodeAbstract(index: Record<string, number[]> | undefined) {
  if (!index) return "";
  const words: string[] = [];
  for (const [word, positions] of Object.entries(index)) if (Array.isArray(positions))
    for (const pos of positions) if (Number.isInteger(pos) && pos >= 0 && pos < 20000) words[pos] = word;
  return words.join(" ").replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
}

async function searchOpenAlex(term: string): Promise<Evidence[]> {
  const params = new URLSearchParams({ search: term, "per-page": "15", filter: "is_retracted:false" });
  const data = await fetchJson(`https://api.openalex.org/works?${params}`);
  return (Array.isArray(data.results) ? data.results : []).flatMap((work: any) => {
    if (!["article", "dissertation", "book", "book-chapter", "review"].includes(work.type)) return [];
    const doi = normalizeDoi(work.doi);
    return [{ title: work.title || work.display_name || "", authors: (work.authorships || []).map((a: any) => a.author?.display_name).filter(Boolean),
      year: work.publication_year, doi: doi || undefined,
      link: doi ? `https://doi.org/${doi}` : work.primary_location?.landing_page_url || work.best_oa_location?.landing_page_url || "",
      abstract: decodeAbstract(work.abstract_inverted_index), venue: work.primary_location?.source?.display_name,
      source: "OpenAlex" as const, confidence: 0, documentType: documentLabel(work.type) }];
  });
}

async function searchCrossref(term: string): Promise<Evidence[]> {
  const params = new URLSearchParams({ "query.bibliographic": term, rows: "15" });
  const data = await fetchJson(`https://api.crossref.org/works?${params}`);
  return (Array.isArray(data.message?.items) ? data.message.items : []).flatMap((work: any) => {
    if (!["journal-article", "proceedings-article", "dissertation", "book", "book-chapter"].includes(work.type)) return [];
    if ((work.relation?.["is-retracted-by"] || []).length || (work["update-to"] || []).some((u: any) => u.type === "retraction")) return [];
    const doi = normalizeDoi(work.DOI);
    return [{ title: work.title?.[0] || "", authors: (work.author || []).map((a: any) => [a.given, a.family].filter(Boolean).join(" ") || a.name).filter(Boolean),
      year: work.issued?.["date-parts"]?.[0]?.[0], doi: doi || undefined, link: doi ? `https://doi.org/${doi}` : "",
      abstract: stripMarkup(work.abstract || ""), venue: work["container-title"]?.[0], source: "Crossref" as const, confidence: 0, documentType: documentLabel(work.type) }];
  });
}

function stripMarkup(html: string): string {
  return new DOMParser().parseFromString(html, "text/html").body.textContent?.replace(/\s+/g, " ").trim() || "";
}

async function reconcileDoiMetadata(item: Evidence, trace: SearchTrace): Promise<Evidence | null> {
  if (item.source !== "OpenAlex" || !item.doi) return item;
  try {
    const { message: work } = await fetchJson(`https://api.crossref.org/works/${encodeURIComponent(item.doi)}`);
    if (normalizeDoi(work?.DOI) !== item.doi) return item;
    if ((work.relation?.["is-retracted-by"] || []).length) return null;
    const title = work.title?.[0];
    if (typeof title !== "string") return item;
    const words = (value: string) => value.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(word => word.length > 3);
    const current = words(item.title); const canonical = new Set(words(title));
    // Do not attach an unrelated abstract to a DOI record with a different title.
    if (!current.length || current.filter(word => canonical.has(word)).length / current.length < 0.6) return null;
    const authors = (Array.isArray(work.author) ? work.author : []).map((author: any) =>
      [author.given, author.family].filter(value => typeof value === "string").join(" ") || author.name).filter((name: unknown) => typeof name === "string" && name.trim());
    if (!authors.length) return item;
    trace.steps.push({ step: "doi.metadata", ok: true, note: "Autoria conferida no registro DOI" });
    return { ...item, title, authors, year: work.issued?.["date-parts"]?.[0]?.[0] || item.year,
      documentType: documentLabel(work.type), metadataVerified: true };
  } catch {
    trace.steps.push({ step: "doi.metadata", ok: false, note: "Não foi possível conferir os metadados no registro DOI" });
    return item;
  }
}

async function fetchJson(url: string, timeoutMs = 12000, options: RequestInit = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: ctrl.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally { clearTimeout(timer); }
}

function readCache(key: string): SearchResult | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    const cached = raw ? JSON.parse(raw) : null;
    return cached?.exp > Date.now() && typeof cached.result?.notice === "string" &&
      Array.isArray(cached.result?.candidates) && cached.result.candidates.every(validEvidence) ? cached.result : null;
  } catch { return null; }
}

function validEvidence(item: any): item is Evidence {
  return item && typeof item.title === "string" && typeof item.link === "string" &&
    Array.isArray(item.authors) && item.authors.every((author: unknown) => typeof author === "string") &&
    (item.abstract === undefined || typeof item.abstract === "string") &&
    ["venue", "documentType", "relevanceReason", "evidenceExcerpt"].every(field => item[field] === undefined || typeof item[field] === "string") &&
    (item.year === undefined || Number.isFinite(item.year)) &&
    ["UFSC", "OpenAlex", "Crossref"].includes(item.source);
}

function documentLabel(type: string): string {
  return ({ article: "Artigo", "journal-article": "Artigo", dissertation: "Tese ou dissertação", book: "Livro",
    "book-chapter": "Capítulo de livro", review: "Revisão", "proceedings-article": "Trabalho em evento" } as Record<string, string>)[type] || "Obra acadêmica";
}

function emptyResult(notice: string): SearchResult {
  return { best: null, candidates: [], sourceType: "none", validation: "none", notice, trace: { steps: [] } };
}
