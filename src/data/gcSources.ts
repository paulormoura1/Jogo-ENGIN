import { ResearchArea } from "../../types";

/**
 * Tipos de fonte aceitos no jogo
 */
export type SourceType = "UFSC" | "SCIELO" | "SCHOLAR" | "OUTRO";

/**
 * Estrutura base de uma fonte científica do EGC
 */
export interface EGCSource {
  id: string;
  area: ResearchArea;
  titulo: string;
  autores: string;
  ano: number;
  instituicao: string;
  tipo: SourceType;
  link: string;
  palavrasChave: string[];
  observacao?: string;
}

/**
 * ================================
 * GESTÃO DO CONHECIMENTO
 * Base inicial curada
 * ================================
 */
export const GC_SOURCES: EGCSource[] = [
  {
    id: "gc-ufsc-001",
    area: ResearchArea.KNOWLEDGE_MGMT,
    titulo: "Gestão do Conhecimento em Organizações Intensivas em Conhecimento",
    autores: "Angeloni, M. T.; Fernandes, R. B.",
    ano: 2020,
    instituicao: "Universidade Federal de Santa Catarina",
    tipo: "UFSC",
    link: "https://repositorio.ufsc.br/",
    palavrasChave: [
      "gestão do conhecimento",
      "capital intelectual",
      "aprendizagem organizacional",
      "tomada de decisão"
    ],
    observacao: "Base conceitual clássica utilizada em disciplinas do EGC."
  }
];
