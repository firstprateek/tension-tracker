# Tension Tracker

A progressive web app (PWA) for mindfully tracking moments of tension throughout your week, identifying patterns, and taking countermeasures.

## What it does

- **Buzzer** — One big tap records a tension event instantly. Optionally tag it and add notes.
- **Stats** — See your tension-per-hour rate and top themes emerging during the week.
- **Weekly Review** — End-of-week reflection showing biggest tension sources and space to write countermeasures.
- **Journal** — All past weekly reviews and their countermeasures in one place.
- **Multi-person** — Track tension for multiple people (e.g. you and your partner) with configurable buzzers.

## Install on iPhone

1. Open the deployed URL in **Safari**
2. Tap the **Share** button
3. Tap **Add to Home Screen**

The app launches standalone, no browser chrome.

## Tech stack

- [Preact](https://preactjs.com/) + TypeScript
- [Dexie](https://dexie.org/) (IndexedDB) for local storage — all data stays on device
- [Vite PWA](https://vite-pwa-org.netlify.app/) for service worker + offline support

## Development

```bash
npm install
npm run dev
```

## Deployment

Pushes to `main` auto-deploy to GitHub Pages via GitHub Actions.

```bash
git push origin main
```
