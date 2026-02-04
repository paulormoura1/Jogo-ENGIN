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
 * Base curada de fontes por área (EGC).
 * Você pode preencher aos poucos, mantendo auditabilidade e controle acadêmico.
 */
export const EGC_SOURCES: EGCSource[] = [
  // GOVERNANÇA DO CONHECIMENTO
  {
    id: "gc-001",
    area: ResearchArea.GOVERNANCE_KNOWLEDGE,
    titulo: "Base curada – Governança do Conhecimento (placeholder)",
    autores: "A definir",
    ano: 2024,
    instituicao: "UFSC (a inserir)",
    tipo: "UFSC",
    link: "",
    palavrasChave: ["governança", "auditoria do conhecimento", "maturidade", "decisão"],
    observacao: "Substituir por item real do repositório UFSC quando você enviar os links."
  },

  // GESTÃO DO CONHECIMENTO
  {
    id: "gk-001",
    area: ResearchArea.KNOWLEDGE_MGMT,
    titulo: "Base curada – Gestão do Conhecimento (placeholder)",
    autores: "A definir",
    ano: 2024,
    instituicao: "UFSC (a inserir)",
    tipo: "UFSC",
    link: "",
    palavrasChave: ["capital intelectual", "framework", "BCP", "mudança"],
    observacao: "Substituir por item real (UFSC/SciELO/externo) quando você enviar as fontes."
  },

  // ENGENHARIA DA INTEGRAÇÃO
  {
    id: "ei-001",
    area: ResearchArea.INTEGRATION_ENG,
    titulo: "Base curada – Engenharia da Integração (placeholder)",
    autores: "A definir",
    ano: 2024,
    instituicao: "UFSC (a inserir)",
    tipo: "UFSC",
    link: "",
    palavrasChave: ["integração", "interoperabilidade", "arquitetura", "dados"],
    observacao: "Substituir por item real do repositório UFSC e/ou externo científico."
  },

  // UNIVERSIDADE CORPORATIVA EM REDE
  {
    id: "ucr-001",
    area: ResearchArea.UCR,
    titulo: "Base curada – Universidade Corporativa em Rede (placeholder)",
    autores: "A definir",
    ano: 2024,
    instituicao: "UFSC (a inserir)",
    tipo: "OUTRO",
    link: "",
    palavrasChave: ["UCR", "ecossistema", "rede", "aprendizagem", "sustentabilidade"],
    observacao: "Substituir por item real quando você enviar fontes."
  }
];
