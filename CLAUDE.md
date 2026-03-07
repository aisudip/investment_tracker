# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

No test framework is configured yet.

## Architecture

**Framework:** Next.js 16 with App Router (`src/app/` directory), React 19, TypeScript 5.

**Routing:** File-based via `src/app/`. Pages are `page.tsx`, layouts are `layout.tsx`. API routes go in `src/app/api/<route>/route.ts`.

**Styling:** Tailwind CSS v4 via PostCSS (`@tailwindcss/postcss`). Global styles and CSS variables (including dark mode) are in `src/app/globals.css`. No `tailwind.config.js` — v4 uses CSS-native config.

**Path alias:** `@/*` resolves to `./src/*` (configured in `tsconfig.json`). Use this for all internal imports.

**TypeScript:** Strict mode enabled.

## Current State

This is a starter project — only the default Next.js template page exists. No database, API routes, components, or state management have been added yet. The project is ready for feature development.
