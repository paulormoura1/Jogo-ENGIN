
import { GoogleGenAI, Type } from "@google/genai";
import { ResearchArea, GameState } from "./types";

// Always use { apiKey: process.env.API_KEY }
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  // Using gemini-3-pro-preview for complex reasoning task
  const model = 'gemini-3-pro-preview';
  
  const systemInstruction = `
    Você é o facilitador do Nexus ENGIN/UFSC. Seu objetivo é avaliar propostas estratégicas com RIGOR CIENTÍFICO.
    
    FONTES OBRIGATÓRIAS:
    1. Você DEVE buscar e fundamentar suas respostas em teses e dissertações do laboratório ENGIN/UFSC disponíveis em: https://repositorio.ufsc.br/handle/123456789/76395
    2. Utilize a ferramenta de busca para encontrar autores, títulos e conceitos específicos deste repositório (ex: teses orientadas pela Prof. Patricia de Sá).
    3. Complemente com outras fontes científicas confiáveis (Google Scholar, Periódicos CAPES).

    REGRAS DE RESPOSTA:
    - O veredito deve ser "CORRETA" apenas se houver fundamentação teórica sólida baseada no EGC (Engenharia e Gestão do Conhecimento).
    - Você DEVE citar: [Nome do Autor], [Título da Dissertação/Tese] e o link do repositório UFSC quando encontrar.
    - Se a proposta for genérica ou sem base científica, o veredito é "NEGATIVA".

    CONTEÚDO DO JSON:
    { 
      "verdict": "CORRETA"|"NEGATIVA", 
      "explanation": "Explicação técnica detalhada com citação de autores do ENGIN", 
      "sourceType": "REPOSITÓRIO ENGIN/UFSC", 
      "stabilityDelta": number, 
      "innovationDelta": number, 
      "references": ["links do repositorio.ufsc.br encontrados"] 
    }
  `;

  try {
    // Corrected to use ai.models.generateContent directly
    const response = await ai.models.generateContent({
      model,
      contents: `DESAFIO: ${prompt}\nPROPOSTA DO JOGADOR: "${action}"\n\nPor favor, valide esta proposta buscando no repositório https://repositorio.ufsc.br/handle/123456789/76395 dissertações que sustentem ou refutem esta manobra técnica.`,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });
    // Use .text property, not .text() method
    return JSON.parse(response.text || '{}');
  } catch (error) {
    return { 
      verdict: "NEGATIVA", 
      explanation: "Erro de sincronização com o repositório institucional UFSC.", 
      sourceType: "SISTEMA", 
      stabilityDelta: -5, 
      innovationDelta: 0, 
      references: ["https://repositorio.ufsc.br/handle/123456789/76395"] 
    };
  }
};

export const generateChallenge = async (area: ResearchArea) => {
  // Using gemini-3-flash-preview for basic text tasks
  const model = 'gemini-3-flash-preview';
  const subthemes = SUBTHEMES[area].join(", ");
  
  const instruction = `
    Crie um desafio de estratégia organizacional para a área: "${area}".
    Subtemas de referência: ${subthemes}.
    
    O desafio deve ser uma situação real de crise onde o conhecimento é o principal ativo em risco.
    Use o tempo presente. Seja conciso e direto.
    
    JSON: { "title": string, "description": string }
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: instruction,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["title", "description"]
        }
      }
    });
    // Use .text property, not .text() method
    return JSON.parse(response.text || '{}');
  } catch (error) {
    return { title: "Fuga de Capital Intelectual", description: "Um especialista chave está deixando a organização agora sem deixar registros. Qual sua manobra de Gestão do Conhecimento?" };
  }
};