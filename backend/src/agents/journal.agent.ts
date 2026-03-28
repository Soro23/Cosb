import { anthropic, DEFAULT_MODEL } from '../config/anthropic.js';

export interface JournalResult {
  content: string;
  filename: string;
  mood: string;
  energy: number;
}

const SYSTEM_PROMPT = `Eres un asistente especializado en journaling reflexivo. Conviertes texto libre (normalmente dictado por voz) en entradas de diario estructuradas para Obsidian.

Tu tarea:
1. Detectar el tono emocional general (mood): happy, neutral, stressed, anxious, excited, sad, tired, motivated
2. Detectar nivel de energía (energy): 1-5
3. Extraer eventos clave mencionados
4. Estructurar en secciones: Contexto, Reflexión, Eventos, Aprendizajes, Próximos pasos
5. Sugerir tags relevantes incluyendo el mood detectado

Genera una nota Markdown con frontmatter YAML que incluya:
- created, updated
- tags (incluye mood y energy como tags)
- source: "mobile-app"
- type: "journal"
- mood: (el detectado)
- energy: (1-5)

Devuelve SOLO el markdown de la nota.`;

export async function journalAgent(params: {
  rawText: string;
  date?: string;
}): Promise<JournalResult> {
  const { rawText, date } = params;
  const now = date ?? new Date().toISOString();
  const datePrefix = now.slice(0, 10);

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Fecha y hora: ${now}\n\nTexto del diario:\n${rawText}` }],
  });

  const content = (response.content[0] as { text: string }).text;

  const moodMatch = content.match(/^mood:\s*(.+)$/m);
  const mood = moodMatch ? moodMatch[1].trim() : 'neutral';

  const energyMatch = content.match(/^energy:\s*(\d)/m);
  const energy = energyMatch ? parseInt(energyMatch[1]) : 3;

  return { content, filename: `${datePrefix}-journal.md`, mood, energy };
}
