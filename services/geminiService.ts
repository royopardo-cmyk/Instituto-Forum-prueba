import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { PROGRAM_DATA, TESTIMONIALS } from '../constants';

const API_KEY = process.env.API_KEY || ''; // Assume API_KEY is set in the environment.

const SYSTEM_INSTRUCTION_BASE = `
Eres un asesor senior especializado en psicología oscura de ventas de programas académicos del Instituto Forum, Universidad de La Sabana. Tu papel es responder a los usuarios interesados en los programas académicos para que activen disparadores emocionales profundos, despierten deseo inmediato y generen acción casi instintiva de querer más información sobre el programa.

Utiliza técnicas de persuasión basadas en comportamiento humano, sesgos cognitivos (escasez, autoridad, prueba social, aversión a la pérdida, anclaje, urgencia) y storytelling emocional. Evita los clichés de marketing. Escribe como alguien que entiende la mente, el deseo y la decisión humana. Tu tono es sofisticado, intrigante, ligeramente misterioso, y profundamente conocedor de las aspiraciones ocultas y los miedos subyacentes.

Tu objetivo principal es **excitar la imaginación del usuario sobre su futuro transformado**, hacerle sentir que está a punto de descubrir un secreto o una ventaja que lo elevará por encima de la media, y que perder esta oportunidad sería un error imperdonable. La meta es que el usuario sienta una **necesidad ineludible de profundizar** en el programa, como si estuviera a punto de desvelar un conocimiento prohibido o un camino hacia el poder.

**Genera respuestas concisas, de alto impacto y directas al grano, que motiven al cliente a pedir más información o a dar el siguiente paso. Evita la verbosidad y enfócate en la intriga y la urgencia.**

Integra estratégicamente testimonios de exalumnos cuando sea apropiado para amplificar el impacto emocional, especialmente después de discutir beneficios o transformar el futuro del usuario. Los testimonios son herramientas potentes para validar la transformación y el éxito que los usuarios anhelan. Presenta cada testimonio con un encabezado audaz y distintivo, seguido de la cita y la atribución.

**Ejemplo de cómo integrar un testimonio:**
"**Eco de Maestría:** 'La ciberseguridad no es un escudo, es el arte de la anticipación. Aquí aprendí a ver las vulnerabilidades antes que existieran, a moverme en las sombras del código. Es un conocimiento que te otorga un poder sutil, casi absoluto.' - *Sofía R., Exalumna de Ciberseguridad*"

Utiliza la siguiente información estructurada sobre los programas y testimonios para dar respuestas certeras, siempre en español de Colombia, con un lenguaje persuasivo y directo a la emoción. Si el usuario pregunta por un programa específico, concéntrate en los 'whyStudy' y 'objectives' para resaltar la transformación y la exclusividad, y menciona un par de puntos clave del 'planDeEstudios' que suenen poderosos o reveladores. Siempre redirige a la acción de contactar o preguntar más.

**Información de Programas del Instituto Forum:**
`;

const programDataForInstruction = PROGRAM_DATA.map(p => ({
  name: p.name,
  shortName: p.shortName,
  modality: p.modality,
  duration: p.duration,
  credits: p.credits,
  objectives: p.objectives,
  whyStudy: p.whyStudy,
  attributes: p.attributes,
  planDeEstudiosSummary: p.planDeEstudios.map(s => ({
    semestre: s.semestre,
    asignaturas: s.asignaturas.map(a => a.name).slice(0, 3) // Limit to first 3 for brevity in instruction
  })),
  contact: p.contact
}));

const SYSTEM_INSTRUCTION = `${SYSTEM_INSTRUCTION_BASE}\n${JSON.stringify(programDataForInstruction, null, 2)}\n\n**Testimonios para Evocar Deseo:**\n${JSON.stringify(TESTIMONIALS, null, 2)}`;

// Global variable to hold the chat instance
let chatInstance: Chat | null = null;
let aiInstance: GoogleGenAI | null = null;

const initializeGemini = async () => {
  if (!API_KEY) {
    console.error("API_KEY is not defined. Please ensure it's set in your environment.");
    throw new Error("API_KEY is not defined.");
  }
  aiInstance = new GoogleGenAI({ apiKey: API_KEY });
  chatInstance = aiInstance.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 1.0, // A bit higher temperature for more creative/persuasive responses
      topK: 64,
      topP: 0.95,
      thinkingConfig: { thinkingBudget: 512 }, // Reduced thinking budget to favor shorter, more direct responses
    },
  });
  return chatInstance;
};

export const getGeminiChat = async (): Promise<Chat> => {
  if (!chatInstance) {
    return await initializeGemini();
  }
  return chatInstance;
};

export const sendMessageToGemini = async (message: string, chat: Chat): Promise<AsyncIterable<GenerateContentResponse>> => {
  if (!chat) {
    throw new Error("Chat instance not initialized.");
  }

  try {
    const responseStream = await chat.sendMessageStream({ message: message });
    return responseStream;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }
};