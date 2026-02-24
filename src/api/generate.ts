import { App, Notice, normalizePath } from "obsidian";
import { generateText, Output } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { PluginSettings } from "../types";
import { sanitizeFilename, ensureFolderExists } from "../utils/file";

export async function generateFlashcard(
  app: App,
  settings: PluginSettings,
  selectedText: string,
  wordClassList: string[]
) {
  if (!selectedText || selectedText.trim().length === 0) {
    new Notice("Please enter some text.");
    return;
  }

  if (!settings.geminiApiKey) {
    new Notice(
      "Gemini API key not set. Go to Settings → Flashcard Generator to add your key."
    );
    return;
  }

  const loadingNotice = new Notice("Generating flashcard…", 0);

  try {
    const google = createGoogleGenerativeAI({
      apiKey: settings.geminiApiKey,
    });

    const wcEnum = wordClassList.length >= 2
      ? z.enum(wordClassList as [string, string, ...string[]])
      : z.string();

    const prompt = settings.customPrompt
      .replace(/\{\{language\}\}/g, settings.language)
      .replace(/\{\{text\}\}/g, selectedText.trim());

    const { output: flashcard } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      output: Output.object({
        schema: z.object({
          dictionary_form: z.string(),
          word_class: wcEnum,
          translation: z.string(),
          example_1: z.string(),
          example_2: z.string(),
          example_1_translation: z.string(),
          example_2_translation: z.string(),
          note: z.string(),
        }),
      }),
      prompt,
    });

    loadingNotice.hide();

    const noteTitle = sanitizeFilename(flashcard.dictionary_form);

    if (noteTitle.length === 0) {
      new Notice("Could not create a valid filename from the AI response.");
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
      const newFile = await app.vault.create(filePath, `${flashcard.note}\n\n- ${flashcard.example_1} (${flashcard.example_1_translation})\n- ${flashcard.example_2} (${flashcard.example_2_translation})`);
      await app.fileManager.processFrontMatter(newFile, (frontmatter) => {
        frontmatter["categories"] = ["[[Flashcards]]"];
        frontmatter["word_class"] = flashcard.word_class;
        frontmatter["translation"] = flashcard.translation;
        frontmatter["group"] = "Default";
        frontmatter["source"] = selectedText;
      });
      const leaf = app.workspace.getLeaf("tab");
      await leaf.openFile(newFile);
      new Notice(`Created flashcard: ${flashcard.dictionary_form} → ${flashcard.translation}`);
    }
  } catch (err: any) {
    loadingNotice.hide();
    const message = err?.message || String(err);
    new Notice(`Flashcard generation failed: ${message}`);
    console.error("Flashcard error:", err);
  }
}
