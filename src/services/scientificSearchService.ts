// src/services/scientificSearchService.ts 

export type SourceType = "ufsc" | "external" | "mixed" | "none";

export type SearchQuery = {
  title: string;
  year?: number;
  authors?: string[];
  keywords?: string[];
};

export type Evidence = {
  title: string;
  authors: string[];
  year?: number;
  doi?: string;
  link: string;          // SEMPRE absoluto e funcional
  venue?: string;        // periódico / evento / repositório
  source: "UFSC" | "OpenAlex" | "Crossref" | "SemanticScholar" | "Other";
  confidence: number;    // 0..1
  ufscHandle?: string;   // quando aplicável
};

export type SearchTrace = {
  steps: Array<{ step: string; ok: boolean; note?: string }>;
};

export type SearchResult = {
  best: Evidence | null;
  candidates: Evidence[];
  sourceType: SourceType;
  trace: SearchTrace;
};

type FetchOpts = {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
};

const DEFAULT_FETCH: Required<FetchOpts> = {
  timeoutMs: 12000,
  retries: 1,
  retryDelayMs: 600,
};

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias
const CACHE_PREFIX = "nexus_scisearch_v1:";

// -------------------------
// Public API
// -------------------------
export async function scientificSearch(query: SearchQuery): Promise<SearchResult> {
  const trace: SearchTrace = { steps: [] };

  const normTitle = normalizeTitle(query.title);
  if (!normTitle) {
    trace.steps.push({ step: "normalize", ok: false, note: "Título vazio após normalização" });
    return { best: null, candidates: [], sourceType: "none", trace };
  }
  trace.steps.push({ step: "normalize", ok: true });

  const cacheKey = `${CACHE_PREFIX}${hashKey(`${normTitle}|${query.year ?? ""}`)}`;
  const cached = cacheRead<SearchResult>(cacheKey);
  if (cached) {
    trace.steps.push({ step: "cache", ok: true, note: "HIT" });
    // Mantém trace local também (útil p/ debug)
    return { ...cached, trace: mergeTrace(cached.trace, trace) };
  }
  trace.steps.push({ step: "cache", ok: true, note: "MISS" });

  // 1) UFSC-first
  const ufscCandidates = await searchUFSC(normTitle, query, trace);

  // Heurística “evidência suficiente”:
  // - tem handle OU
  // - título muito parecido + (autores ou ano) OU
  // - tem DOI e link bom
  const ufscBest = pickBest(ufscCandidates, normTitle, query);

  const ufscStrong = ufscBest ? isSufficientUFSC(ufscBest, normTitle, query) : false;

  // 2) Externos (somente se UFSC não sustentar)
  let externalCandidates: Evidence[] = [];
  if (!ufscStrong) {
    externalCandidates = await searchExternal(normTitle, query, trace);
  } else {
    trace.steps.push({ step: "external", ok: true, note: "skip (UFSC suficiente)" });
  }

  // 3) Merge + dedupe + score
  const all = dedupeByKey([...ufscCandidates, ...externalCandidates]);
  const best = pickBest(all, normTitle, query);

  const sourceType: SourceType =
    best?.source === "UFSC" ? "ufsc" : best ? (ufscCandidates.length ? "mixed" : "external") : "none";

  const result: SearchResult = {
    best: best ?? null,
    candidates: all.sort((a, b) => b.confidence - a.confidence).slice(0, 8),
    sourceType,
    trace,
  };

  cacheWrite(cacheKey, result, CACHE_TTL_MS);
  return result;
}

