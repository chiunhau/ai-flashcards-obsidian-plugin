import { App, normalizePath, TFolder, TFile } from "obsidian";
import { FlashcardData } from "../types";

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function ensureFolderExists(app: App, folderPath: string): Promise<void> {
  if (!folderPath) return;
  const normalized = normalizePath(folderPath);
  const existing = app.vault.getAbstractFileByPath(normalized);
  if (existing && existing instanceof TFolder) return;
  try {
    await app.vault.createFolder(normalized);
  } catch {
    // folder may already exist
  }
}

export function loadFlashcardNotes(app: App, folderPath: string): FlashcardData[] {
  const folder = folderPath.trim();
  const files = app.vault.getMarkdownFiles().filter((f) => {
    if (folder) {
      return f.path.startsWith(normalizePath(folder) + "/");
    }
    return true;
  });

  const cards: FlashcardData[] = [];
  for (const file of files) {
    const cache = app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;
    if (fm && fm.translation && fm.word_class) {
      cards.push({
        file,
        word: file.basename,
        translation: fm.translation,
        wordClass: fm.word_class,
        group: fm.group || "Default",
      });
    }
  }
  return cards;
}

export function getGroups(cards: FlashcardData[]): string[] {
  const set = new Set(cards.map((c) => c.group));
  return Array.from(set).sort();
}
