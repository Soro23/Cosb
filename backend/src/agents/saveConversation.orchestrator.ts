import { conversationSaverAgent } from './conversationSaver.agent.js';
import { tagSuggesterAgent } from './tagSuggester.agent.js';
import { writeNote } from '../services/vault.service.js';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface SaveConversationResult {
  path: string;
  filename: string;
  summary: string;
  folder: string;
}

export async function saveConversationOrchestrator(params: {
  messages: Message[];
  title?: string;
  date?: string;
  enrichTags?: boolean;
}): Promise<SaveConversationResult> {
  const { messages, title, date, enrichTags = false } = params;

  if (!messages || messages.length === 0) throw new Error('No hay mensajes que guardar');

  const { filename, folder, content, summary } = await conversationSaverAgent({ messages, title, date });

  let finalContent = content;

  if (enrichTags) {
    try {
      const enriched = await tagSuggesterAgent({ noteContent: content, currentFolder: folder });
      if (enriched.suggestedBacklinks.length > 0) {
        const backlinksSection = `\n## Notas relacionadas\n${enriched.suggestedBacklinks.join('\n')}\n`;
        finalContent = content.includes('## Referencias')
          ? content.replace('## Referencias', backlinksSection + '\n## Referencias')
          : content + backlinksSection;
      }
    } catch (err) {
      console.warn('[saveConversationOrchestrator] tagSuggesterAgent falló:', (err as Error).message);
    }
  }

  const filePath = await writeNote(folder, filename, finalContent);
  return { path: filePath, filename, summary, folder };
}
