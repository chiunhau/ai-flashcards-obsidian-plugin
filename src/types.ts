import { TFile } from "obsidian";

export interface PluginSettings {
  folder: string;
  geminiApiKey: string;
  language: string;
  wordClasses: string;
  customPrompt: string;
}

export interface FlashcardData {
  file: TFile;
  word: string;
  translation: string;
  wordClass: string;
  group: string;
}
