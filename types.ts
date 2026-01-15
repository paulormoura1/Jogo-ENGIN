
export enum GamePhase {
  INTRO = 'INTRO',
  SETUP = 'SETUP',
  CORE_GAME = 'CORE_GAME',
  RESOLUTION = 'RESOLUTION',
  VICTORY = 'VICTORY',
  DEFEAT = 'DEFEAT'
}

export enum ResearchArea {
  GOVERNANCE_KNOWLEDGE = 'Governança do Conhecimento',
  KNOWLEDGE_MGMT = 'Gestão do Conhecimento',
  INTEGRATION_ENG = 'Engenharia da Integração',
  UCR = 'Universidade Corporativa em Rede'
}

export interface ActionRecord {
  area: ResearchArea;
  title: string;
  proposal: string;
  verdict: string;
  explanation: string;
  executors: string[];
  // Added optional fields for scientific grounding
  references?: string[];
  sourceType?: string;
}

export interface GameState {
  phase: GamePhase;
  stability: number;
  innovation: number;
  energy: Record<ResearchArea, number>;
  activePlayers: string[];
  history: string[];
  report: ActionRecord[];
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  requiredArea: ResearchArea;
}