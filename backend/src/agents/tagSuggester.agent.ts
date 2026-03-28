import { anthropic, DEFAULT_MODEL } from '../config/anthropic.js';

export interface TagSuggestion {
  suggestedTags: string[];
  newTags: string[];
  suggestedBacklinks: string[];
  suggestedFolder: string;
}

const SYSTEM_PROMPT = `Eres un asistente especializado en taxonomía y organización del conocimiento para Obsidian.

Tu tarea es analizar el contenido de una nota y:
1. Sugerir tags relevantes (usa los existentes del vault si son apropiados, o propón nuevos)
2. Identificar conceptos que podrían tener notas dedicadas en el vault (backlinks)
3. Sugerir una carpeta óptima si no está ya definida

Responde en JSON con este formato exacto:
{
  "suggestedTags": ["tag1", "tag2"],
  "newTags": ["tag-nuevo"],
  "suggestedBacklinks": ["[[nombre-concepto]]", "[[otro-concepto]]"],
  "suggestedFolder": "Ideas"
}

Reglas para tags: minúsculas, sin espacios (usa guiones), máximo 8 tags.`;

export async function tagSuggesterAgent(params: {
  noteContent: string;
  existingTags?: string[];
  currentFolder?: string;
}): Promise<TagSuggestion> {
  const { noteContent, existingTags = [], currentFolder } = params;

  const userMessage = `Tags existentes en el vault: ${existingTags.length > 0 ? existingTags.join(', ') : 'ninguno aún'}
${currentFolder ? `Carpeta actual: ${currentFolder}\n` : ''}
Contenido de la nota:
${noteContent.slice(0, 3000)}`;

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const rawText = (response.content[0] as { text: string }).text;
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('tagSuggesterAgent: respuesta sin JSON válido');

  const result = JSON.parse(jsonMatch[0]) as Partial<TagSuggestion>;

  return {
    suggestedTags: result.suggestedTags ?? [],
    newTags: result.newTags ?? [],
    suggestedBacklinks: result.suggestedBacklinks ?? [],
    suggestedFolder: result.suggestedFolder ?? currentFolder ?? 'Inbox',
  };
}
