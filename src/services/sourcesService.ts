import { scientificSearch } from "./scientificSearchService";
import { ResearchArea } from "../../types";
import { EGC_SOURCES } from "../data/egcSources";
import { GC_SOURCES } from "../data/gcSources";

export async function enrichSourceUFSCFirst(source: any) {
  const title = source?.titulo ?? source?.title ?? "";
  const year = typeof source?.ano === "number" ? source.ano : undefined;

  if (!title) return source;

  const res = await scientificSearch({ title, year });

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
  const filtered = all.filter((s) => s.area === area);
  return filtered.length > 0 ? filtered : all;
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
