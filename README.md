# Home Alone Trainer

An Expo (React Native + web) app for tracking a dog's home alone training. It suggests how long the next absence should be, when to do it, and why. Every rule is based on trusted sources (ASPCA, VCA veterinary behaviourists, RSPCA, Dogs Trust, Blue Cross, Malena DeMartini), or clearly marked as the app's own careful choice where the sources give no exact number.

## Features

- **Setup:** enter the last 5 attempts as the starting point.
- **Plan:** next target duration, when to do it (wait between reps, daily budget, rest days, stop after distress), reasons linked to sources, and warnings.
- **Log:** a live timer with one-tap buttons for whine, bark, howl and body-language signs, or manual entry of past attempts. Each sign records its time, intensity and optional duration.
- **Progress:** stats and a chart of time alone per attempt (calm vs. stress, time of the first sign, next target), plus history with edit and delete.
- **Guide:** how the app decides, with all sources.
- **Settings:** dog name, JSON backup export/import, reset.

Data is stored only on the device (AsyncStorage → `localStorage` on web).

## How the recommendation works

See `src/lib/engine.ts` (logic) and `src/lib/sources.ts` (citations). Each reason is tagged `source` or `app`.

## Develop

```sh
npm install
npx expo start --web
npm run typecheck && npx eslint src
```

## Deploy to GitHub Pages

`app.json` has `experiments.baseUrl` set to `/dog-home-alone-tracker`. This must match the repo name, as must `src/lib/site.ts` and `public/manifest.json`.

Every push to `main` builds and deploys the app with GitHub Actions (`.github/workflows/deploy.yml`).
One-time setup: go to GitHub → Settings → Pages → Source: **GitHub Actions**. The site will be at
`https://beaol.github.io/dog-home-alone-tracker/`.

To check the build locally, run `npm run export` (the output goes to `dist/`).

## Install on iPhone

Open the URL in Safari → Share → **Add to Home Screen**. Data saved in the Home Screen app is separate from Safari, so use **Export backup** in Settings now and then.

## Disclaimer

General training guidance, not veterinary advice. If your dog panics, gets hurt, or isn't improving, see your vet or a qualified behaviour professional.
