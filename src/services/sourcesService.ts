import { ResearchArea } from "../types";
import { EGC_SOURCES } from "../data/egcSources";
import { GC_SOURCES } from "../data/gcSources";

export type AnySource = (typeof EGC_SOURCES)[number] | (typeof GC_SOURCES)[number];

const ALL_SOURCES: AnySource[] = [...EGC_SOURCES, ...GC_SOURCES];

export function getSourcesByArea(area: ResearchArea): AnySource[] {
  return ALL_SOURCES.filter((s) => s.area === area);
}

export function searchSources(term: string, area?: ResearchArea): AnySource[] {
  const q = term.trim().toLowerCase();
  if (!q) return area ? getSourcesByArea(area) : ALL_SOURCES;

  const base = area ? getSourcesByArea(area) : ALL_SOURCES;

  return base.filter((s) => {
    const hay = [
      s.titulo,
      s.autores,
      s.instituicao,
      ...(s.palavrasChave ?? []),
      s.observacao ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return hay.includes(q);
  });
}

export function getAllSources(): AnySource[] {
  return ALL_SOURCES;
}
