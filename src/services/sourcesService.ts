import { ResearchArea } from "../../types";
import { EGC_SOURCES } from "../data/egcSources";
import { GC_SOURCES } from "../data/gcSources";

export type AnySource = (typeof EGC_SOURCES)[number] | (typeof GC_SOURCES)[number];

const ALL_SOURCES: AnySource[] = [...EGC_SOURCES, ...GC_SOURCES];

/**
 * Regra do jogo:
 * - Sempre devolver alguma fonte para evitar telas “sem autores/link”.
 * - Se não houver fontes cadastradas para o eixo (area), retorna fallback (ALL_SOURCES).
 */
export function getSourcesByArea(area: ResearchArea): AnySource[] {
  const filtered = ALL_SOURCES.filter((s) => s.area === area);
  return filtered.length > 0 ? filtered : ALL_SOURCES;
}

export function searchSources(term: string, area?: ResearchArea): AnySource[] {
  const q = term.trim().toLowerCase();
  if (!q) return area ? getSourcesByArea(area) : ALL_SOURCES;

  const base = area ? getSourcesByArea(area) : ALL_SOURCES;

  return base.filter((s) => {
    const hay = [
      s.titulo,
      s.autores,
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
  return ALL_SOURCES;
}
