import { App, Notice, normalizePath } from "obsidian";
import { generateText, Output } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { PluginSettings } from "../types";
import { sanitizeFilename, ensureFolderExists } from "../utils/file";

interface OutputField {
  key: string;
  description: string;
}

function parseOutputFields(str: string): OutputField[] {
  return str
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return { key: line, description: "" };
      return {
        key: line.slice(0, idx).trim(),
        description: line.slice(idx + 1).trim(),
      };
    })
    .filter((f) => f.key.length > 0);
}

function buildSchema(fields: OutputField[]): z.ZodObject<Record<string, z.ZodType>> {
  const shape: Record<string, z.ZodType> = {};
  for (const f of fields) {
    shape[f.key] = f.description ? z.string().describe(f.description) : z.string();
  }
  return z.object(shape);
}

function renderTemplate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? "");
}

function parseFrontmatterConfig(
  config: string,
  flashcard: Record<string, string>,
  sourceText: string
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const line of config.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const idx = trimmed.indexOf(":");
    if (idx === -1) continue;

    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();

    value = value.replace(/\{\{source_text\}\}/g, sourceText);
    value = value.replace(/\{\{(\w+)\}\}/g, (_, field) => flashcard[field] ?? "");

    if (value.startsWith("[") || value.startsWith("{")) {
      try {
        result[key] = JSON.parse(value);
        continue;
      } catch {
        // fall through to string
      }
    }
    result[key] = value;
  }
  return result;
}

export async function generateFlashcard(
  app: App,
  settings: PluginSettings,
  sourceText: string
) {
  if (!sourceText || sourceText.trim().length === 0) {
    new Notice("Please enter some text.");
    return;
  }

  if (!settings.geminiApiKey) {
    new Notice(
      "Gemini API key not set. Go to Settings → Flashcard Generator to add your key."
    );
    return;
  }

  const fields = parseOutputFields(settings.outputFields);
  if (fields.length === 0) {
    new Notice("No output fields defined. Check Settings → Output Schema.");
    return;
  }

  const loadingNotice = new Notice("Generating flashcard…", 0);

  try {
    const google = createGoogleGenerativeAI({ apiKey: settings.geminiApiKey });

    const schema = buildSchema(fields);

    const prompt = settings.customPrompt
      .replace(/\{\{language\}\}/g, settings.language)
      .replace(/\{\{source_text\}\}/g, sourceText.trim());

    const { output: flashcard } = await generateText({
      model: google(settings.geminiModel),
      output: Output.object({ schema }),
      prompt,
    });

    loadingNotice.hide();

    const rawTitle = flashcard[settings.titleField] as string | undefined;
    const noteTitle = sanitizeFilename(rawTitle ?? "");

    if (noteTitle.length === 0) {
      new Notice(
        `Title field "${settings.titleField}" is empty or missing in the AI response.`
      );
      return;
    }

    const folder = settings.folder.trim();
    const filePath = folder
      ? normalizePath(`${folder}/${noteTitle}.md`)
      : `${noteTitle}.md`;

    if (folder) {
      await ensureFolderExists(app, folder);
    }

    const existingFile = app.vault.getAbstractFileByPath(filePath);

    if (existingFile) {
      const leaf = app.workspace.getLeaf("tab");
      await leaf.openFile(existingFile as any);
      new Notice(`"${noteTitle}" already exists — opened it.`);
    } else {
      const body = renderTemplate(
        settings.noteBodyTemplate,
        flashcard as Record<string, string>
      );
      const newFile = await app.vault.create(filePath, body);

      const fmValues = parseFrontmatterConfig(
        settings.frontmatterConfig,
        flashcard as Record<string, string>,
        sourceText.trim()
      );
      await app.fileManager.processFrontMatter(newFile, (frontmatter) => {
        for (const [k, v] of Object.entries(fmValues)) {
          frontmatter[k] = v;
        }
      });

      const leaf = app.workspace.getLeaf("tab");
      await leaf.openFile(newFile);
      new Notice(`Created flashcard: ${noteTitle}`);
    }
  } catch (err: any) {
    loadingNotice.hide();
    const message = err?.message || String(err);
    new Notice(`Flashcard generation failed: ${message}`);
    console.error("Flashcard error:", err);
  }
}
