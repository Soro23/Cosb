import fs from 'fs/promises';
import { Dirent } from 'fs';
import path from 'path';

const VAULT_PATH = process.env['VAULT_PATH'] ?? '/vault';

export interface VaultFile {
  name: string;
  path: string;
}

export interface VaultFolder {
  name: string;
  path: string;
  files: VaultFile[];
  subfolders: VaultFolder[];
}

export interface VaultStructure {
  folders: VaultFolder[];
  totalFiles: number;
}

function assertSafePath(resolvedPath: string): void {
  const vaultResolved = path.resolve(VAULT_PATH);
  if (!resolvedPath.startsWith(vaultResolved + path.sep) && resolvedPath !== vaultResolved) {
    throw new Error('Acceso denegado: path fuera del vault');
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '-').slice(0, 200);
}

export async function writeNote(folder: string, filename: string, content: string): Promise<string> {
  const safeFolder = sanitizeFilename(folder);
  const safeFilename = sanitizeFilename(filename);
  const fullPath = path.resolve(VAULT_PATH, safeFolder, safeFilename);
  assertSafePath(fullPath);

  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, 'utf-8');

  return path.join(safeFolder, safeFilename);
}

export async function readNote(filepath: string): Promise<string> {
  const fullPath = path.resolve(VAULT_PATH, filepath);
  assertSafePath(fullPath);
  return fs.readFile(fullPath, 'utf-8');
}

async function buildFolderTree(dirPath: string, vaultRoot: string): Promise<VaultFolder> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files: VaultFile[] = [];
  const subfolders: VaultFolder[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const entryPath = path.join(dirPath, entry.name);
    const relPath = path.relative(vaultRoot, entryPath);

    if (entry.isDirectory()) {
      subfolders.push(await buildFolderTree(entryPath, vaultRoot));
    } else if (entry.name.endsWith('.md')) {
      files.push({ name: entry.name, path: relPath });
    }
  }

  return {
    name: path.basename(dirPath),
    path: path.relative(vaultRoot, dirPath),
    files,
    subfolders,
  };
}

export async function listStructure(): Promise<VaultStructure> {
  const vaultRoot = path.resolve(VAULT_PATH);

  const folders: VaultFolder[] = [];
  let totalFiles = 0;

  let entries: Dirent[];
  try {
    entries = await fs.readdir(vaultRoot, { withFileTypes: true }) as unknown as Dirent[];
  } catch {
    return { folders: [], totalFiles: 0 };
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      const folder = await buildFolderTree(path.join(vaultRoot, entry.name), vaultRoot);
      totalFiles += folder.files.length;
      folders.push(folder);
    }
  }

  return { folders, totalFiles };
}
