# Fitness

A phone-first workout app: daily calorie and protein targets, home and gym plans, stick-figure demos, and a log that stays on the device.

Live site, after the GitHub Pages workflow runs on `main`:

https://japalaxmanreddy.github.io/Fitness-app/

## What it does

- Daily targets from the Mifflin-St Jeor equation, an activity factor, and a 500 calorie cut. Protein is about 0.82 g per pound of body weight.
- Phase 1 home plans for 5, 4, or 3 days, and the Phase 2 gym week. Each day opens with a short warm-up, the workout, a 5-minute cool-down, and easy movement breaks for later.
- A Library tab for warm-ups, strength moves, stretches, and movement breaks, with search and filters.
- Logs for sets, reps, and weight, plus morning weight, steps, and calories burned (typed in from a watch or Fitbit).
- An 18-week weight chart from 195 lb to 177 lb, with your weigh-ins on the same graph.
- JSON export and import. There is no account and no server.

Each exercise and stretch has a `videoUrl`. Watch how-to opens that video on YouTube, outside the app, so it plays in Safari or the YouTube app.

## iPhone

Open the site in Safari, tap Share, then Add to Home Screen. The icon opens full screen, without the Safari toolbar. The first online visit caches the app so later visits work offline.

## Develop

```bash
npm install
npm run dev
```

The dev server uses the GitHub Pages base path, so open `http://localhost:5173/Fitness-app/`.

```bash
npm test
npm run build
npm run preview
```

Preview is at `http://127.0.0.1:4173/Fitness-app/`.

## GitHub Pages

Pushes to `main` run `.github/workflows/pages.yml`, which builds `dist` and deploys it with `actions/configure-pages`, `actions/upload-pages-artifact`, and `actions/deploy-pages`.

`enablement: true` asks GitHub to turn Pages on and set the source to GitHub Actions. The default `GITHUB_TOKEN` often cannot create a Pages site. If the Setup Pages step fails, set this once and re-run the workflow:

**Settings → Pages → Build and deployment → Source → GitHub Actions**

If the deploy job waits for a review, approve the `github-pages` environment under **Settings → Environments**.

Logs stay in `localStorage` on the phone. The repository does not contain anyone's workout history.
