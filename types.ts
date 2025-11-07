export enum MessageRole {
  USER = 'user',
  BOT = 'bot',
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  isTyping?: boolean;
}

export interface ProgramDetails {
  name: string;
  shortName: string;
  modality: string;
  duration: string; // e.g., "2 Semestres"
  credits: number; // e.g., 24
  objectives: string[];
  whyStudy: string[]; // key benefits/reasons
  attributes?: string[];
  planDeEstudios: {
    semestre: string;
    asignaturas: { name: string; credits?: number; description?: string; contents?: string; }[];
  }[];
  contact: {
    celular: string;
    email: string;
    website: string;
  };
}