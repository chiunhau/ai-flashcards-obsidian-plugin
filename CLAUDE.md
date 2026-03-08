# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start esbuild in watch mode (development)
npm run build    # Type check + production bundle (outputs main.js)
npm run version  # Bump version in manifest.json and versions.json
```

No test or lint commands are configured.

## Architecture

An Obsidian plugin that generates language learning flashcards from selected text using Google Gemini AI.

**Data flow:**
1. User selects text in editor → triggers command/context menu
2. `src/api/generate.ts` sends text + custom prompt to `gemini-2.5-flash-lite` via Vercel AI SDK
3. Gemini returns structured output (validated via Zod schema built dynamically from user's word classes)
4. Plugin creates a markdown note with YAML frontmatter (`word_class`, `translation`, `group`, `source`, `categories`) in the configured folder
5. `src/utils/file.ts` reads these notes back for the practice feature

**Key files:**
- `src/main.ts` — Plugin entry point; registers commands, ribbon icons, and editor context menu
- `src/api/generate.ts` — All AI interaction; builds Zod schema dynamically from configured word classes
- `src/ui/practice.ts` — Practice modal with setup (count/filter/order) and interactive flashcard UI
- `src/settings.ts` — Contains `DEFAULT_PROMPT` with `{{language}}` and `{{text}}` placeholders
- `styles.css` — CSS for practice modal using Obsidian CSS variables

**Build:** esbuild bundles `src/main.ts` → `main.js` (CommonJS, es2018 target). Obsidian and Electron are external. The output `main.js` is gitignored and only published via GitHub release artifacts.

**Release:** Push a git tag to trigger `.github/workflows/release.yml`, which builds and uploads `main.js`, `manifest.json`, and `styles.css` as release assets.
