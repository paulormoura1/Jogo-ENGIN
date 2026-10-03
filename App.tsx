import React, { useEffect, useRef, useState } from "react";
import { AREA_ICONS, RESEARCH_DESCRIPTIONS } from "./constants";
import { generateChallenge } from "./geminiService";
import { ActionRecord, Challenge, GamePhase, GameState, ResearchArea } from "./src/tipos";
import { getSourcesByArea } from "./src/services/sourcesService";
import { scientificSearch, SearchResult } from "./src/services/scientificSearchService";
import { ReferenceList, DisplayReference } from "./src/components/ReferenceList";
import { readStoredArray, writeStored } from "./src/services/browserStorage";
import { addRoundToRanking, RankingEntry } from "./src/services/ranking";

interface ExtendedActionRecord extends ActionRecord {
  references?: string[];
  sourceType?: string;
  timestamp: string;
  pointsEarned: number;
  usedSources: DisplayReference[];
  recommendedSources: DisplayReference[];
  referenceNotice?: string;
}

const evaluateProposalWithSources = (
  proposal: string,
  area: ResearchArea,
  challengeDescription: string
) => {
  const sources = getSourcesByArea(area);
  const text = (proposal || "").toLowerCase();

 const normalizeConcept = (value: string) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  
const challengeNormalized = normalizeConcept(challengeDescription);

  const isKnowledgeManagement =
  area === ResearchArea.KNOWLEDGE_MGMT;

  const isIntegrationEngineering =
  area === ResearchArea.INTEGRATION_ENG;

  const isUCR =
  area === ResearchArea.UCR;
  
const stopWords = new Set([
  "a", "o", "as", "os", "de", "da", "do", "das", "dos",
  "em", "e", "para", "por", "com", "um", "uma"
]);

const conceptRoots = (value: string) =>
  normalizeConcept(value)
    .split(" ")
    .filter((word) => word.length >= 4 && !stopWords.has(word))
    .map((word) => word.slice(0, 5));
const conceptualEquivalences: Record<string, string[]> = {
  "maturidade em gc": [
    "nivel de maturidade",
    "estagio de maturidade",
    "acompanhar a evolucao",
    "melhorar a gestao",
    "saber o que precisa melhorar",
  ],

  "processos de conhecimento": [
    "processos de gc",
    "praticas de gestao do conhecimento",
    "organizar o conhecimento",
    "organizar as informacoes",
    "melhorar as praticas",
  ],

  "mecanismos de governanca": [
    "mecanismos de decisao",
    "regras de governanca",
    "criterios de decisao",
    "criar regras",
    "estabelecer criterios",
    "definir como decidir",
  ],

  "estruturas de governanca": [
    "estrutura de decisao",
    "definicao de papeis",
    "definicao de responsaveis",
    "definir responsaveis",
    "dividir responsabilidades",
    "criar um grupo responsavel",
  ],

  "avaliacao e monitoramento": [
    "avaliacao de resultados",
    "acompanhamento de resultados",
    "monitoramento de resultados",
    "acompanhar resultados",
    "verificar se funciona",
    "avaliar o que melhorou",
  ],

  "compartilhamento do conhecimento": [
    "troca de conhecimento",
    "disseminacao do conhecimento",
    "circulacao do conhecimento",
    "trocar informacoes",
    "compartilhar experiencias",
    "passar conhecimento",
  ],

  "transferencia do conhecimento": [
    "transmissao do conhecimento",
    "repasse de conhecimento",
    "transferencia de saberes",
    "ensinar outros",
    "repassar conhecimento",
    "passar experiencia",
  ],

  "criacao do conhecimento": [
    "geracao de conhecimento",
    "producao de conhecimento",
    "criar novas ideias",
    "desenvolver solucoes",
    "aprender coisas novas",
  ],

  "retencao do conhecimento": [
    "preservacao do conhecimento",
    "manutencao do conhecimento",
    "guardar conhecimento",
    "registrar experiencias",
    "nao perder o que foi aprendido",
  ],

  "integracao do conhecimento": [
    "integracao de conhecimentos",
    "conexao de conhecimentos",
    "juntar informacoes",
    "conectar conhecimentos",
    "reunir o que cada area sabe",
  ],

  "politicas de gestao do conhecimento": [
    "diretrizes de gc",
    "normas de gestao do conhecimento",
    "politicas de conhecimento",
    "criar diretrizes",
    "estabelecer regras",
    "definir procedimentos",
  ],

  "coordenacao": [
    "articulacao entre areas",
    "integracao entre areas",
    "coordenacao entre setores",
    "integrar setores",
    "aproximar equipes",
    "fazer as areas trabalharem juntas",
  ],

  "responsabilidade e eficiencia": [
    "definicao de responsabilidades",
    "atribuicao de responsabilidades",
    "eficiencia organizacional",
    "definir quem faz o que",
    "definir responsaveis",
    "organizar responsabilidades",
  ],

  "transparencia": [
    "clareza das informacoes",
    "visibilidade das informacoes",
    "deixar informacoes claras",
    "facilitar acesso a informacao",
    "tornar as informacoes disponiveis",
  ],
    // GESTÃO DO CONHECIMENTO

  "gestao do conhecimento": [
    "organizar o conhecimento",
    "gerenciar o conhecimento",
    "administrar o conhecimento",
    "usar melhor o conhecimento",
    "aproveitar o conhecimento da empresa",
    "organizar o que as pessoas sabem",
  ],

  "gc": [
    "gestao do conhecimento",
    "gerenciar o conhecimento",
    "organizar o conhecimento",
    "usar o conhecimento da organizacao",
  ],

  "capital intelectual": [
    "conhecimento das pessoas",
    "conhecimento dos profissionais",
    "experiencia dos colaboradores",
    "saber dos funcionarios",
    "conhecimento da equipe",
    "valor do conhecimento das pessoas",
  ],

  "aprendizagem organizacional": [
    "aprendizado da organizacao",
    "aprendizado das equipes",
    "aprender com as experiencias",
    "aprender com os erros",
    "aprender com os resultados",
    "melhorar com o que foi aprendido",
  ],

  "tomada de decisao": [
    "processo de decisao",
    "apoiar decisoes",
    "melhorar as decisoes",
    "decidir melhor",
    "ajudar os gestores a decidir",
    "usar conhecimento para decidir",
  ],

  "criacao de conhecimento": [
    "geracao de conhecimento",
    "producao de conhecimento",
    "criar novas ideias",
    "desenvolver novos conhecimentos",
    "desenvolver solucoes",
    "produzir novos aprendizados",
  ],

  "compartilhamento de conhecimento": [
    "troca de conhecimento",
    "disseminacao do conhecimento",
    "circulacao do conhecimento",
    "trocar informacoes",
    "compartilhar experiencias",
    "passar conhecimento",
  ],

  "memoria organizacional": [
    "preservar o conhecimento da organizacao",
    "guardar o conhecimento da empresa",
    "manter o conhecimento registrado",
    "preservar experiencias",
    "guardar o que foi aprendido",
    "manter o historico de conhecimento",
        "memorias tacitas e documentais",
    "agregar memorias",
    "reunir conhecimentos da organizacao",
  ],

  "licoes aprendidas": [
    "aprendizados dos projetos",
    "registrar o que foi aprendido",
    "aprender com experiencias anteriores",
    "registrar erros e acertos",
    "usar experiencias anteriores",
    "aproveitar aprendizados anteriores",
  ],

  "comunidades de pratica": [
    "grupos de troca de conhecimento",
    "grupos de aprendizagem",
    "profissionais trocando experiencias",
    "reunir pessoas para compartilhar conhecimento",
    "grupos para compartilhar experiencias",
    "equipes aprendendo juntas",
  ],

  "reutilizacao do conhecimento": [
    "reaproveitar conhecimento",
    "usar novamente o conhecimento",
    "reutilizar experiencias",
    "aproveitar solucoes existentes",
    "usar o que ja foi aprendido",
    "evitar fazer novamente o que ja existe",
  ],

  "conhecimento tacito": [
    "conhecimento das pessoas",
    "conhecimento adquirido pela experiencia",
    "experiencia profissional",
    "saber pratico",
    "conhecimento que esta na experiencia",
    "o que o profissional sabe fazer",
  ],

  "conhecimento explicito": [
    "conhecimento documentado",
    "conhecimento registrado",
    "informacao documentada",
    "registrar o conhecimento",
    "documentar o que as pessoas sabem",
    "transformar conhecimento em documentos",
  ],

  "registro do conhecimento": [
    "documentacao do conhecimento",
    "registrar experiencias",
    "documentar experiencias",
    "guardar informacoes importantes",
    "registrar o que as pessoas sabem",
    "documentar o que foi aprendido",
  ],
  // ENGENHARIA DA INTEGRAÇÃO

"engenharia da integracao": [
  "integrar sistemas",
  "integrar processos",
  "integrar setores",
  "conectar sistemas",
  "conectar areas",
  "fazer sistemas trabalharem juntos",
],

"integracao organizacional": [
  "integrar a organizacao",
  "integrar diferentes areas",
  "conectar setores",
  "aproximar setores",
  "fazer as areas trabalharem juntas",
  "unir diferentes areas",
],

"integracao entre setores": [
  "conectar setores",
  "integrar setores",
  "ligar setores",
  "informacoes circularem entre setores",
  "dados circularem entre setores",
  "troca de informacoes entre setores",
],

"integracao de processos": [
  "conectar processos",
  "integrar os processos",
  "unificar processos",
  "articular processos",
  "processos trabalhando juntos",
  "conectar atividades",
],

"integracao de sistemas": [
  "conectar sistemas",
  "integrar os sistemas",
  "unificar sistemas",
  "sistemas conectados",
  "sistemas trabalhando juntos",
  "troca de dados entre sistemas",
],

"processos integrados": [
  "processos conectados",
  "processos trabalhando juntos",
  "atividades integradas",
  "conectar os processos",
  "unificar atividades",
  "fluxo integrado de processos",
],

"sistemas integrados": [
  "sistemas conectados",
  "sistemas sincronizados",
  "conectar os sistemas",
  "sincronizar sistemas",
  "sistemas compartilhando dados",
  "sistemas trocando informacoes",
],

"sistemas complexos": [
  "sistemas interligados",
  "sistemas conectados",
  "varios sistemas relacionados",
  "diferentes sistemas trabalhando juntos",
  "conjunto de sistemas",
],

"ecossistemas de inovacao": [
  "ambiente de inovacao",
  "rede de inovacao",
  "organizacoes trabalhando juntas para inovar",
  "integracao para inovacao",
  "colaboracao para inovacao",
],

"modelagem sistemica": [
  "visao do sistema como um todo",
  "analisar o conjunto",
  "entender as relacoes entre as partes",
  "mapear as conexoes",
  "mapear os processos",
  "visualizar como as partes se relacionam",
],

"arquitetura organizacional": [
  "estrutura da organizacao",
  "organizacao das areas",
  "estrutura entre setores",
  "organizar como as areas se conectam",
  "organizar os setores",
],

"arquitetura de integracao": [
  "estrutura para integrar sistemas",
  "forma de conectar sistemas",
  "estrutura de integracao",
  "modelo para integrar sistemas",
  "organizar a conexao entre sistemas",
],

"interoperabilidade": [
  "sistemas conversando entre si",
  "sistemas trocando dados",
  "sistemas compartilhando informacoes",
  "comunicacao entre sistemas",
  "permitir troca de dados entre sistemas",
  "fazer sistemas diferentes se comunicarem",
],

"fluxo de informacao": [
  "circulacao da informacao",
  "circulacao de informacoes",
  "informacoes circularem",
  "troca de informacoes",
  "compartilhar informacoes",
  "informacao chegar aos setores",
],

"conhecimento critico": [
  "conhecimento importante",
  "informacao critica",
  "conhecimento essencial",
  "informacoes importantes",
  "conhecimento necessario para os processos",
],

"coordenacao entre equipes": [
  "articulacao entre equipes",
  "integrar equipes",
  "equipes trabalhando juntas",
  "aproximar equipes",
  "coordenar o trabalho das equipes",
],

"conexao entre setores": [
  "ligar setores",
  "conectar as areas",
  "aproximar setores",
  "integrar departamentos",
  "comunicacao entre setores",
  "troca de dados entre setores",
],
  // UNIVERSIDADE CORPORATIVA EM REDE

"universidade corporativa": [
  "educacao corporativa",
  "formacao corporativa",
  "desenvolvimento dos colaboradores",
  "desenvolvimento profissional",
  "aprendizagem corporativa",
  "formacao dos profissionais",
],

"universidade em rede": [
  "educacao em rede",
  "aprendizagem distribuida",
  "conectar unidades",
  "integrar unidades",
  "aprendizagem entre unidades",
  "formacao em rede",
],

"educacao corporativa": [
  "formacao profissional",
  "capacitacao dos colaboradores",
  "desenvolvimento profissional",
  "aprendizagem corporativa",
  "educacao continuada",
  "formacao continuada",
],

"aprendizagem em rede": [
  "aprendizagem compartilhada",
  "aprendizagem entre equipes",
  "aprendizagem entre unidades",
  "aprender em conjunto",
  "troca de experiencias",
  "aprendizagem colaborativa",
],

"competencias organizacionais": [
  "competencias da organizacao",
  "competencias dos profissionais",
  "desenvolvimento de competencias",
  "desenvolver competencias",
  "formacao de competencias",
],

"inovacao educacional": [
  "inovacao na aprendizagem",
  "novas formas de aprender",
  "novas formas de ensinar",
  "novas praticas de aprendizagem",
  "tecnologias para aprendizagem",
],

"governanca em rede": [
  "coordenacao em rede",
  "gestao em rede",
  "articulacao entre unidades",
  "coordenacao entre unidades",
  "gestao compartilhada",
],

"integracao entre unidades": [
  "integrar unidades",
  "conectar unidades",
  "aproximar unidades",
  "articular unidades",
  "troca entre unidades",
],

"trilhas de aprendizagem": [
  "trajetorias de aprendizagem",
  "percurso de aprendizagem",
  "caminho de aprendizagem",
  "percurso de desenvolvimento",
  "caminho de desenvolvimento",
],

"rede de aprendizagem": [
  "aprendizagem compartilhada",
  "equipes aprendendo juntas",
  "aprendizagem colaborativa",
  "conectar pessoas para aprender",
  "troca de conhecimento entre equipes",
],

"ecossistema de aprendizagem": [
  "ambiente de aprendizagem",
  "ambiente integrado de aprendizagem",
  "rede de aprendizagem",
  "ambiente colaborativo de aprendizagem",
  "integracao de recursos de aprendizagem",
],

"colaboracao entre equipes": [
  "equipes trabalhando juntas",
  "trabalho colaborativo",
  "colaboracao entre grupos",
  "cooperacao entre equipes",
  "troca entre equipes",
],

"desenvolvimento de competencias": [
  "desenvolver competencias",
  "melhorar competencias",
  "formacao de competencias",
  "aperfeicoar competencias",
],

"desenvolvimento profissional": [
  "desenvolver profissionais",
  "crescimento profissional",
  "formacao profissional",
  "aperfeicoamento profissional",
],

"capacitacao continua": [
  "capacitacao permanente",
  "treinamento continuo",
  "formacao continua",
  "aperfeicoamento continuo",
],

"educacao continuada": [
  "educacao permanente",
  "aprendizagem continua",
  "formacao continuada",
  "aprendizagem permanente",
],

"trajetorias de aprendizagem": [
  "percurso de aprendizagem",
  "caminho de aprendizagem",
  "trilhas de aprendizagem",
  "percurso de desenvolvimento",
],

"desenvolvimento continuo": [
  "aprendizagem continua",
  "desenvolvimento permanente",
  "aperfeicoamento continuo",
  "melhoria continua das competencias",
],
};
const gcChallengeEquivalences: Record<string, string[]> = {
  "aprendizagem organizacional": [
    "incorporar novos conhecimentos",
    "incorporacao de novos conhecimentos",
    "aplicar novos conhecimentos",
    "adotar novas praticas",
    "aprender novas praticas",
    "adaptar novas praticas",
    "novos processos",
    "novas tecnologias",
  ],

  "compartilhamento de conhecimento": [
    "conhecimento produzido por outras equipes",
    "conhecimento entre equipes",
    "conhecimento entre setores",
    "compartilhar conhecimento",
    "troca entre equipes",
    "troca de experiencias",
    "conhecimento restrito",
    "conhecimento permanece restrito",
    "informacoes entre equipes",
    "informacoes entre setores",
    "informacoes compartilhadas",
    "informacoes circularem",
    "circulacao de informacoes",
    "compartilhar informacoes",
  ],

  "reutilizacao do conhecimento": [
    "reutilizar conhecimento",
    "reaproveitar conhecimento",
    "solucoes que ja existem",
    "solucoes existentes",
    "repetir erros",
    "atividades duplicadas",
    "evitar retrabalho",
  ],

  "licoes aprendidas": [
    "aprendizado dos projetos",
    "experiencias dos projetos",
    "aprender com erros",
    "repetir erros",
    "aprendizado acumulado",
  ],

  "retencao do conhecimento": [
    "preservar conhecimento",
    "perda de conhecimento",
    "saida de profissionais",
    "saida de especialistas",
    "conhecimento dos que estao de saida",
    "manter o conhecimento na organizacao",
  ],

  "registro do conhecimento": [
    "registrar conhecimento",
    "documentar conhecimento",
    "conhecimento registrado",
    "banco de dados",
    "base de conhecimento",
  ],
};
const integrationChallengeEquivalences: Record<string, string[]> = {
  "engenharia da integracao": [
    "integracao",
    "conectar sistemas",
    "conectar setores",
    "conectar equipes",
    "integrar conhecimentos",
  ],

  "integracao organizacional": [
    "areas isoladas",
    "setores isolados",
    "integrar areas",
    "integrar setores",
    "conectar equipes",
    "conexoes entre grupos",
  ],

  "integracao entre setores": [
    "entre setores",
    "entre areas",
    "coordenacao entre areas",
    "dados entre setores",
    "informacoes entre setores",
    "conhecimento entre setores",
  ],

  "integracao de processos": [
    "processos fragmentados",
    "processos desconectados",
    "integrar processos",
    "conectar processos",
    "retrabalho",
  ],

  "integracao de sistemas": [
    "diferentes sistemas",
    "sistemas desconectados",
    "sistemas sem sincronizacao",
    "conectar sistemas",
    "sincronizar sistemas",
    "dados entre sistemas",
  ],

  "processos integrados": [
    "processos conectados",
    "processos articulados",
    "atividades integradas",
    "reduzir retrabalho",
  ],

  "sistemas integrados": [
    "sistemas conectados",
    "sistemas sincronizados",
    "sistemas compartilhando dados",
    "troca de dados",
  ],

  "interoperabilidade": [
    "sistemas diferentes",
    "sistemas conversando",
    "troca de dados entre sistemas",
    "compartilhamento de dados",
    "comunicacao entre sistemas",
  ],

  "fluxo de informacao": [
    "fluxo de informacao",
    "dados e informacoes",
    "informacoes nao circulam",
    "informacoes circularem",
    "circulacao de informacoes",
    "compartilhar informacoes",
  ],

  "coordenacao entre equipes": [
    "coordenacao entre equipes",
    "coordenacao entre areas",
    "equipes trabalhando juntas",
    "integrar equipes",
    "conexoes entre grupos",
  ],

  "conexao entre setores": [
    "conexao entre setores",
    "conexoes entre grupos",
    "conectar areas",
    "conectar setores",
    "integrar departamentos",
  ],
};  
  
const ucrChallengeEquivalences: Record<string, string[]> = {
  "universidade corporativa": [
    "universidade corporativa",
    "educacao corporativa",
    "desenvolvimento dos colaboradores",
    "formacao dos profissionais",
  ],

  "universidade em rede": [
    "universidade em rede",
    "aprendizagem entre unidades",
    "conectar unidades",
    "integrar unidades",
    "aprendizagem distribuida",
  ],

  "educacao corporativa": [
    "educacao corporativa",
    "formacao profissional",
    "capacitacao dos colaboradores",
    "desenvolvimento profissional",
    "educacao continuada",
  ],

  "aprendizagem em rede": [
    "aprendizagem entre equipes",
    "aprendizagem entre unidades",
    "aprender em conjunto",
    "troca de experiencias",
    "rede de aprendizagem",
  ],

  "competencias organizacionais": [
    "desenvolver competencias",
    "competencias dos profissionais",
    "competencias da organizacao",
    "desenvolvimento de competencias",
  ],

  "integracao entre unidades": [
    "integrar unidades",
    "conectar unidades",
    "aproximar unidades",
    "articulacao entre unidades",
    "troca entre unidades",
  ],

  "trilhas de aprendizagem": [
    "trilhas de aprendizagem",
    "trajetorias de aprendizagem",
    "percurso de aprendizagem",
    "caminho de desenvolvimento",
  ],

  "rede de aprendizagem": [
    "rede de aprendizagem",
    "equipes aprendendo juntas",
    "aprendizagem compartilhada",
    "conectar pessoas para aprender",
    "troca de conhecimento entre equipes",
  ],

  "ecossistema de aprendizagem": [
    "ecossistema de aprendizagem",
    "ambiente de aprendizagem",
    "rede de desenvolvimento",
    "ambiente integrado de aprendizagem",
  ],

  "desenvolvimento de competencias": [
    "desenvolver competencias",
    "desenvolvimento das competencias",
    "melhorar competencias",
    "formacao de competencias",
  ],

  "desenvolvimento profissional": [
    "desenvolver profissionais",
    "desenvolvimento dos profissionais",
    "crescimento profissional",
    "formacao profissional",
  ],

  "capacitacao continua": [
    "capacitacao continua",
    "capacitacao permanente",
    "treinamento continuo",
    "formacao continua",
  ],

  "educacao continuada": [
    "educacao continuada",
    "educacao permanente",
    "aprendizagem continua",
    "formacao continuada",
  ],

  "trajetorias de aprendizagem": [
    "trajetorias de aprendizagem",
    "percurso de aprendizagem",
    "caminho de aprendizagem",
    "trilhas de aprendizagem",
  ],

  "desenvolvimento continuo": [
    "desenvolvimento continuo",
    "aprendizagem continua",
    "desenvolvimento permanente",
    "melhoria continua das competencias",
  ],
};

const proposalRoots = conceptRoots(proposal);

const perSource = sources.map((s) => {
  const keywords = s.palavrasChave || [];
const relevantKeywords = keywords.filter((keyword: string) => {
  const keywordNormalized = normalizeConcept(keyword);

  // Descritor aparece diretamente no desafio
  if (challengeNormalized.includes(keywordNormalized)) {
    return true;
  }

  // Descritor aparece no desafio por equivalência conceitual
 const equivalents =
  isKnowledgeManagement && gcChallengeEquivalences[keywordNormalized]
    ? [
        ...(conceptualEquivalences[keywordNormalized] ?? []),
        ...gcChallengeEquivalences[keywordNormalized],
      ]
    : isIntegrationEngineering &&
        integrationChallengeEquivalences[keywordNormalized]
      ? [
          ...(conceptualEquivalences[keywordNormalized] ?? []),
          ...integrationChallengeEquivalences[keywordNormalized],
        ]
      : isUCR &&
          ucrChallengeEquivalences[keywordNormalized]
        ? [
            ...(conceptualEquivalences[keywordNormalized] ?? []),
            ...ucrChallengeEquivalences[keywordNormalized],
          ]
        : conceptualEquivalences[keywordNormalized] ?? [];
  
  const challengeRoots = conceptRoots(challengeDescription);

  return equivalents.some((equivalent) => {
    const equivalentRoots = conceptRoots(equivalent);

    if (equivalentRoots.length === 0) return false;

    const matchedRoots = equivalentRoots.filter((root) =>
      challengeRoots.some((challengeRoot) => challengeRoot === root)
    ).length;

    return matchedRoots / equivalentRoots.length >= 0.6;
  });
});
  const matchedKeywords: string[] = [];
 const hits = relevantKeywords.filter((keyword: string) => {
    const keywordNormalized = normalizeConcept(keyword);

    // 1. Correspondência exata continua valendo
   if (normalizeConcept(proposal).includes(keywordNormalized)) {
  matchedKeywords.push(keyword);
  return true;
}
// 2. Reconhece equivalências conceituais e linguagem natural
const equivalents =
  isKnowledgeManagement && gcChallengeEquivalences[keywordNormalized]
    ? [
        ...(conceptualEquivalences[keywordNormalized] ?? []),
        ...gcChallengeEquivalences[keywordNormalized],
      ]
    : isIntegrationEngineering &&
        integrationChallengeEquivalences[keywordNormalized]
      ? [
          ...(conceptualEquivalences[keywordNormalized] ?? []),
          ...integrationChallengeEquivalences[keywordNormalized],
        ]
      : isUCR &&
          ucrChallengeEquivalences[keywordNormalized]
        ? [
            ...(conceptualEquivalences[keywordNormalized] ?? []),
            ...ucrChallengeEquivalences[keywordNormalized],
          ]
        : conceptualEquivalences[keywordNormalized] ?? [];
const proposalNormalized = normalizeConcept(proposal);

const hasConceptualEquivalent = equivalents.some((equivalent) => {
  const equivalentRoots = conceptRoots(equivalent);

  if (equivalentRoots.length === 0) return false;

  const matchedEquivalentRoots = equivalentRoots.filter((root) =>
    proposalRoots.some((proposalRoot) => proposalRoot === root)
  ).length;

  return matchedEquivalentRoots / equivalentRoots.length >= 0.6;
});

if (hasConceptualEquivalent) {
  matchedKeywords.push(keyword);
  return true;
}
    // 3. Reconhece variações conceituais próximas
    const roots = conceptRoots(keyword);

    if (roots.length === 0) return false;

    const matchedRoots = roots.filter((root) =>
      proposalRoots.some((proposalRoot) => proposalRoot === root)
    ).length;

   // pelo menos 60% dos conceitos relevantes da palavra-chave
const hasRootMatch = matchedRoots / roots.length >= 0.6;

if (hasRootMatch) {
  matchedKeywords.push(keyword);
}

return hasRootMatch;
  }).length;

const coverageBase =
  relevantKeywords.length > 0
    ? isKnowledgeManagement
      ? Math.min(Math.max(relevantKeywords.length, 3), 5)
      : isIntegrationEngineering
        ? Math.min(Math.max(relevantKeywords.length, 4), 6)
        : relevantKeywords.length
    : Math.min(keywords.length, 20);
  
const coverage = coverageBase
  ? Math.min(hits / coverageBase, 1)
  : 0;
  return { source: s, hits, coverage, relevantKeywords, matchedKeywords };
});

const totalHits = perSource.reduce((sum, s) => sum + s.hits, 0);

const bestCoverage =
  perSource.length > 0
    ? Math.max(...perSource.map((s) => s.coverage))
    : 0;

const score = Math.round(bestCoverage * 100);

const normalizedScore =
  isKnowledgeManagement ||
  isIntegrationEngineering ||
  isUCR
    ? score
    : score > 0 && score < 20 && totalHits > 0
      ? 20
      : score;

  const usedSources = perSource.filter((x) => x.coverage >= 0.4).map((x) => x.source);
  const recommendedSources = perSource.filter((x) => x.coverage < 0.4).map((x) => x.source);

  // ✅ REGRA PEDAGÓGICA: erro também ensina
  if (usedSources.length === 0 && recommendedSources.length === 0) {
    const fallbackSources = sources.slice(0, 3);
    recommendedSources.push(...fallbackSources);
  }
console.log("[LOCAL EVAL DEBUG]", {
  area,
  challenge: challengeDescription,
  proposal,
  score,
  totalHits,
  perSource: perSource.map((x) => ({
    titulo: x.source?.titulo,
    palavrasChave: x.source?.palavrasChave,
    relevantKeywords: x.relevantKeywords,
    hits: x.hits,
    matchedKeywords: x.matchedKeywords,
    coverage: x.coverage,
  })),
});

return { score, normalizedScore, usedSources, recommendedSources };
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState & { report: ExtendedActionRecord[] }>(() => {
    const initialReport = readStoredArray<ExtendedActionRecord>("engin_nexus_reports_v2", item =>
      [item.area, item.title, item.proposal, item.verdict, item.explanation].every(value => typeof value === "string"));

    return {
      phase: GamePhase.INTRO,
      stability: 60,
      innovation: 10,
      energy: {
        [ResearchArea.GOVERNANCE_KNOWLEDGE]: 100,
        [ResearchArea.KNOWLEDGE_MGMT]: 100,
        [ResearchArea.INTEGRATION_ENG]: 100,
        [ResearchArea.UCR]: 100,
      },
      activePlayers: [],
      history: ["Nexus Online.", "Memória Coletiva Sincronizada."],
      report: initialReport,
    };
  });

  const [ranking, setRanking] = useState<RankingEntry[]>(() => {
    return readStoredArray<RankingEntry>("engin_nexus_ranking_v2", item =>
      typeof item.playerName === "string" && typeof item.area === "string" && Number.isFinite(item.points));
  });

  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [playerInput, setPlayerInput] = useState("");
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);
  const [lastRecord, setLastRecord] = useState<ExtendedActionRecord | null>(null);

  const [feedback, setFeedback] = useState<{
    verdict: string;
    explanation: string;
    references?: string[];
    sourceType?: string;
    stabilityDelta?: number;
    innovationDelta?: number;
    usedSources?: DisplayReference[];
    recommendedSources?: DisplayReference[];
    pointsEarned?: number;
    referenceNotice?: string;
  } | null>(null);

  const [newPlayerName, setNewPlayerName] = useState("");
  const [showDatabase, setShowDatabase] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);

  useEffect(() => {
    if (!writeStored("engin_nexus_reports_v2", gameState.report)) setStorageUnavailable(true);
  }, [gameState.report]);

  useEffect(() => {
    if (!writeStored("engin_nexus_ranking_v2", ranking)) setStorageUnavailable(true);
  }, [ranking]);

  const canSubmit = (playerInput || "").trim().split(/\s+/).filter((w) => w.length > 0).length >= 3;

  const addPlayer = (name: string) => {
    const cleanName = (name || "").trim();
    if (!cleanName || gameState.activePlayers.includes(cleanName)) return;
    setGameState((prev) => ({ ...prev, activePlayers: [...prev.activePlayers, cleanName] }));
    setNewPlayerName("");
  };

  const startGame = () => {
    if (gameState.activePlayers.length < 1) {
      alert("Identifique o Especialista.");
      return;
    }
    setGameState((prev) => ({ ...prev, phase: GamePhase.CORE_GAME }));
  };

  const handleAreaSelect = async (area: ResearchArea) => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setFeedback(null);
    setPlayerInput("");

    const challengeData = await generateChallenge(area);
    setCurrentChallenge({
      id: Math.random().toString(36),
      title: challengeData.title,
      description: challengeData.description,
      requiredArea: area,
    });

    setLoading(false);
    busy.current = false;
  };

  const submitAction = async () => {
    if (!currentChallenge || !canSubmit || busy.current) return;
    busy.current = true;

    const emergencyExplanation = "Falha temporária ao avaliar sua proposta. Tente novamente em instantes.";
    let combinedExplanation = "";

    setLoading(true);

    try {
      let feedbackData: any = null;
      // 2️⃣ Avaliação local (blindada)
      const area = currentChallenge.requiredArea;

      let localEval: any = { usedSources: [], recommendedSources: [] };
      try {
        localEval =
  evaluateProposalWithSources(
    playerInput,
    area,
    currentChallenge.description
  ) ?? localEval;
      } catch (e) {
        console.error("[LOCAL_EVAL] evaluateProposalWithSources falhou:", e);
        localEval = { usedSources: [], recommendedSources: [] };
      }
     const localScore = Number(
  area === ResearchArea.GOVERNANCE_KNOWLEDGE
    ? localEval?.normalizedScore ?? localEval?.score ?? 0
    : localEval?.score ?? 0
);
      
      const areaThresholds: Record<
  ResearchArea,
  { partial: number; correct: number }
> = {
  [ResearchArea.GOVERNANCE_KNOWLEDGE]: {
    partial: 20,
    correct: 55,
  },
  [ResearchArea.KNOWLEDGE_MGMT]: {
    partial: 20,
    correct: 75,
  },
  [ResearchArea.INTEGRATION_ENG]: {
    partial: 20,
    correct: 75,
  },
  [ResearchArea.UCR]: {
    partial: 20,
    correct: 75,
  },
};

const { partial: partialThreshold, correct: correctThreshold } =
  areaThresholds[area];
if (localScore >= correctThreshold) {
  feedbackData = {
    ...(feedbackData ?? {}),
    verdict: "CORRETA",
    explanation:
      "A proposta apresenta boa aderência aos conceitos e palavras-chave identificados nas fontes científicas selecionadas para esta área.",
    pointsEarned: 10,
    sourceType: "local-scientific",
  };
} else if (localScore >= partialThreshold) {
  feedbackData = {
    ...(feedbackData ?? {}),
    verdict: "PARCIALMENTE_CORRETA",
    explanation:
      "A proposta apresenta relação com o tema, mas ainda possui cobertura conceitual limitada em comparação com as fontes científicas da área. É necessário desenvolver melhor os mecanismos, processos ou conceitos envolvidos.",
    pointsEarned: 5,
    sourceType: "local-scientific",
  };
} else {
  feedbackData = {
    ...(feedbackData ?? {}),
    verdict: "INCORRETA",
    explanation:
      "A proposta apresenta baixa aderência aos conceitos identificados nas fontes científicas da área e precisa ser reformulada para responder de maneira mais consistente ao desafio.",
    pointsEarned: 0,
    sourceType: "local-scientific",
  };
}

      // Reference retrieval is independent of the calibrated grading rules above.
      let research: SearchResult;
      try {
        research = await scientificSearch({
          title: currentChallenge.title,
          challenge: currentChallenge.description,
          proposal: playerInput,
          area,
          limit: 4,
        });
      } catch {
        research = { best: null, candidates: [], sourceType: "none", validation: "none",
          trace: { steps: [] }, notice: "A busca de referências está indisponível nesta rodada. A avaliação da proposta foi mantida." };
      }
      const usedMapped: DisplayReference[] = [];
      const dedupedRecommended: DisplayReference[] = research.candidates.map(source => ({
        ...source, titulo: source.title, autores: source.authors.join("; "), ano: source.year,
      }));
      feedbackData.references = dedupedRecommended.map(source => `${source.autores} — ${source.titulo} — ${source.link}`);
      const pointsEarned = feedbackData.pointsEarned;

      // 9️⃣ Explicação combinada
      combinedExplanation = String(feedbackData?.explanation ?? "").trim() || combinedExplanation || emergencyExplanation;

      const record: ExtendedActionRecord = {
        area: currentChallenge.requiredArea,
        title: currentChallenge.title,
        proposal: playerInput,
        verdict: feedbackData.verdict,
        explanation: combinedExplanation,
        executors: [...gameState.activePlayers],
        references: feedbackData.references ?? [],
        sourceType: research.sourceType,
        referenceNotice: research.notice,
        pointsEarned,
        usedSources: usedMapped,
        recommendedSources: dedupedRecommended,
        timestamp: new Date().toLocaleString("pt-BR"),
      };

      setLastRecord(record);
      setGameState(previous => ({ ...previous, report: [record, ...previous.report] }));
      setRanking(previous => addRoundToRanking(previous, record.executors, record.area, record.pointsEarned));

      setFeedback({
        verdict: feedbackData.verdict,
        explanation: combinedExplanation,
        pointsEarned,
        references: feedbackData.references ?? [],
        sourceType: research.sourceType,
        referenceNotice: research.notice,
        usedSources: usedMapped,
        recommendedSources: dedupedRecommended,
      });

    } catch (err) {
      console.error("submitAction error:", err);

      setFeedback({
        verdict: "ANALISE_INDISPONIVEL",
        explanation: emergencyExplanation,
        pointsEarned: 0,
        references: [],
        referenceNotice: "A busca de referências está indisponível nesta rodada.",
        sourceType: "EMERGENCY_FALLBACK",
        usedSources: [],
        recommendedSources: [],
      });
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen terminal-bg text-blue-50 p-3 md:p-8 font-inter overflow-x-hidden">
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border-b border-blue-900/50 pb-4">
        <div
          className="flex items-center gap-3 cursor-pointer w-full sm:w-auto justify-center sm:justify-start"
          onClick={() => {
            setShowDatabase(false);
            setShowRanking(false);
          }}
        >
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center glow shrink-0">
            <span className="font-orbitron font-bold text-white text-lg">N</span>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="font-orbitron text-lg md:text-xl font-bold tracking-widest text-blue-400">NEXUS ENGIN</h1>
            <p className="text-sm md:text-base text-slate-200/90 font-mono uppercase">Memória Coletiva UFSC</p>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-between w-full sm:w-auto">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowDatabase(!showDatabase);
                setShowRanking(false);
              }}
              className={`px-3 py-1.5 rounded-full border text-[9px] font-orbitron transition-all ${
                showDatabase ? "bg-blue-600 text-white" : "border-blue-900 text-blue-400"
              }`}
            >
              REP ({gameState.report.length})
            </button>

            <button
              onClick={() => {
                setShowRanking(!showRanking);
                setShowDatabase(false);
              }}
              className={`p-1.5 rounded-lg border transition-all ${
                showRanking ? "bg-yellow-600 border-yellow-400 text-white" : "bg-slate-900 border-blue-900 text-yellow-500"
              }`}
              title="Classificação"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </button>
          </div>

          <div className="flex gap-3 md:gap-6 border-l border-blue-900/50 pl-4 shrink-0">
            <StatBar label="ESTAB" value={gameState.stability} color={gameState.stability < 30 ? "bg-red-500" : "bg-green-500"} />
            <StatBar label="INOVA" value={gameState.innovation} color="bg-blue-400" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {storageUnavailable && <p role="status" className="mb-4 text-sm text-yellow-200">Não foi possível salvar os resultados neste navegador. Eles continuam disponíveis enquanto esta sessão estiver aberta.</p>}
        {showRanking ? (
          <div className="animate-in fade-in duration-500 space-y-4">
            <h2 className="font-orbitron text-lg text-yellow-500 border-b border-yellow-900/30 pb-2">RANKING</h2>
            <div className="bg-slate-900/80 rounded-xl border border-yellow-900/20 overflow-x-auto">
              <table className="w-full text-left text-[10px] md:text-xs font-mono min-w-[300px]">
                <thead className="bg-yellow-950/20 text-yellow-500 uppercase font-orbitron">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Especialista</th>
                    <th className="p-3">Tema</th>
                    <th className="p-3 text-right">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-900/10">
                  {ranking
                    .slice()
                    .sort((a, b) => b.points - a.points)
                    .map((r, i) => (
                      <tr key={i} className="hover:bg-yellow-500/5">
                        <td className="p-3 text-yellow-600 font-bold">{i + 1}</td>
                        <td className="p-3 text-white font-bold truncate max-w-[80px] md:max-w-none">{r.playerName}</td>
                        <td className="p-3 text-blue-300 truncate max-w-[100px] md:max-w-none">{r.area}</td>
                        <td className="p-3 text-right text-yellow-400 font-bold">{r.points}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : showDatabase ? (
          <div className="animate-in fade-in duration-500 space-y-4">
            <h2 className="font-orbitron text-lg text-blue-400 border-b border-blue-900/30 pb-2 uppercase tracking-tighter">
              Memória Coletiva
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gameState.report.map((rec, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border bg-slate-900/60 space-y-2 ${
                    rec.verdict === "CORRETA" ? "border-green-500/20" : "border-red-500/20"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[7px] text-blue-400 uppercase font-bold truncate max-w-[70%]">{rec.area}</span>
                    <span
                      className={`text-[7px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        rec.verdict === "CORRETA" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {rec.verdict}
                    </span>
                  </div>
                  <h3 className="text-[10px] font-bold text-white leading-tight uppercase line-clamp-2">{rec.title}</h3>
                  <p className="text-[9px] text-blue-100/50 italic line-clamp-3">"{rec.proposal}"</p>
                  <div className="bg-black/20 p-2.5 rounded text-[9px] text-blue-200 leading-normal">{rec.explanation}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-slate-900/80 p-6 rounded-xl border border-blue-900/30 shadow-lg text-base">
                <h3 className="text-2xl font-orbitron text-blue-400 mb-3 uppercase tracking-widest">Acesso</h3>

                {gameState.phase === GamePhase.INTRO ? (
                  <div className="flex gap-2">
                    <input
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Identificação..."
                      className="bg-black/40 border border-blue-900/50 rounded p-2 text-[10px] w-full focus:border-blue-400 outline-none"
                    />
                    <button
                      onClick={() => addPlayer(newPlayerName)}
                      className="bg-blue-600 hover:bg-blue-500 px-4 py-1 rounded text-[10px] font-bold"
                    >
                      ADD
                    </button>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {gameState.activePlayers.map((p) => (
                    <span key={p} className="bg-blue-900/30 border border-blue-500/20 px-2 py-1 rounded text-[9px] text-blue-300">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-blue-900/30 h-40 lg:h-64 overflow-hidden flex flex-col hidden sm:flex">
                <h3 className="text-[10px] font-orbitron text-blue-500 mb-2 uppercase">Log do Sistema</h3>
                <div className="flex-1 overflow-y-auto font-mono text-[8px] text-blue-400/40 space-y-1.5 scrollbar-hide">
                  {gameState.history.map((h, i) => (
                    <div key={i} className="border-l border-blue-900/30 pl-1.5">{`> ${h}`}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              {gameState.phase === GamePhase.INTRO && (
                <div className="bg-blue-900/5 p-8 md:p-14 border border-blue-500/10 rounded-3xl text-center space-y-6 animate-in fade-in zoom-in duration-700">
                  <h2 className="text-4xl md:text-6xl font-orbitron font-bold text-blue-400 tracking-tighter">NEXUS DE CRISE</h2>
                  <p className="text-[10px] md:text-xs text-blue-100/60 max-w-sm mx-auto leading-relaxed">
                    Facilitador de crescimento estratégico. Todas as propostas negativas tornam-se ativos de rede. Nada é apagado.
                  </p>
                  <button
                    onClick={startGame}
                    className="w-full sm:w-auto px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-orbitron text-[10px] tracking-widest shadow-lg transform transition active:scale-95"
                  >
                    INICIAR OPERAÇÃO
                  </button>
                </div>
              )}

              {gameState.phase === GamePhase.CORE_GAME && !currentChallenge && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in--bottom-4">
                  {Object.values(ResearchArea).map((area) => (
                    <button
                      key={area}
                      disabled={loading}
                      onClick={() => handleAreaSelect(area)}
                      className="p-5 bg-slate-900/60 border border-blue-900/40 rounded-2xl hover:border-blue-400 text-left transition-all active:bg-blue-900/20 group"
                    >
                      <div className="text-blue-500 mb-3 group-hover:scale-110 transition-transform">{AREA_ICONS[area]}</div>
                      <h4 className="font-orbitron text-xs text-white mb-1 uppercase tracking-tight">{area}</h4>
                      <p className="text-[9px] text-blue-300/40 leading-snug line-clamp-2">{RESEARCH_DESCRIPTIONS[area]}</p>
                    </button>
                  ))}
                </div>
              )}

              {loading && !currentChallenge && <p role="status" className="mt-4 text-sm text-blue-200">Preparando desafio...</p>}

              {currentChallenge && (
                <div className="bg-slate-900 border border-blue-500/20 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                  <div className="bg-blue-950/80 p-3 border-b border-blue-500/10 text-[8px] font-orbitron text-blue-300 flex justify-between">
                    <span>STATUS: OPERACIONAL</span>
                    <span className="text-blue-500 uppercase">{currentChallenge.requiredArea}</span>
                  </div>

                  <div className="p-5 md:p-8 space-y-6">
                    {feedback ? (
                      <div className="space-y-5 animate-in slide-in-from-bottom-2">
                        <div
                          className={`p-5 rounded-xl border ${
                            feedback.verdict === "CORRETA" ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                          }`}
                        >
                          <h4 className={`font-orbitron text-lg mb-3 ${feedback.verdict === "CORRETA" ? "text-green-400" : "text-red-400"}`}>
                            {feedback.verdict}
                          </h4>

                          <p className="text-[9px] font-orbitron text-yellow-400 uppercase tracking-widest mb-2">
                            Pontos ganhos nesta rodada:{" "}
                            <span className="text-white font-bold">{lastRecord?.pointsEarned}</span>
                          </p>

                          <p className="text-[10px] md:text-xs text-blue-50 leading-relaxed mb-4">{feedback.explanation}</p>

                          <ReferenceList sources={feedback.recommendedSources || []} notice={feedback.referenceNotice} />
                        </div>

                        <button
                          onClick={() => {
                            setCurrentChallenge(null);
                            setFeedback(null);
                          }}
                          className="w-full py-4 bg-blue-600 text-white font-orbitron text-[9px] rounded-xl tracking-widest uppercase"
                        >
                          Retornar
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <h2 className="text-lg md:text-xl font-orbitron text-white leading-tight">{currentChallenge.title}</h2>
                            <div className="border-l-2 border-blue-600 pl-4 py-1">
                              <p className="text-blue-100/70 text-xs md:text-sm font-light italic leading-relaxed">
                                {currentChallenge.description}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <textarea
                              value={playerInput}
                              onChange={(e) => setPlayerInput(e.target.value)}
                              placeholder="Descreva sua manobra estratégica..."
                              className="w-full h-32 md:h-40 bg-black/40 border border-blue-900/30 rounded-xl p-4 text-[11px] md:text-xs font-mono text-blue-50 focus:border-blue-500 outline-none resize-none placeholder:text-blue-900"
                            />

                            <button
                              disabled={!canSubmit || loading}
                              onClick={submitAction}
                              className={`w-full py-4 md:py-5 font-orbitron text-[10px] rounded-xl tracking-[0.2em] transition-all uppercase shadow-xl ${
                                canSubmit && !loading
                                  ? "bg-green-600 hover:bg-green-500 text-white"
                                  : "bg-slate-800 text-slate-600 border border-slate-700"
                              }`}
                            >
                              {loading ? "ANALISANDO..." : "Transmitir Proposta"}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const StatBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="text-center group shrink-0">
    <p className="text-[7px] uppercase text-blue-400 mb-1 font-orbitron tracking-tighter opacity-70">{label}</p>
    <div className="w-16 md:w-24 h-1 bg-slate-800 rounded-full overflow-hidden border border-blue-900/20">
      <div className={`h-full transition-all duration-1000 ${color}`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

export default App;
