import { anthropic, DEFAULT_MODEL } from '../config/anthropic.js';

export interface SavedConversation {
  filename: string;
  folder: string;
  content: string;
  summary: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `Eres un asistente especializado en convertir conversaciones de chat en notas de conocimiento estructuradas para Obsidian.

Tu tarea es analizar el historial de conversación y generar una nota Markdown con:
1. Frontmatter YAML (created, tags, source: "mobile-app", type: "conversation")
2. Título descriptivo del tema central de la conversación
3. Resumen ejecutivo (2-3 frases)
4. Puntos clave / decisiones tomadas (lista con bullets)
5. El historial completo formateado en secciones por mensaje
6. Próximos pasos si se mencionaron

Devuelve un JSON con este formato exacto:
{
  "title": "título de la nota",
  "filename": "YYYY-MM-DD-slug-titulo.md",
  "folder": "Conversaciones",
  "content": "contenido completo en markdown",
  "summary": "resumen de 1 frase"
}`;

export async function conversationSaverAgent(params: {
  messages: Message[];
  title?: string;
  date?: string;
}): Promise<SavedConversation> {
  const { messages, title, date } = params;
  const now = date ?? new Date().toISOString();
  const datePrefix = now.slice(0, 10);

  const conversationText = messages
    .map((m) => `**${m.role === 'user' ? 'Usuario' : 'Claude'}**: ${m.content}`)
    .join('\n\n');

  const userMessage = `Fecha: ${now}
${title ? `Título sugerido: ${title}\n` : ''}
Conversación a procesar:

${conversationText}`;

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const rawText = (response.content[0] as { text: string }).text;
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('conversationSaverAgent: respuesta sin JSON válido');

  const parsed = JSON.parse(jsonMatch[0]) as SavedConversation & { title: string };

  if (!parsed.filename.startsWith(datePrefix)) {
    const slug = parsed.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50);
    parsed.filename = `${datePrefix}-${slug}.md`;
  }

  return {
    filename: parsed.filename,
    folder: parsed.folder ?? 'Conversaciones',
    content: parsed.content,
    summary: parsed.summary,
  };
}
