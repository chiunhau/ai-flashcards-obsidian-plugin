import {
  Editor,
  MarkdownView,
  Plugin,
  Notice
} from "obsidian";
import { PluginSettings } from "./types";
import { DEFAULT_SETTINGS, FlashcardSettingTab } from "./settings";
import { generateFlashcard } from "./api/generate";
import { FlashcardInputModal } from "./ui/modals";
import { PracticeSetupModal } from "./ui/practice";
import { loadFlashcardNotes, getGroups } from "./utils/file";

export default class FlashcardPlugin extends Plugin {
  settings: PluginSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new FlashcardSettingTab(this.app, this));

    this.addCommand({
      id: "create-flashcard-from-selection",
      name: "Create flashcard from selection",
      editorCallback: (editor: Editor, view: MarkdownView) => {
        this.createFlashcard(editor);
      },
    });

    this.addCommand({
      id: "create-flashcard-manual-input",
      name: "Create flashcard (manual input)",
      callback: () => {
        new FlashcardInputModal(this.app, this.settings.language, (text) => {
          this.createFlashcardFromText(text);
        }).open();
      },
    });

    this.addRibbonIcon("languages", "Create flashcard", () => {
      new FlashcardInputModal(this.app, this.settings.language, (text) => {
        this.createFlashcardFromText(text);
      }).open();
    });

    this.addRibbonIcon("gallery-vertical-end", "Practice flashcards", () => {
      this.openPracticeSetup();
    });

    this.addCommand({
      id: "practice-flashcards",
      name: "Practice flashcards",
      callback: () => {
        this.openPracticeSetup();
      },
    });

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) => {
        const selection = editor.getSelection();
        if (selection && selection.trim().length > 0) {
          menu.addItem((item) => {
            item
              .setTitle(`Create ${this.settings.language} flashcard`)
              .setIcon("languages")
              .onClick(() => {
                this.createFlashcard(editor);
              });
          });
        }
      })
    );
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async createFlashcard(editor: Editor) {
    const selectedText = editor.getSelection();
    await generateFlashcard(this.app, this.settings, selectedText, this.getWordClassList());
  }

  private async createFlashcardFromText(selectedText: string) {
    await generateFlashcard(this.app, this.settings, selectedText, this.getWordClassList());
  }

  private openPracticeSetup() {
    const cards = loadFlashcardNotes(this.app, this.settings.folder);
    if (cards.length === 0) {
      new Notice("No flashcard notes found. Create some flashcards first!");
      return;
    }
    const wcList = this.getWordClassList();
    const groups = getGroups(cards);
    new PracticeSetupModal(this.app, cards, wcList, groups).open();
  }

  private getWordClassList(): string[] {
    return this.settings.wordClasses
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  onunload() {}
}