// -------------------------
// UFSC Provider (UFSC-first)
// -------------------------
async function searchUFSC(normTitle: string, query: SearchQuery, trace: SearchTrace): Promise<Evidence[]> {
  const out: Evidence[] = [];

  // Estratégia 1: busca por título no Repositório UFSC (página de busca)
  // Observação: endpoints podem variar; deixamos isolado para ajustar em um só lugar.
  // A ideia é: pegar HTML -> extrair links de handle e títulos.

  try {
    trace.steps.push({ step: "ufsc.search", ok: true, note: "try" });

    const searchUrl = buildUFSCSearchUrl(query.title);
    const html = await fetchText(searchUrl);

    const hits = parseUFSCSearchHtml(html);

    for (const h of hits) {
      const confidenceBase = titleSimilarity(normTitle, normalizeTitle(h.title));
      if (confidenceBase < 0.72) continue;

      const link = ensureAbsolute(h.link);
      const handle = extractHandle(link);

      out.push({
        title: h.title,
        authors: h.authors ?? [],
        year: h.year,
        link: preferHandleLink(handle, link),
        ufscHandle: handle ?? undefined,
        source: "UFSC",
        confidence: clamp01(confidenceBase + (handle ? 0.15 : 0.0)),
      });
    }

    trace.steps.push({ step: "ufsc.search", ok: true, note: `hits=${out.length}` });
  } catch (e: any) {
    trace.steps.push({ step: "ufsc.search", ok: false, note: String(e?.message ?? e) });
  }

  // Estratégia 2 (opcional futuro): se achou handle, tentar “metadata page”
  // para extrair autores/ano/doi com mais precisão.
  // Mantive comentado para não “inventar endpoint” agora.
  //
  // for (const ev of out) {
  //   if (!ev.ufscHandle) continue;
  //   // fetch metadata page, refine...
  // }

  return out;
}

function buildUFSCSearchUrl(originalTitle: string): string {
  // Ajuste fino depois (1 lugar só).
  // Exemplo comum em DSpace: /simple-search?query=...
  const q = encodeURIComponent(originalTitle.trim());
  return `https://repositorio.ufsc.br/simple-search?query=${q}`;
}

function parseUFSCSearchHtml(html: string): Array<{ title: string; link: string; authors?: string[]; year?: number }> {
  // Parser leve por regex (browser). Se quiser robustez total, trocamos por DOMParser.
  // A meta aqui é: extrair itens com link para /handle/...
  const results: Array<{ title: string; link: string; authors?: string[]; year?: number }> = [];

  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const anchors = Array.from(doc.querySelectorAll("a"))
      .map(a => ({ text: (a.textContent ?? "").trim(), href: a.getAttribute("href") ?? "" }))
      .filter(x => x.href.includes("/handle/") && x.text.length > 8);

    // Deduz autores/ano se estiver próximo no DOM (best-effort)
    for (const a of anchors.slice(0, 10)) {
      const link = a.href.startsWith("http") ? a.href : `https://repositorio.ufsc.br${a.href}`;
      results.push({ title: a.text, link });
    }
  } catch {
    // se falhar, retorna vazio
  }

  return results;
}

function isSufficientUFSC(ev: Evidence, normTitle: string, query: SearchQuery): boolean {
  const sim = titleSimilarity(normTitle, normalizeTitle(ev.title));
  const hasHandle = !!ev.ufscHandle;
  const hasAuthors = (ev.authors?.length ?? 0) >= 1;
  const yearMatch = query.year ? ev.year === query.year : true;

  // “UFSC suficiente” = handle + sim alta, ou sim muito alta + (autor/ano)
  if (hasHandle && sim >= 0.78) return true;
  if (sim >= 0.88 && (hasAuthors || yearMatch)) return true;
  return false;
}

// -------------------------
// External Providers (fallback)
// -------------------------
async function searchExternal(normTitle: string, query: SearchQuery, trace: SearchTrace): Promise<Evidence[]> {
  const out: Evidence[] = [];

  // OpenAlex
  try {
    trace.steps.push({ step: "openalex.search", ok: true, note: "try" });
    const oa = await searchOpenAlex(query.title);
    out.push(...oa.map(x => scoreExternal(x, normTitle, query)));
    trace.steps.push({ step: "openalex.search", ok: true, note: `hits=${oa.length}` });
  } catch (e: any) {
    trace.steps.push({ step: "openalex.search", ok: false, note: String(e?.message ?? e) });
  }

  // Crossref
  try {
    trace.steps.push({ step: "crossref.search", ok: true, note: "try" });
    const cr = await searchCrossref(query.title);
    out.push(...cr.map(x => scoreExternal(x, normTitle, query)));
    trace.steps.push({ step: "crossref.search", ok: true, note: `hits=${cr.length}` });
  } catch (e: any) {
    trace.steps.push({ step: "crossref.search", ok: false, note: String(e?.message ?? e) });
  }

  return out;
}

