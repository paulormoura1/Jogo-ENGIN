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
export const EGC_SOURCES: EGCSource[] = [
  {
    id: "gc-ufsc-001",
    area: ResearchArea.GOVERNANCE_KNOWLEDGE,
    titulo: "Governança do Conhecimento em Organizações Públicas",
    autores: "Programa de Pós-Graduação em Engenharia e Gestão do Conhecimento (EGC/UFSC)",
    ano: 2021,
    instituicao: "Universidade Federal de Santa Catarina",
    tipo: "UFSC",
    link: "https://repositorio.ufsc.br/",
    palavrasChave: [
      "governança do conhecimento",
      "auditoria do conhecimento",
      "maturidade organizacional",
      "decisão estratégica"
    ],
    observacao: "Base conceitual utilizada como referência para desafios de Governança do Conhecimento."
  }
];

