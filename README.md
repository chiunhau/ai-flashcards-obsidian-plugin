# AI Language Flashcards for Obsidian

This lightweight plugin lets you generate comprehensive language learning flashcards directly from any text inside Obsidian. By simply highlighting a text, the plugin automatically extracts a word, its dictionary form, part of speech, and translates it, while also generating two relevant example sentences using Google's generative AI!

Features:
- Language agnostic: you can set the language in the Settings!
- Generates beautiful contextual notes mapping directly to frontmatter properties that make reviewing and searching a breeze.
- Integrated, interactive practice modal within Obsidian to test yourself on your newly generated words!
- Customize your system prompt to the AI to control precisely what kind of properties gets returned.

## Requirements

You must obtain a free Google Gemini API key to use this plugin.
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Generate an API Key.
3. Paste it into the plugin's settings.

## Installation

### Manual Installation (From GitHub)

1. Download the latest release (`main.js`, `manifest.json`, `styles.css`) from the [Releases](https://github.com/chiunhau/ai-flashcards-obsidian-plugin/releases) page.
2. Inside your vault, go to `.obsidian/plugins/` and create a folder named `ai-language-flashcards`.
3. Place the downloaded files inside the newly created folder.
4. Reload Obsidian and enable the plugin in Community Plugins.

## Usage

1. Open the plugin settings and configure the **Target language** you are learning.
2. Set the **New note location** to the path where flashcards should be saved (e.g. `English/Flashcards`).
3. Select any text (e.g., an article you are reading, a snippet).
4. Right-click the selected text and choose **"Create {{language}} flashcard"** or simply invoke the "Create flashcard from selection" command from the command palette.
5. The flashcard gets generated in seconds!

### Practice

Use the ribbon icon (Stack of cards) or the command palette: "Practice flashcards". This brings up a dedicated practice modal allowing you to filter your review by Word Class, or randomized decks.