async function searchOpenAlex(title: string): Promise<Evidence[]> {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(title)}&per-page=5`;
  const data = await fetchJson<any>(url);

  const results = Array.isArray(data?.results) ? data.results : [];
  return results.map((r: any) => {
    const doiRaw = (r?.doi ?? "").replace(/^https?:\/\/doi\.org\//i, "").trim();
    const doi = doiRaw || undefined;
    const link = doi ? `https://doi.org/${doi}` : (r?.primary_location?.landing_page_url ?? "");
    const authors =
      Array.isArray(r?.authorships)
        ? r.authorships.map((a: any) => a?.author?.display_name).filter(Boolean)
        : [];

    const year = typeof r?.publication_year === "number" ? r.publication_year : undefined;

    return {
      title: r?.title ?? "Referência",
      authors,
      year,
      doi,
      link: ensureAbsolute(link),
      venue: r?.primary_location?.source?.display_name ?? undefined,
      source: "OpenAlex" as const,
      confidence: 0.5,
    };
  }).filter((e: Evidence) => !!e.link);
}

async function searchCrossref(title: string): Promise<Evidence[]> {
  const url = `https://api.crossref.org/works?query.title=${encodeURIComponent(title)}&rows=5`;
  const data = await fetchJson<any>(url);

  const items = Array.isArray(data?.message?.items) ? data.message.items : [];
  return items.map((it: any) => {
    const doi = (it?.DOI ?? "").trim() || undefined;
    const link = doi ? `https://doi.org/${doi}` : "";
    const authors =
      Array.isArray(it?.author)
        ? it.author.map((a: any) => `${a?.given ?? ""} ${a?.family ?? ""}`.trim()).filter(Boolean)
        : [];

    const year =
      Array.isArray(it?.issued?.["date-parts"]) && Array.isArray(it.issued["date-parts"][0])
        ? Number(it.issued["date-parts"][0][0])
        : undefined;

    const titleStr = Array.isArray(it?.title) ? (it.title[0] ?? "Referência") : (it?.title ?? "Referência");

    return {
      title: titleStr,
      authors,
      year,
      doi,
      link: ensureAbsolute(link),
      venue: Array.isArray(it?.container-title) ? it["container-title"][0] : it?.["container-title"],
      source: "Crossref" as const,
      confidence: 0.45,
    };
  }).filter((e: Evidence) => !!e.link);
}

function scoreExternal(ev: Evidence, normTitle: string, query: SearchQuery): Evidence {
  const sim = titleSimilarity(normTitle, normalizeTitle(ev.title));
  const hasDoi = !!ev.doi;

  let bonus = 0;
  if (hasDoi) bonus += 0.18;
  if (query.year && ev.year && query.year === ev.year) bonus += 0.08;
  if ((ev.authors?.length ?? 0) >= 1) bonus += 0.05;

  return { ...ev, confidence: clamp01(sim * 0.75 + bonus) };
}

