# Tension Tracker

A progressive web app (PWA) for mindfully tracking moments of tension throughout your week, identifying patterns, and taking countermeasures.

## What it does

- **Buzzer** — One tap logs a tension event instantly (with haptic + ripple feedback). A transient snackbar lets you optionally add tags/notes or undo — nothing blocks the flow.
- **Stats** — Weekly totals, peak day, tension-per-hour with a week-over-week trend, daily breakdown chart, and top themes. Browse past weeks.
- **Weekly Review** — End-of-week reflection: your stats, recurring themes (including ones carried over from last week), your own notes, and space to write countermeasures. Reviews stay editable.
- **Journal** — All past weekly reviews and countermeasures in one place; tap any card to open that week's stats.
- **Multi-person** — Track tension for multiple people (e.g. you and your partner) with per-person buzzers and filters.
- **Data** — Everything stays on-device (IndexedDB). Export/import as JSON from Settings.

## Install on iPhone

1. Open the deployed URL in **Safari**
2. Tap the **Share** button
3. Tap **Add to Home Screen**

The app launches standalone, no browser chrome.

## Tech stack

- [Preact](https://preactjs.com/) + TypeScript
- [Dexie](https://dexie.org/) (IndexedDB) for local storage — all data stays on device
- [Vite PWA](https://vite-pwa-org.netlify.app/) for service worker + offline support
- [Vitest](https://vitest.dev/) + Testing Library for unit and workflow tests

## Development

```bash
npm install
npm run dev        # dev server
npm test           # run the test suite
npm run typecheck  # TypeScript project check
npm run build      # typecheck + production build
```

## CI/CD

- **CI** (`.github/workflows/ci.yml`): typecheck + tests + production build on every push and pull request.
- **Deploy** (`.github/workflows/deploy.yml`): on push to `main`, runs typecheck + tests, then builds and deploys to GitHub Pages. A red test suite blocks the deploy.

```bash
git push origin main   # tests gate the deploy automatically
```
