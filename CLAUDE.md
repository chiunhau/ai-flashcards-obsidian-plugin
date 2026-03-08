# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Development build with watch mode
npm run build    # Production build (type check + bundle)
npm run version  # Bump version and stage manifest/versions files
```

No linting or test suite is configured.

## Architecture

This is an Obsidian plugin that generates language learning flashcards using Google Gemini AI.

**Entry point:** `src/main.ts` — registers commands, ribbon icons, and context menus. The three main commands are: create from selection, create via manual input modal, and practice flashcards.

**Data flow for flashcard creation:**
1. User provides text (selection or modal input)
2. `src/api/generate.ts` builds a Zod schema from user-configured output fields, sends structured output request to Gemini, and creates a markdown note with frontmatter in the configured vault folder.

**Key modules:**
- `src/settings.ts` — Settings tab UI and all default values. Output fields, prompts, frontmatter config, and practice card templates are all user-configurable strings.
- `src/api/generate.ts` — AI generation: parses output fields → builds Zod schema → calls Gemini → writes note file.
- `src/ui/modals.ts` — Text input modal for manual flashcard creation.
- `src/ui/practice.ts` — Practice setup and practice session modals (flip cards, filters, results).
- `src/utils/file.ts` — Filename sanitization, folder creation, and loading flashcard notes from vault.
- `src/types.ts` — `PluginSettings` and `FlashcardData` interfaces.

**Template variables:** Settings use `{{variable}}` placeholders (e.g., `{{language}}`, `{{source_text}}` in prompts; `{{title}}`, `{{translation}}` in practice card templates). Substitution is done with simple string replacement.

**Build:** esbuild bundles `src/main.ts` → `main.js` (CommonJS, ES2018). Runtime dependencies (`ai`, `@ai-sdk/google`, `zod`) are bundled; Obsidian/Electron/Node modules are external.

**Release:** GitHub Actions on tag push builds and creates a GitHub release with `main.js`, `manifest.json`, and `styles.css`.
