# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A digital duty-station checklist app for a Taiwanese fire station (車籠埔分隊). Replaces paper-based shift handover forms with a real-time synced interactive dashboard. All UI text is in Traditional Chinese (Taiwan).

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build to dist/
npm run preview  # Preview production build
```

No test framework is configured. No linter is configured.

## Architecture

**Single-page React 19 app** built with Vite 6 and TypeScript. Tailwind CSS is loaded via CDN in `index.html` (not installed as a dependency).

### Key Files

- **`App.tsx`** (~1200 lines) — The main monolithic component containing nearly all app logic: password gate, checklist rendering, handover items management, work records, drag-and-drop, schedule editing, and trash/restore functionality.
- **`useFirebaseSync.ts`** — Custom hook for real-time Firebase RTDB sync. Uses `get()` for initial load + `onValue` listener for cross-device sync. Includes a 2-second debounce to ignore self-triggered updates.
- **`firebase.ts`** — Firebase app initialization. The API key here is a public frontend key (by design).
- **`constants.ts`** — Static task definitions for each shift period (08-12, 12-18, 18-22, 22-06). Tasks can be conditionally shown by day-of-week (`showOnDays`) or month (`showInMonths`).
- **`types.ts`** — All TypeScript interfaces: `TaskItem`, `ShiftSection`, `HandoverItem`, `StatusConfig`, `WorkRecord`, `TrashedItem`, etc.
- **`services/geminiService.ts`** — Gemini AI integration for generating duty reports from checked items. Requires `GEMINI_API_KEY` in `.env.local`.

### Components (`components/`)

- `CheckboxItem.tsx` — Individual checkbox task item
- `StatusDropdown.tsx` — Status selector for handover items
- `ScheduleEditor.tsx` — Modal for editing task schedules (days/months visibility)
- `WorkRecordModal.tsx` — Modal for managing work record templates

### Data Flow

Firebase RTDB path: `dutystation/` with sub-paths:
- `config/` — basic tasks, shift sections, status configs (editable by admin)
- `state/` — checked items and handover items (daily operational state)
- `workRecords/` and `workRecordGroups/` — work record templates
- `trash/` — soft-deleted handover items (auto-purged after 30 days)

The `useFirebaseSync` hook writes via `set()` and marks a timestamp to debounce the resulting `onValue` callback, preventing UI flicker from self-updates.

### Environment Variables

`.env.local` must contain:
```
GEMINI_API_KEY=your_key_here
```

Vite injects this as `process.env.API_KEY` and `process.env.GEMINI_API_KEY` (see `vite.config.ts` define block).

## Deployment

GitHub Actions auto-deploys to GitHub Pages on push to `master`. Base path is `/dutystation-check/` (configured in `vite.config.ts`).

## Notes

- The app uses a simple hardcoded password gate (not a real auth system)
- dnd-kit is used for drag-and-drop reordering of tasks, handover items, and work records
- Path alias `@/` maps to the project root
