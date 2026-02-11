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
 * Regra prática do jogo:
 * - link pode ser geral (repositório), mas deve existir.
 * - autores/título/ano/palavrasChave precisam estar preenchidos para dar match
 *   e para a recomendação aparecer no feedback.
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
    // Link geral (conforme sua regra). Mantido, mas sempre presente:
    link: "https://repositorio.ufsc.br/",
    // Palavras-chave mais “operacionais” para o evaluator casar com propostas reais:
    palavrasChave: [
      "governança do conhecimento",
      "governança",
      "auditoria do conhecimento",
      "maturidade em gestão do conhecimento",
      "maturidade em GC",
      "maturidade organizacional",
      "estrutura de decisão",
      "decisão estratégica",
      "políticas de GC",
      "compliance e conhecimento",
      "indicadores de GC",
      "modelo de governança",
      "setor público",
      "organizações públicas",
    ],
    observacao:
      "Base conceitual do EGC/UFSC para desafios de Governança do Conhecimento. Link direciona ao repositório geral (regra do projeto).",
  },
];

