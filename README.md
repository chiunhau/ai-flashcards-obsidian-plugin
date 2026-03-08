# AI Language Flashcards for Obsidian

Generate language learning flashcards from text using Google Gemini AI. Works inside Obsidian and from any browser.

## Requirements

A free Google Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [Releases](https://github.com/chiunhau/ai-flashcards-obsidian-plugin/releases) page.
2. Copy them into `.obsidian/plugins/ai-language-flashcards/` inside your vault.
3. Reload Obsidian and enable the plugin in Settings → Community Plugins.

## Configuration

Open Settings → AI Language Flashcards and set:

- **Gemini API key** — required
- **Target language** — the language you are learning
- **New note location** — folder where flashcards will be saved

Everything else (prompt, output fields, note template) is optional and customizable.

## Usage

**In Obsidian:** Select text, right-click → "Create flashcard", or use the command palette.

**In the browser:** Select text on any webpage, right-click → "Create flashcard in Obsidian". Requires the browser extension (see below).

**Practice:** Click the cards icon in the ribbon or run "Practice flashcards" from the command palette.

## Browser Extension

1. In Chrome/Brave/Edge, go to Manage Extensions and enable **Developer mode**.
2. Click **Load unpacked** and select the `browser-extension/` folder from this repository.

Obsidian must be running when you use the extension.
