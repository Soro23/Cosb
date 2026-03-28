import { noteFormatterAgent } from './noteFormatter.agent.js';
import { journalAgent } from './journal.agent.js';
import { tagSuggesterAgent } from './tagSuggester.agent.js';
import { writeNote } from '../services/vault.service.js';

export interface CreateNoteResult {
  path: string;
  filename: string;
  title: string;
  content: string;
  tags: string[];
}

export async function createNoteOrchestrator(params: {
  rawText: string;
  folder: string;
  type?: string;
  userContext?: string;
  date?: string;
  enrichTags?: boolean;
}): Promise<CreateNoteResult> {
  const { rawText, folder, type = 'note', userContext, date, enrichTags = false } = params;

  let content: string;
  let filename: string;
  let title: string;
  let tags: string[];

  if (type === 'journal') {
    const result = await journalAgent({ rawText, date });
    content = result.content;
    filename = result.filename;
    title = 'Entrada de diario';
    tags = ['journal', `mood-${result.mood}`];
  } else {
    const result = await noteFormatterAgent({ rawText, folder, userContext, date });
    content = result.content;
    filename = result.filename;
    title = result.title;
    tags = result.tags;
  }

  if (enrichTags) {
    try {
      const enriched = await tagSuggesterAgent({ noteContent: content, existingTags: tags, currentFolder: folder });
      tags = [...new Set([...tags, ...enriched.suggestedTags, ...enriched.newTags])];
    } catch (err) {
      console.warn('[createNoteOrchestrator] tagSuggesterAgent falló:', (err as Error).message);
    }
  }

  const filePath = await writeNote(folder, filename, content);
  return { path: filePath, filename, title, content, tags };
}
