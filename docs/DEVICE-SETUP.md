# Connect Withings and Fitbit

This is a one-time setup. You can do it from the iPhone browser. You do not need a terminal.

The fitness app stays on GitHub Pages. A small private helper (a Cloudflare Worker) is the only place that talks to Withings and Fitbit. The app never stores those passwords.

When this helper is not set up, the app hides Connected devices and works as before.

## The web addresses you will copy

After the first deploy, the green log prints a line like:

`https://fitness-devices.YOUR-NAME.workers.dev`

Use that exact address. The two callback addresses are:

- `https://fitness-devices.YOUR-NAME.workers.dev/auth/withings/callback`
- `https://fitness-devices.YOUR-NAME.workers.dev/auth/fitbit/callback`

Replace `YOUR-NAME` with the name from the log. The rest of the address must match, including `https://`.

## Secrets to create

In the GitHub app repo, open **Settings → Secrets and variables → Actions → New repository secret**. Create these six. The name must match. Paste the value with no extra spaces.

| Secret name | Where the value comes from |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token, step 1 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account id, step 1 |
| `WITHINGS_CLIENT_ID` | Withings app, step 2 |
| `WITHINGS_CLIENT_SECRET` | Withings app, step 2 |
| `FITBIT_CLIENT_ID` | Fitbit app, step 3. Fitbit calls this the OAuth 2.0 Client ID |
| `FITBIT_CLIENT_SECRET` | Fitbit app, step 3 |

You can add the Cloudflare pair first, run the deploy, then add the four app secrets and run it again. Empty Withings and Fitbit secrets are skipped: the workflow still creates the KV namespace, registers a workers.dev subdomain if the account does not have one, deploys, and prints the workers.dev address.

## 1. Cloudflare

1. Open [cloudflare.com](https://www.cloudflare.com/) and create a free account.
2. Open the Workers overview. The account id is on that page (a long hex string). Save it as `CLOUDFLARE_ACCOUNT_ID`.
3. Tap your profile, then **API Tokens → Create Token**.
4. Use the **Edit Cloudflare Workers** template. Include this account. Create the token and copy it once. Save it as `CLOUDFLARE_API_TOKEN`.
5. On GitHub, open the **Actions** tab, choose **Deploy device worker**, and tap **Run workflow**.
6. When it is green, open the log. Copy the `https://fitness-devices...workers.dev` address. If the log says the Withings or Fitbit secrets are not set yet, that is expected. Continue to steps 2 and 3, then run the workflow again.

If the Cloudflare secrets are missing, this workflow skips itself. The normal Pages deploy still publishes the app.

## 2. Withings

This scale account is on the US Medical Cloud. The Worker’s `WITHINGS_REGION` is `us`, so sign-in goes to `account.us.withingsmed.com` and data calls go to `wbsapi.us.withingsmed.net`. The public hosts (`account.withings.com` and `wbsapi.withings.net`) are a different cloud and do not serve this account. Set `WITHINGS_REGION` to `eu` only for a public-cloud app.

1. Open [developer.us.withingsmed.com](https://developer.us.withingsmed.com/) and sign in with the same Withings account as the scale.
2. Create an app. For the callback, paste the Withings callback address from above. It must be exact.
3. Turn on the scopes `user.metrics`, `user.activity`, and `user.sleepevents`.
4. Copy the client id into `WITHINGS_CLIENT_ID` and the client secret into `WITHINGS_CLIENT_SECRET`.

## 3. Fitbit, through Google Health

The band, including one named Fitbit Air, syncs to the Fitbit or Google Health app on the phone. This site does not talk to the band over Bluetooth.

As of November 2, 2026, Google turned off the old Fitbit Web API and `api.fitbit.com` sign-in for Google Health users. New apps are created in Google Cloud, and this Worker uses the [Google Health API](https://developers.google.com/health/migration). The secret names stay `FITBIT_CLIENT_ID` and `FITBIT_CLIENT_SECRET`. Paste the Google OAuth client ID and client secret into those two secrets.

Sign-in uses `https://accounts.google.com/o/oauth2/v2/auth` with `access_type=offline` and `prompt=consent`, so Google returns a refresh token. Tokens are exchanged at `https://oauth2.googleapis.com/token`. Daily steps, calories, active minutes, resting heart rate, sleep, weight, and each run or walk come from `https://health.googleapis.com/v4`. Distance and elevation are on the exercise record, so this app does not request the location scope.

Before Connect will work, do these steps in [Google Cloud console](https://console.cloud.google.com/). Use the same Google account that is signed into the Google Health app.

1. Create a project, or open the one Google already created when you started the OAuth client.
2. Open **APIs & Services → Library**, search for **Google Health API**, and click **Enable**. That is the only API to enable.
3. Open **Google Auth Platform → Branding** (or **APIs & Services → OAuth consent screen**). Set the app name to `Fitness`, the user support email to your address, and the app home page to `https://japalaxmanreddy.github.io/Fitness-app/`.
4. Set the user type to **External** and leave the publishing status on **Testing**. A personal app does not need to be published. While it is in Testing, Google refresh tokens expire after 7 days, so Connect again when sync starts asking you to sign in.
5. Open **Google Auth Platform → Data Access** (or **Scopes**). Add only these three read scopes:
   - `https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly` (steps, calories, active minutes, runs, walks, distance)
   - `https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly` (weight and resting heart rate)
   - `https://www.googleapis.com/auth/googlehealth.sleep.readonly` (sleep)
6. Open **Google Auth Platform → Audience**. Under **Test users**, add the Gmail address you use in the Google Health app, then save. Only those addresses can grant access while the app is in Testing.
7. Open **APIs & Services → Credentials → Create credentials → OAuth client ID**. Choose **Web application**. Under **Authorized redirect URIs**, add exactly `https://fitness-devices.j-laxmanreddy.workers.dev/auth/fitbit/callback`. Do not leave the only URI as `https://www.google.com`. That value is only an example in Google’s setup wizard.
8. Copy the client ID into the GitHub secret `FITBIT_CLIENT_ID` and the client secret into `FITBIT_CLIENT_SECRET`.
9. On the phone, open the Google Health app and sign in with that same Google account so the Fitbit data is linked. If it is not linked, Connect will come back and ask you to do this. Google’s link page is [fitbit.google.com/auth/signup](https://fitbit.google.com/auth/signup).
10. Run **Deploy device worker** again so the two secrets are stored on the Worker.

## 4. Turn it on in the app

1. On GitHub, open `src/device-config.ts`.
2. Tap the pencil. Set `DEVICE_WORKER_URL` to the worker address, with no slash at the end. Example: `"https://fitness-devices.YOUR-NAME.workers.dev"`.
3. Commit that change to `main`.
4. Wait until the **Deploy GitHub Pages** action is green.
5. On the iPhone, open the fitness app, go to **Progress**, and tap **Connect** for Withings, then Fitbit. Sign in, and you come back to Progress.
6. Tap **Sync now**. After that, the app syncs by itself at most every six hours.

Weight from Withings is kept ahead of Fitbit. Steps, calories, heart rate, and sleep from Fitbit are kept ahead of Withings. A number you typed in the app is never replaced. A run or walk you type on the Running tab is kept ahead of a Fitbit entry on the same date with a start time within 20 minutes.
