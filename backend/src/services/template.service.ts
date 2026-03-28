export type NoteType = 'idea' | 'note' | 'journal' | 'conversation' | 'task' | 'reference';

export interface FrontmatterData {
  type: NoteType;
  tags?: string[];
  extra?: Record<string, string | number>;
}

/**
 * Genera el frontmatter YAML estándar para una nota de Obsidian.
 */
export function buildFrontmatter(data: FrontmatterData): string {
  const now = new Date().toISOString();
  const tags = data.tags && data.tags.length > 0
    ? `[${data.tags.map((t) => `"${t}"`).join(', ')}]`
    : '[]';

  const extraLines = data.extra
    ? Object.entries(data.extra).map(([k, v]) => `${k}: ${v}`).join('\n')
    : '';

  return [
    '---',
    `created: ${now}`,
    `updated: ${now}`,
    `tags: ${tags}`,
    `source: mobile-app`,
    `type: ${data.type}`,
    ...(extraLines ? [extraLines] : []),
    '---',
  ].join('\n');
}

/**
 * Plantilla vacía para una nota de tipo idea.
 */
export function ideaTemplate(title: string, tags: string[] = []): string {
  return `${buildFrontmatter({ type: 'idea', tags })}

# ${title}

## Contexto

## Desarrollo de la idea

## Próximos pasos
`;
}

/**
 * Plantilla para entrada de diario.
 */
export function journalTemplate(date: string, mood = 'neutral', energy = 3): string {
  const title = `Diario — ${date}`;
  return `${buildFrontmatter({ type: 'journal', tags: ['journal', `mood-${mood}`], extra: { mood, energy } })}

# ${title}

## Contexto del día

## Reflexión

## Eventos destacados

## Aprendizajes

## Próximos pasos
`;
}

/**
 * Plantilla para conversación guardada.
 */
export function conversationTemplate(title: string, tags: string[] = []): string {
  return `${buildFrontmatter({ type: 'conversation', tags })}

# ${title}

## Resumen

## Puntos clave

## Conversación

## Próximos pasos
`;
}

/**
 * Selecciona la plantilla adecuada según el tipo de nota.
 */
export function getTemplate(type: NoteType, title: string, options: { tags?: string[]; date?: string; mood?: string; energy?: number } = {}): string {
  switch (type) {
    case 'idea':
      return ideaTemplate(title, options.tags);
    case 'journal':
      return journalTemplate(options.date ?? new Date().toISOString().slice(0, 10), options.mood, options.energy);
    case 'conversation':
      return conversationTemplate(title, options.tags);
    default:
      return `${buildFrontmatter({ type, tags: options.tags })}\n\n# ${title}\n\n`;
  }
}
