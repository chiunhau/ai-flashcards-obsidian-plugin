import { App, PluginSettingTab, Setting } from "obsidian";
import type FlashcardPlugin from "./main";
import { PluginSettings } from "./types";

export const DEFAULT_PROMPT = `You are a {{language}} language expert.
Extract the {{language}} word or short phrase from the following text and provide its:
- dictionary form
- English translation
- word class
- example sentence 1 (with translation)
- example sentence 2 (with translation)
- note
For the note:
- if the word is a verb, output: "Infinitive (1st Pers. Pres, 3rd Pers. Past)", e.g. "syödä (syön, söi)"
- if the word is a noun or adjective, output: "Word (Genitive, Partitive)", e.g. "katu (kadun, katua)"

Text to extract from: "{{text}}"`;

export const DEFAULT_SETTINGS: PluginSettings = {
  folder: "",
  geminiApiKey: "",
  language: "Finnish",
  wordClasses: "noun, verb, adjective, adverb, other",
  customPrompt: DEFAULT_PROMPT,
};

export class FlashcardSettingTab extends PluginSettingTab {
  plugin: FlashcardPlugin;

  constructor(app: App, plugin: FlashcardPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Flashcard Generator" });

    new Setting(containerEl)
      .setName("Gemini API key")
      .setDesc(
        "Your Google AI API key. Get one at https://aistudio.google.com/apikey"
      )
      .addText((text) =>
        text
          .setPlaceholder("Enter your API key")
          .setValue(this.plugin.settings.geminiApiKey)
          .then((t) => {
            t.inputEl.type = "password";
            t.inputEl.style.width = "300px";
          })
          .onChange(async (value) => {
            this.plugin.settings.geminiApiKey = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("New note location")
      .setDesc(
        "Folder where flashcard notes are created (relative to vault root). Leave empty for vault root."
      )
      .addText((text) =>
        text
          .setPlaceholder("e.g. Finnish/Flashcards")
          .setValue(this.plugin.settings.folder)
          .onChange(async (value) => {
            this.plugin.settings.folder = value;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h2", { text: "Language & AI" });

    new Setting(containerEl)
      .setName("Target language")
      .setDesc("The language you are learning.")
      .addText((text) =>
        text
          .setPlaceholder("e.g. Finnish")
          .setValue(this.plugin.settings.language)
          .onChange(async (value) => {
            this.plugin.settings.language = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Word classes")
      .setDesc("Comma-separated list of word classes for classification.")
      .addText((text) =>
        text
          .setPlaceholder("noun, verb, adjective, adverb, other")
          .setValue(this.plugin.settings.wordClasses)
          .then((t) => {
            t.inputEl.style.width = "300px";
          })
          .onChange(async (value) => {
            this.plugin.settings.wordClasses = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("AI prompt")
      .setDesc(
        "Custom prompt sent to the AI. Use {{language}} and {{text}} as placeholders."
      )
      .addTextArea((text) =>
        text
          .setPlaceholder("Enter custom prompt...")
          .setValue(this.plugin.settings.customPrompt)
          .then((t) => {
            t.inputEl.style.width = "100%";
            t.inputEl.style.height = "200px";
            t.inputEl.style.fontFamily = "monospace";
            t.inputEl.style.fontSize = "0.85em";
          })
          .onChange(async (value) => {
            this.plugin.settings.customPrompt = value;
            await this.plugin.saveSettings();
          })
      );

    const resetContainer = containerEl.createDiv({ cls: "modal-button-container" });
    resetContainer.createEl("button", { text: "Reset prompt to default" })
      .addEventListener("click", async () => {
        this.plugin.settings.customPrompt = DEFAULT_PROMPT;
        await this.plugin.saveSettings();
        this.display();
      });
  }
}
