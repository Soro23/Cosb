import { readFileSync } from 'fs';
import path from 'path';
import { anthropic, DEFAULT_MODEL } from '../config/anthropic.js';
import { vaultSearchAgent } from './vaultSearch.agent.js';

const VAULT_PATH = process.env.VAULT_PATH ?? '/vault';
const MAX_CONTEXT_NOTES = 5;
const MAX_NOTE_CHARS = 2000;

export interface RagSource {
  file: string;
  excerpt: string;
}

export interface RagResult {
  answer: string;
  sources: RagSource[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `Eres un asistente personal inteligente con acceso al vault personal de Obsidian del usuario.
Tu tarea es responder preguntas usando el contexto de las notas proporcionadas.

Instrucciones:
- Responde basándote PRINCIPALMENTE en el contexto de las notas del vault
- Si la respuesta está en las notas, cita de dónde viene la información
- Si el contexto no es suficiente, indícalo claramente y responde con tu conocimiento general
- Usa un tono personal y cercano, como si conocieras bien al usuario
- Al final, menciona qué notas fueron más relevantes usando el formato: "Fuentes: [[nombre-nota]]"`;

export async function ragAgent(params: {
  question: string;
  conversationHistory?: Message[];
}): Promise<RagResult> {
  const { question, conversationHistory = [] } = params;

  const { results } = await vaultSearchAgent({ query: question, maxResults: MAX_CONTEXT_NOTES });

  const sources: RagSource[] = [];
  const contextBlocks: string[] = [];

  for (const result of results) {
    const fullPath = path.join(VAULT_PATH, result.file);
    let content = '';
    try {
      content = readFileSync(fullPath, 'utf-8').slice(0, MAX_NOTE_CHARS);
    } catch {
      continue;
    }
    sources.push({ file: result.file, excerpt: result.snippet });
    contextBlocks.push(`--- Nota: ${result.file} ---\n${content}`);
  }

  const contextText = contextBlocks.length > 0
    ? `CONTEXTO DEL VAULT:\n\n${contextBlocks.join('\n\n')}\n\n---\n`
    : 'No se encontraron notas relevantes en el vault para esta pregunta.\n\n';

  const messages: Message[] = [
    ...conversationHistory,
    { role: 'user', content: `${contextText}PREGUNTA: ${question}` },
  ];

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages,
  });

  const answer = (response.content[0] as { text: string }).text;
  return { answer, sources };
}