// -------------------------
// Ranking / Dedupe
// -------------------------
function pickBest(cands: Evidence[], normTitle: string, query: SearchQuery): Evidence | null {
  if (!cands.length) return null;

  const scored = cands.map(c => {
    const sim = titleSimilarity(normTitle, normalizeTitle(c.title));
    const doiBonus = c.doi ? 0.08 : 0;
    const handleBonus = c.ufscHandle ? 0.10 : 0;
    const yearBonus = query.year && c.year && query.year === c.year ? 0.06 : 0;

    const conf = clamp01(Math.max(c.confidence, sim * 0.7 + doiBonus + handleBonus + yearBonus));
    return { ...c, confidence: conf, link: preferBestLink(c) };
  });

  scored.sort((a, b) => b.confidence - a.confidence);

  // Garante link funcional preferindo DOI/handle
  const best = scored[0];
  if (!best.link || best.link === "https://repositorio.ufsc.br/") return null;
  return best;
}

function preferBestLink(e: Evidence): string {
  if (e.doi) return `https://doi.org/${e.doi.replace(/^https?:\/\/doi\.org\//i, "").trim()}`;
  if (e.ufscHandle) return `https://repositorio.ufsc.br/handle/${e.ufscHandle}`;
  return ensureAbsolute(e.link);
}

function dedupeByKey(items: Evidence[]): Evidence[] {
  const map = new Map<string, Evidence>();

  for (const it of items) {
    const doiKey = it.doi ? `doi:${it.doi.toLowerCase().trim()}` : "";
    const handleKey = it.ufscHandle ? `handle:${it.ufscHandle.trim()}` : "";
    const titleKey = `t:${normalizeTitle(it.title)}`;

    const key = doiKey || handleKey || titleKey;

    const prev = map.get(key);
    if (!prev || it.confidence > prev.confidence) map.set(key, it);
  }

  return Array.from(map.values());
}

// -------------------------
// Utilities (fetch/cache/normalize)
// -------------------------
async function fetchText(url: string, opts: FetchOpts = {}): Promise<string> {
  const o = { ...DEFAULT_FETCH, ...opts };
  let lastErr: any = null;

  for (let i = 0; i <= o.retries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), o.timeoutMs);

      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);

      if (!res.ok) throw new Error(`HTTP ${res.status} (${url})`);
      return await res.text();
    } catch (e) {
      lastErr = e;
      if (i < o.retries) await sleep(o.retryDelayMs);
    }
  }
  throw lastErr;
}

async function fetchJson<T>(url: string, opts: FetchOpts = {}): Promise<T> {
  const txt = await fetchText(url, opts);
  return JSON.parse(txt) as T;
}

function cacheRead<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.exp || Date.now() > parsed.exp) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.val as T;
  } catch {
    return null;
  }
}

function cacheWrite<T>(key: string, val: T, ttlMs: number) {
  try {
    localStorage.setItem(key, JSON.stringify({ exp: Date.now() + ttlMs, val }));
  } catch {
    // ignora (quota)
  }
}

function normalizeTitle(title: string): string {
  return (title ?? "")
    .toString()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[“”"]/g, "")
    .replace(/[’']/g, "")
    .toLowerCase();
}

function ensureAbsolute(url: string): string {
  const u = (url ?? "").trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("//")) return `https:${u}`;
  return u.startsWith("http") ? u : u;
}

function extractHandle(url: string): string | null {
  const m = url.match(/\/handle\/([^?#]+)/i);
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}

function preferHandleLink(handle: string | null, fallback: string): string {
  if (handle) return `https://repositorio.ufsc.br/handle/${handle}`;
  const abs = ensureAbsolute(fallback);
  // evita link genérico raiz
  if (abs === "https://repositorio.ufsc.br/" || abs === "https://repositorio.ufsc.br") return "";
  return abs;
}

function titleSimilarity(a: string, b: string): number {
  // Similaridade simples (Jaccard de tokens) — suficiente para ranking inicial.
  const A = new Set(a.split(" ").filter(t => t.length >= 3));
  const B = new Set(b.split(" ").filter(t => t.length >= 3));
  if (!A.size || !B.size) return 0;

  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;

  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function hashKey(s: string): string {
  // hash leve (não cripto)
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function mergeTrace(a: SearchTrace, b: SearchTrace): SearchTrace {
  return { steps: [...(a?.steps ?? []), ...(b?.steps ?? [])] };
}
