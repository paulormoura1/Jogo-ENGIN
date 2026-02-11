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

export const EGC_SOURCES: EGCSource[] = [

  /**
   * ================================
   * GOVERNANÇA DO CONHECIMENTO
   * ================================
   */
  {
    id: "egc-gov-001",
    area: ResearchArea.GOVERNANCE_KNOWLEDGE,
    titulo: "Governança do Conhecimento em Organizações Públicas",
    autores: "Programa EGC/UFSC",
    ano: 2021,
    instituicao: "UFSC",
    tipo: "UFSC",
    link: "https://repositorio.ufsc.br/",
    palavrasChave: [
      "governança",
      "governança do conhecimento",
      "maturidade em GC",
      "indicadores estratégicos",
      "decisão organizacional",
      "políticas institucionais"
    ],
    observacao: "Referência conceitual aplicada à governança estratégica do conhecimento."
  },

  /**
   * ================================
   * GESTÃO DO CONHECIMENTO
   * ================================
   */
  {
    id: "egc-gc-001",
    area: ResearchArea.KNOWLEDGE_MGMT,
    titulo: "Gestão do Conhecimento e Capital Intelectual",
    autores: "Angeloni, M. T.",
    ano: 2020,
    instituicao: "UFSC",
    tipo: "UFSC",
    link: "https://repositorio.ufsc.br/",
    palavrasChave: [
      "gestão do conhecimento",
      "capital intelectual",
      "aprendizagem organizacional",
      "memória organizacional",
      "criação de conhecimento",
      "compartilhamento"
    ],
    observacao: "Base clássica aplicada à GC organizacional."
  },

  /**
   * ================================
   * ENGENHARIA DA INTEGRAÇÃO
   * ================================
   */
  {
    id: "egc-int-001",
    area: ResearchArea.INTEGRATION_ENG,
    titulo: "Engenharia da Integração: Modelos Sistêmicos para Ecossistemas Organizacionais",
    autores: "Silva, R. B.; Bresolin, J.",
    ano: 2019,
    instituicao: "UFSC",
    tipo: "UFSC",
    link: "https://repositorio.ufsc.br/",
    palavrasChave: [
      "engenharia da integração",
      "integração organizacional",
      "sistemas complexos",
      "ecossistemas de inovação",
      "modelagem sistêmica",
      "arquitetura organizacional"
    ],
    observacao: "Referência aplicada à integração entre áreas e sistemas institucionais."
  },

  /**
   * ================================
   * UNIVERSIDADE CORPORATIVA EM REDE
   * ================================
   */
  {
    id: "egc-ucr-001",
    area: ResearchArea.UCR,
    titulo: "Universidade Corporativa em Rede e Aprendizagem Organizacional",
    autores: "Bresolin, J.; Silva, R. B.",
    ano: 2022,
    instituicao: "UFSC",
    tipo: "UFSC",
    link: "https://repositorio.ufsc.br/",
    palavrasChave: [
      "universidade corporativa",
      "universidade em rede",
      "educação corporativa",
      "aprendizagem em rede",
      "competências organizacionais",
      "inovação educacional"
    ],
    observacao: "Base conceitual para desafios relacionados à educação corporativa em rede."
  }
];

];
