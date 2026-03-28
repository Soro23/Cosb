import { execSync } from 'child_process';
import { readdirSync, readFileSync, statSync } from 'fs';
import path from 'path';

const VAULT_PATH = process.env.VAULT_PATH ?? '/vault';
const MAX_RESULTS = 10;

export interface SearchResult {
  file: string;
  snippet: string;
  line: number;
}

// Detectar si ripgrep está disponible (una sola vez al arranque)
let rgAvailable: boolean | null = null;
function isRgAvailable(): boolean {
  if (rgAvailable !== null) return rgAvailable;
  try {
    execSync('rg --version', { stdio: 'ignore', timeout: 3000 });
    rgAvailable = true;
  } catch {
    rgAvailable = false;
  }
  return rgAvailable;
}

/** Búsqueda con ripgrep (producción / Linux Docker) */
function searchWithRipgrep(safeQuery: string, maxResults: number): SearchResult[] {
  let snippetOutput: string;
  try {
    snippetOutput = execSync(
      `rg -i --json -m 2 -C 1 "${safeQuery}" "${VAULT_PATH}"`,
      { encoding: 'utf-8', timeout: 10000 }
    );
  } catch (err: unknown) {
    const exitErr = err as { status?: number; message?: string };
    if (exitErr.status === 1) return [];
    throw new Error(`Error ejecutando ripgrep: ${exitErr.message ?? 'desconocido'}`);
  }

  const results: SearchResult[] = [];
  const seen = new Set<string>();

  for (const line of snippetOutput.split('\n')) {
    if (!line.trim()) continue;
    let parsed: { type: string; data: { path: { text: string }; lines: { text: string }; line_number: number } };
    try { parsed = JSON.parse(line); } catch { continue; }
    if (parsed.type !== 'match') continue;

    const filePath = parsed.data.path.text;
    if (seen.has(filePath)) continue;
    seen.add(filePath);

    results.push({
      file: path.relative(VAULT_PATH, filePath),
      snippet: parsed.data.lines.text.trim(),
      line: parsed.data.line_number,
    });
    if (results.length >= maxResults) break;
  }
  return results;
}

/** Búsqueda con Node.js puro (fallback dev en Windows) */
function searchWithNode(query: string, maxResults: number): SearchResult[] {
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const results: SearchResult[] = [];

  function walkDir(dir: string): void {
    if (results.length >= maxResults) return;
    let entries: string[];
    try { entries = readdirSync(dir) as unknown as string[]; } catch { return; }

    for (const entry of entries) {
      if (results.length >= maxResults) break;
      if (entry.startsWith('.')) continue;
      const fullPath = path.join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.endsWith('.md')) {
        let content: string;
        try { content = readFileSync(fullPath, 'utf-8'); } catch { continue; }

        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i]!)) {
            results.push({
              file: path.relative(VAULT_PATH, fullPath),
              snippet: lines[i]!.trim(),
              line: i + 1,
            });
            break;
          }
        }
      }
    }
  }

  walkDir(VAULT_PATH);
  return results;
}

export async function vaultSearchAgent(params: {
  query: string;
  maxResults?: number;
}): Promise<{ results: SearchResult[] }> {
  const { query, maxResults = MAX_RESULTS } = params;
  const safeQuery = query.replace(/[`$\\;"'|&<>(){}[\]]/g, '');
  if (!safeQuery.trim()) return { results: [] };

  const results = isRgAvailable()
    ? searchWithRipgrep(safeQuery, maxResults)
    : searchWithNode(safeQuery, maxResults);

  return { results };
}
