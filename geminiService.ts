
import { GoogleGenAI, Type } from "@google/genai";
import { ResearchArea, GameState } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SUBTHEMES: Record<ResearchArea, string[]> = {
  [ResearchArea.GOVERNANCE_KNOWLEDGE]: [
    "Auditoria do conhecimento",
    "Governança para inovação",
    "Maturidade em GC",
    "Estruturas de decisão"
  ],
  [ResearchArea.KNOWLEDGE_MGMT]: [
    "Capital intelectual",
    "Framework 8'C",
    "Planejamento colaborativo",
    "Gestão de mudanças"
  ],
  [ResearchArea.INTEGRATION_ENG]: [
    "Engenharia da integração",
    "Redes de aprendizagem",
    "Centro de Memória Viva",
    "Sincronização de sistemas"
  ],
  [ResearchArea.UCR]: [
    "Educação corporativa em rede",
    "Trilhas de aprendizagem",
    "Sustentabilidade educacional",
    "Ecossistemas digitais"
  ]
};

export const getGeminiFeedback = async (
  prompt: string, 
  state: GameState, 
  action: string,
  team: string[]
) => {
  const model = 'gemini-3-pro-preview';
  
  const pastProposalsSummary = state.report
    .slice(0, 5)
    .map(r => `Area: ${r.area}, Veredito: ${r.verdict}, Proposta: ${r.proposal.substring(0, 50)}...`)
    .join("\n");

  const systemInstruction = `
    Você é o facilitador do Nexus ENGIN/UFSC.
    Avalie propostas estratégicas com base científica rigorosa (EGC).
    
    CONTEXTO COLETIVO:
    ${pastProposalsSummary || "Início da base de dados."}
    
    REGRAS:
    1. Prioridade: Repositório ENGIN/UFSC.
    2. Se a resposta for genérica ou repetir o problema, o veredito é "NEGATIVA".
    3. Identifique conceitos técnicos (ex: 8'C, Auditoria).
    4. Cite: Autor, Obra e UFSC.
    
    JSON: { "verdict": "CORRETA"|"NEGATIVA", "explanation": string, "sourceType": string, "stabilityDelta": number, "innovationDelta": number, "references": string[] }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `DESAFIO: ${prompt}\nPROPOSTA: "${action}"\nEQUIPE: ${team.join(', ')}`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    return { verdict: "NEGATIVA", explanation: "Erro na conexão com o repositório.", sourceType: "EXTERNA", stabilityDelta: -10, innovationDelta: 0, references: [] };
  }
};

export const generateChallenge = async (area: ResearchArea) => {
  const model = 'gemini-3-flash-preview';
  const subthemes = SUBTHEMES[area].join(", ");
  
  const instruction = `
    Crie um desafio curto e impactante para a área: "${area}".
    Subtemas: ${subthemes}.
    
    REGRAS CRÍTICAS:
    1. Use o TEMPO PRESENTE (Ex: "A empresa sofre...", "Você enfrenta...").
    2. Seja CONCISO (máximo 3 frases). Não seja cansativo.
    3. Apresente uma crise técnica real sem dar a solução.
    
    JSON: { "title": string, "description": string }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: instruction,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    return { title: "Crise de Fluxo", description: "O sistema detecta perda massiva de capital intelectual agora. Qual sua manobra de EGC?" };
  }
};
