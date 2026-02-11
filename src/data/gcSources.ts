import { ResearchArea } from "../../types";

/**
 * Tipos de fonte aceitos no jogo
 */
export type SourceType = "UFSC" | "SCIELO" | "SCHOLAR" | "OUTRO";

/**
 * Estrutura base de uma fonte científica
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
 *
 * Regra do projeto (conforme solicitado):
 * - Link pode ser geral do repositório, mas o item deve trazer autores + ano + tema.
 */
export const GC_SOURCES: EGCSource[] = [
  {
    id: "gc-ufsc-km-001",
    area: ResearchArea.KNOWLEDGE_MGMT,
    titulo: "Gestão do Conhecimento em Organizações Intensivas em Conhecimento",
    autores: "Angeloni, M. T.; Fernandes, R. B.",
    ano: 2020,
    instituicao: "Universidade Federal de Santa Catarina",
    tipo: "UFSC",
    link: "https://repositorio.ufsc.br/",
    palavrasChave: [
      "gestão do conhecimento",
      "GC",
      "capital intelectual",
      "aprendizagem organizacional",
      "tomada de decisão",
      "criação de conhecimento",
      "compartilhamento de conhecimento",
      "memória organizacional",
    ],
    observacao: "Base conceitual utilizada em disciplinas e desafios de GC. Link geral do repositório (regra do projeto).",
  },
];
