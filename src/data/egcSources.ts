import { ResearchArea } from "../../types";

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
 *
 * Regra do projeto (conforme solicitado):
 * - Link pode ser geral do repositório, mas deve existir.
 * - Deve haver autores/título/ano e palavras-chave para melhorar o match.
 */
export const EGC_SOURCES: EGCSource[] = [
  {
    id: "egc-ufsc-gov-001",
    area: ResearchArea.GOVERNANCE_KNOWLEDGE,
    titulo: "Governança do Conhecimento em Organizações Públicas",
    autores:
      "Programa de Pós-Graduação em Engenharia e Gestão do Conhecimento (EGC/UFSC)",
    ano: 2021,
    instituicao: "Universidade Federal de Santa Catarina",
    tipo: "UFSC",
    link: "https://repositorio.ufsc.br/",
    palavrasChave: [
      "governança do conhecimento",
      "governança",
      "auditoria do conhecimento",
      "maturidade em GC",
      "maturidade organizacional",
      "estrutura de decisão",
      "decisão estratégica",
      "políticas de GC",
      "indicadores de GC",
      "compliance",
      "gestão pública",
      "organizações públicas",
    ],
    observacao:
      "Base conceitual para desafios de Governança do Conhecimento. Link geral do repositório (regra do projeto).",
  },
];
