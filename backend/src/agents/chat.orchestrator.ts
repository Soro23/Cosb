import { ragAgent } from './rag.agent.js';
import { saveConversationOrchestrator } from './saveConversation.orchestrator.js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResult {
  answer: string;
  sources: Array<{ file: string; excerpt: string }>;
  history: Message[];
  saved: boolean;
  savedPath?: string;
}

export async function chatOrchestrator(params: {
  question: string;
  history?: Message[];
  autoSave?: boolean;
  saveThreshold?: number;
  conversationTitle?: string;
}): Promise<ChatResult> {
  const { question, history = [], autoSave = false, saveThreshold = 10, conversationTitle } = params;

  const updatedHistory: Message[] = [...history, { role: 'user', content: question }];

  const { answer, sources } = await ragAgent({ question, conversationHistory: history });

  updatedHistory.push({ role: 'assistant', content: answer });

  let isSaved = false;
  let savedPath: string | undefined;

  if (autoSave && updatedHistory.length >= saveThreshold) {
    try {
      const saved = await saveConversationOrchestrator({
        messages: updatedHistory,
        title: conversationTitle,
      });
      savedPath = saved.path;
      isSaved = true;
    } catch (err) {
      console.warn('[chatOrchestrator] autoSave falló:', (err as Error).message);
    }
  }

  return { answer, sources, history: updatedHistory, saved: isSaved, savedPath };
}
