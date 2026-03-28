import { anthropic, DEFAULT_MODEL } from '../config/anthropic.js';

export interface NoteResult {
  title: string;
  content: string;
  tags: string[];
  filename: string;
}

const SYSTEM_PROMPT = `Eres un asistente especializado en crear notas perfectamente estructuradas para Obsidian.
Tu tarea es transformar texto crudo (puede venir de voz transcrita o texto libre) en una nota Markdown bien formateada.

Reglas:
- Genera un frontmatter YAML con: created, tags (array), source: "mobile-app", type
- Crea un título conciso y descriptivo
- Estructura el contenido en secciones lógicas si tiene suficiente longitud
- Sugiere tags relevantes en minúsculas y sin espacios (usa guiones)
- Sugiere posibles backlinks a conceptos mencionados usando [[nombre]]
- El tipo puede ser: idea, note, journal, task, reference
- Devuelve SOLO el markdown de la nota, nada más`;

export async function noteFormatterAgent(params: {
  rawText: string;
  folder: string;
  userContext?: string;
  date?: string;
}): Promise<NoteResult> {
  const { rawText, folder, userContext, date } = params;
  const now = date ?? new Date().toISOString();
  const datePrefix = now.slice(0, 10);

  const userMessage = `Fecha: ${now}
Carpeta destino: ${folder}
${userContext ? `Contexto adicional: ${userContext}\n` : ''}
Texto a formatear:
${rawText}`;

  const message = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const content = (message.content[0] as { text: string }).text;

  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : 'nota-sin-titulo';

  const tagsMatch = content.match(/^tags:\s*\[(.+)\]/m);
  const tags = tagsMatch
    ? tagsMatch[1].split(',').map((t) => t.trim().replace(/['"]/g, ''))
    : [];

  const slugTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
  const filename = `${datePrefix}-${slugTitle}.md`;

  return { title, content, tags, filename };
}
