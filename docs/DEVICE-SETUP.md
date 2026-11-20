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

1. Open [developer.withings.com](https://developer.withings.com/) and sign in with the same Withings account as the scale.
2. Create an app. For the callback, paste the Withings callback address from above. It must be exact.
3. Turn on the scopes `user.metrics`, `user.activity`, and `user.sleepevents`.
4. Copy the client id into `WITHINGS_CLIENT_ID` and the client secret into `WITHINGS_CLIENT_SECRET`.

## 3. Fitbit

The band, including one named Fitbit Air, syncs to the Fitbit app on the phone. This site does not talk to the band over Bluetooth. It reads the Fitbit account after the band has synced.

Use the Fitbit Web API, not Google Fit. Google closed the Google Fit APIs. Fitbit’s own API at `api.fitbit.com` is still the one for a Fitbit account. This app asks for daily totals (steps, calories, active minutes, resting heart rate, sleep, weight) and for each Run or Walk on the activity list. It does not ask for minute-by-minute intraday data, which Fitbit reviews separately. If Google moves the developer site, start at [dev.fitbit.com](https://dev.fitbit.com/).

Runs and walks come from `GET /1/user/-/activities/list.json`. For each Run or Walk the Worker keeps the date and start time, distance, duration, average heart rate, calories, steps, elevation, and heart-rate zone minutes. Pace is distance divided by time. The `activity` and `heartrate` scopes already cover that list, so this app does not add the `location` scope. Distance is stored on the activity itself, including a treadmill entry that has no GPS track. The location scope would only add the GPS path, which this app does not draw. A band with no GPS still shows distance when Fitbit saved it on the activity. People who already connected Fitbit do not need to sign in again for this.

1. Open [dev.fitbit.com/apps/new](https://dev.fitbit.com/apps/new) while signed into the Fitbit account that owns the band.
2. Fill the form:
   - Application name: `Fitness`
   - Description: `Personal fitness log`
   - Application website: `https://japalaxmanreddy.github.io/Fitness-app/`
   - Organization: your name
   - Organization website: `https://japalaxmanreddy.github.io/Fitness-app/`
   - Terms of service and privacy policy: the same site address
   - OAuth 2.0 Application type: **Personal** (only your own Fitbit login can connect)
   - Redirect URL: the Fitbit callback address from above, exact
   - Access type: **Read-Only**
3. Save. Copy the OAuth 2.0 Client ID into `FITBIT_CLIENT_ID` and the Client Secret into `FITBIT_CLIENT_SECRET`.
4. Run **Deploy device worker** again so those secrets are stored on the Worker.

## 4. Turn it on in the app

1. On GitHub, open `src/device-config.ts`.
2. Tap the pencil. Set `DEVICE_WORKER_URL` to the worker address, with no slash at the end. Example: `"https://fitness-devices.YOUR-NAME.workers.dev"`.
3. Commit that change to `main`.
4. Wait until the **Deploy GitHub Pages** action is green.
5. On the iPhone, open the fitness app, go to **Progress**, and tap **Connect** for Withings, then Fitbit. Sign in, and you come back to Progress.
6. Tap **Sync now**. After that, the app syncs by itself at most every six hours.

Weight from Withings is kept ahead of Fitbit. Steps, calories, heart rate, and sleep from Fitbit are kept ahead of Withings. A number you typed in the app is never replaced. A run or walk you type on the Running tab is kept ahead of a Fitbit entry on the same date with a start time within 20 minutes.
