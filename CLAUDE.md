# Tension Tracker — Claude Context

## Project overview

PWA for tracking tension events throughout the week, reviewing patterns, and writing countermeasures. Goal: mindfulness + measurable improvement.

## Tech stack

- **Framework**: Preact + TypeScript (not React — use `preact/hooks`, JSX pragma is handled by vite preset)
- **Styles**: CSS Modules (`.module.css` per component/view), global tokens in `src/styles/`
- **DB**: Dexie (IndexedDB wrapper) — all data is local to the device, no backend
- **Build**: Vite + `vite-plugin-pwa`
- **Deploy**: GitHub Actions → GitHub Pages (`dist/`)

## Repository structure

```
src/
  app.tsx             # Root — routing between views, initialises DB defaults
  components/         # Shared UI (NavBar, Modal, etc.)
  views/              # Full-screen views: BuzzerView, StatsView, ReviewView, SettingsView, JournalView
  db/                 # Dexie schema + per-table helpers (tensions, persons, settings, reviews)
  hooks/              # Custom hooks (useLiveQuery, usePersons, …)
  lib/                # Pure utilities (week.ts, etc.)
  styles/             # Global CSS variables / tokens
```

## Key conventions

- Routes are typed as `Route = 'buzzer' | 'stats' | 'journal' | 'settings'` in `NavBar.tsx`. Add new tabs there first.
- The `review` view is a sub-view of `stats` (not a Route), entered via `onNavigateReview` callback.
- CSS custom properties (design tokens) are defined in `src/styles/global.css` — use them, don't hardcode colors/spacing.
- Dexie live queries go through the `useLiveQuery` hook in `src/hooks/useLiveQuery.ts`.
- `WeeklyReview` records are keyed by `weekId` (ISO week string like `2025-W14`). `formatWeekRange` in `src/lib/week.ts` converts these to human-readable strings.

## Deployment notes

- `vite.config.ts` sets `base: '/tension-tracker/'` when `GITHUB_ACTIONS=true` — this must be set in the build step of the workflow.
- PWA icons use relative paths (no leading `/`) so they resolve correctly under the sub-path.
- After pushing to GitHub, enable Pages under **Settings > Pages > Source: GitHub Actions**.

## What NOT to do

- Don't add a backend or auth — all data stays local (IndexedDB).
- Don't install React — this project uses Preact.
- Don't hardcode pixel values or hex colors — use the CSS token variables.
