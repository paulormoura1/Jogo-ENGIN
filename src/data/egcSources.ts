import { ResearchArea } from "../types";

export type SourceType = "UFSC" | "SCIELO" | "SCHOLAR" | "OUTRO";

export interface EGCSource {
  id: string;
  area: ResearchArea;
  titulo: string;
  autores: string;
  ano?: number;
  instituicao?: string;
  tipo: SourceType;
  link?: string;
  palavrasChave: string[];
  observacao?: string;
}

/**
 * Base inicial de fontes científicas por área (EGC).
 * Conteúdo curado, auditável e evolutivo.
 */
export const EGC_SOURCES: EGCSource[] = [];
