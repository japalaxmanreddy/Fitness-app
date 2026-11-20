import { combineDays, parseHealthActiveMinutes, parseHealthCalorieRollup, parseHealthExercises, parseHealthRestingHeart, parseHealthSleep, parseHealthStepsRollup, parseHealthWeight, parseWithingsActivity, parseWithingsMeasures, parseWithingsSleep, type FitbitActivity, type SyncedDay } from "./normalize";
import { withingsHosts } from "./withings-hosts";

export interface Env {
  TOKENS: KVNamespace;
  APP_ORIGIN: string;
  WITHINGS_REGION?: string;
  WITHINGS_CLIENT_ID?: string;
  WITHINGS_CLIENT_SECRET?: string;
  FITBIT_CLIENT_ID?: string;
  FITBIT_CLIENT_SECRET?: string;
}

type Provider = "withings" | "fitbit";

type PendingAuth = {
  provider: Provider;
  deviceId: string;
  verifier: string;
  created: number;
};

type SavedToken = {
  refreshToken: string;
  accessToken: string;
  expiresAt: number;
};

const APP_PATH = "/Fitness-app/";
const GOOGLE_HEALTH_SCOPES = [
  "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
  "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
  "https://www.googleapis.com/auth/googlehealth.sleep.readonly",
].join(" ");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }), env);
    if (url.pathname === "/auth/withings/start") return startAuth(request, env, "withings");
    if (url.pathname === "/auth/fitbit/start") return startAuth(request, env, "fitbit");
    if (url.pathname === "/auth/withings/callback") return callback(request, env, "withings");
    if (url.pathname === "/auth/fitbit/callback") return callback(request, env, "fitbit");
    if (url.pathname === "/status" && request.method === "GET") return cors(await status(request, env), env);
    if (url.pathname === "/sync" && request.method === "GET") return cors(await sync(request, env), env);
    if (url.pathname === "/disconnect" && request.method === "POST") return cors(await disconnect(request, env), env);
    if (url.pathname === "/") return json({ ok: true }, 200);
    return json({ error: "Not found" }, 404);
  },
};

function cors(response: Response, env: Env): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", env.APP_ORIGIN || "https://japalaxmanreddy.github.io");
  headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Vary", "Origin");
  return new Response(response.body, { status: response.status, headers });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function deviceIdFrom(request: Request): string | null {
  const header = request.headers.get("Authorization") ?? "";
  const match = /^Bearer\s+([0-9a-f-]{36})$/i.exec(header);
  if (!match || !UUID.test(match[1])) return null;
  return match[1].toLowerCase();
}

function callbackUrl(request: Request, provider: Provider): string {
  const url = new URL(request.url);
  return `${url.origin}/auth/${provider}/callback`;
}

function appReturn(env: Env, provider: Provider, error?: string): string {
  const origin = (env.APP_ORIGIN || "https://japalaxmanreddy.github.io").replace(/\/+$/, "");
  const params = new URLSearchParams(error ? { error } : { connected: provider });
  return `${origin}${APP_PATH}?${params.toString()}#progress`;
}

async function startAuth(request: Request, env: Env, provider: Provider): Promise<Response> {
  const url = new URL(request.url);
  const deviceId = (url.searchParams.get("device") ?? "").toLowerCase();
  if (!UUID.test(deviceId)) return new Response("That device id is not valid.", { status: 400 });
  if (provider === "withings" && (!env.WITHINGS_CLIENT_ID || !env.WITHINGS_CLIENT_SECRET)) {
    return Response.redirect(appReturn(env, provider, "Withings is not set up on the sync service yet."), 302);
  }
  if (provider === "fitbit" && (!env.FITBIT_CLIENT_ID || !env.FITBIT_CLIENT_SECRET)) {
    return Response.redirect(appReturn(env, provider, "Fitbit is not set up on the sync service yet."), 302);
  }
  const state = crypto.randomUUID();
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const pending: PendingAuth = { provider, deviceId, verifier, created: Date.now() };
  await env.TOKENS.put(`pending:${state}`, JSON.stringify(pending), { expirationTtl: 600 });
  const redirect = callbackUrl(request, provider);
  if (provider === "withings") {
    const auth = new URL(withingsHosts(env.WITHINGS_REGION).authorize);
    auth.searchParams.set("response_type", "code");
    auth.searchParams.set("client_id", env.WITHINGS_CLIENT_ID || "");
    auth.searchParams.set("redirect_uri", redirect);
    auth.searchParams.set("scope", "user.metrics,user.activity,user.sleepevents");
    auth.searchParams.set("state", state);
    return Response.redirect(auth.toString(), 302);
  }
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("client_id", env.FITBIT_CLIENT_ID || "");
  auth.searchParams.set("redirect_uri", redirect);
  auth.searchParams.set("scope", GOOGLE_HEALTH_SCOPES);
  auth.searchParams.set("access_type", "offline");
  auth.searchParams.set("prompt", "consent");
  auth.searchParams.set("state", state);
  return Response.redirect(auth.toString(), 302);
}

async function callback(request: Request, env: Env, provider: Provider): Promise<Response> {
  const url = new URL(request.url);
  const state = url.searchParams.get("state") ?? "";
  const code = url.searchParams.get("code") ?? "";
  const raw = await env.TOKENS.get(`pending:${state}`);
  if (!raw) return Response.redirect(appReturn(env, provider, "That sign-in expired. Try Connect again."), 302);
  const pending = JSON.parse(raw) as PendingAuth;
  await env.TOKENS.delete(`pending:${state}`);
  if (pending.provider !== provider || !code) {
    return Response.redirect(appReturn(env, provider, "Sign-in did not finish."), 302);
  }
  try {
    const token = provider === "withings"
      ? await withingsToken(env, { grant_type: "authorization_code", code, redirect_uri: callbackUrl(request, provider) })
      : await fitbitToken(env, { grant_type: "authorization_code", code, redirect_uri: callbackUrl(request, provider) });
    await env.TOKENS.put(tokenKey(pending.deviceId, provider), JSON.stringify(token));
    return Response.redirect(appReturn(env, provider), 302);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign-in failed.";
    return Response.redirect(appReturn(env, provider, message), 302);
  }
}

async function status(request: Request, env: Env): Promise<Response> {
  const deviceId = deviceIdFrom(request);
  if (!deviceId) return json({ error: "Sign-in for this phone is missing." }, 401);
  return json({
    withings: Boolean(await env.TOKENS.get(tokenKey(deviceId, "withings"))),
    fitbit: Boolean(await env.TOKENS.get(tokenKey(deviceId, "fitbit"))),
  });
}

async function disconnect(request: Request, env: Env): Promise<Response> {
  const deviceId = deviceIdFrom(request);
  if (!deviceId) return json({ error: "Sign-in for this phone is missing." }, 401);
  const body = (await request.json().catch(() => null)) as { provider?: string } | null;
  if (body?.provider !== "withings" && body?.provider !== "fitbit") return json({ error: "Choose Withings or Fitbit." }, 400);
  await env.TOKENS.delete(tokenKey(deviceId, body.provider));
  return json({ ok: true });
}

async function sync(request: Request, env: Env): Promise<Response> {
  const deviceId = deviceIdFrom(request);
  if (!deviceId) return json({ error: "Sign-in for this phone is missing." }, 401);
  const days = Math.min(30, Math.max(1, Number(new URL(request.url).searchParams.get("days") ?? 30) || 30));
  const warnings: string[] = [];
  const emptyMaps = blankMaps();
  let activities: FitbitActivity[] | null = null;
  let withings = false;
  let fitbit = false;
  if (await env.TOKENS.get(tokenKey(deviceId, "withings"))) {
    withings = true;
    try {
      Object.assign(emptyMaps, await fetchWithings(env, deviceId, days));
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : "Withings sync failed.");
    }
  }
  if (await env.TOKENS.get(tokenKey(deviceId, "fitbit"))) {
    fitbit = true;
    try {
      const fitbitData = await fetchFitbit(env, deviceId, days);
      Object.assign(emptyMaps, fitbitData.maps);
      activities = fitbitData.activities;
      if (fitbitData.activityWarning) warnings.push(fitbitData.activityWarning);
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : "Fitbit sync failed.");
    }
  }
  const records: SyncedDay[] = combineDays(emptyMaps);
  return json({ days: records, activities, connected: { withings, fitbit }, warnings });
}

function blankMaps() {
  return {
    withingsMeasures: new Map(),
    withingsActivity: new Map(),
    withingsSleep: new Map(),
    fitbitSteps: new Map(),
    fitbitCalories: new Map(),
    fitbitFairly: new Map(),
    fitbitVery: new Map(),
    fitbitHeart: new Map(),
    fitbitSleep: new Map(),
    fitbitWeight: new Map(),
  };
}

function tokenKey(deviceId: string, provider: Provider): string {
  return `token:${deviceId}:${provider}`;
}

async function readToken(env: Env, deviceId: string, provider: Provider): Promise<SavedToken | null> {
  const raw = await env.TOKENS.get(tokenKey(deviceId, provider));
  return raw ? (JSON.parse(raw) as SavedToken) : null;
}

async function accessToken(env: Env, deviceId: string, provider: Provider): Promise<string> {
  const saved = await readToken(env, deviceId, provider);
  if (!saved) throw new Error(`${provider} is not connected.`);
  if (saved.expiresAt > Date.now() + 60_000) return saved.accessToken;
  const refreshed = provider === "withings"
    ? await withingsToken(env, { grant_type: "refresh_token", refresh_token: saved.refreshToken })
    : await fitbitToken(env, { grant_type: "refresh_token", refresh_token: saved.refreshToken }, saved.refreshToken);
  await env.TOKENS.put(tokenKey(deviceId, provider), JSON.stringify(refreshed));
  return refreshed.accessToken;
}

async function withingsToken(env: Env, fields: Record<string, string>): Promise<SavedToken> {
  const body = new URLSearchParams({
    action: "requesttoken",
    client_id: env.WITHINGS_CLIENT_ID || "",
    client_secret: env.WITHINGS_CLIENT_SECRET || "",
    ...fields,
  });
  const response = await fetch(`${withingsHosts(env.WITHINGS_REGION).api}/v2/oauth2`, { method: "POST", body });
  const payload = (await response.json()) as { status?: number; body?: { access_token?: string; refresh_token?: string; expires_in?: number } };
  if (!response.ok || payload.status !== 0 || !payload.body?.access_token || !payload.body.refresh_token) {
    throw new Error("Withings did not accept the sign-in.");
  }
  return {
    accessToken: payload.body.access_token,
    refreshToken: payload.body.refresh_token,
    expiresAt: Date.now() + (payload.body.expires_in ?? 10800) * 1000,
  };
}

async function fitbitToken(env: Env, fields: Record<string, string>, previousRefresh = ""): Promise<SavedToken> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.FITBIT_CLIENT_ID || "",
      client_secret: env.FITBIT_CLIENT_SECRET || "",
      ...fields,
    }),
  });
  const payload = (await response.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; error_description?: string };
  const refreshToken = payload.refresh_token || previousRefresh;
  if (!response.ok || !payload.access_token || !refreshToken) {
    throw new Error(payload.error_description || "Google Health did not accept the sign-in.");
  }
  return {
    accessToken: payload.access_token,
    refreshToken,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
  };
}

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function range(days: number): { start: string; end: string; startUnix: number; endUnix: number } {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - (days - 1) * 86400000);
  return { start: ymd(startDate), end: ymd(endDate), startUnix: Math.floor(startDate.getTime() / 1000), endUnix: Math.floor(endDate.getTime() / 1000) };
}

async function fetchWithings(env: Env, deviceId: string, days: number) {
  const token = await accessToken(env, deviceId, "withings");
  const window = range(days);
  const api = withingsHosts(env.WITHINGS_REGION).api;
  const measures = await withingsPost(token, `${api}/measure`, {
    action: "getmeas",
    meastypes: "1,4,6,76",
    category: "1",
    startdate: String(window.startUnix),
    enddate: String(window.endUnix),
  });
  const activity = await withingsPost(token, `${api}/v2/measure`, {
    action: "getactivity",
    startdateymd: window.start,
    enddateymd: window.end,
  });
  const sleep = await withingsPost(token, `${api}/v2/sleep`, {
    action: "getsummary",
    startdateymd: window.start,
    enddateymd: window.end,
  });
  return {
    withingsMeasures: parseWithingsMeasures(measures),
    withingsActivity: parseWithingsActivity(activity),
    withingsSleep: parseWithingsSleep(sleep),
  };
}

async function withingsPost(token: string, url: string, fields: Record<string, string>): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: new URLSearchParams(fields),
  });
  const payload = (await response.json()) as { status?: number; body?: Record<string, unknown> };
  if (!response.ok || payload.status !== 0) throw new Error("Withings data could not be read.");
  return payload.body ?? {};
}

async function fetchFitbit(env: Env, deviceId: string, days: number) {
  const token = await accessToken(env, deviceId, "fitbit");
  const window = range(days);
  const endExclusive = addIsoDay(window.end, 1);
  const calorieStart = addIsoDay(window.end, -13);
  const warnings: string[] = [];
  const read = async <T>(label: string, load: () => Promise<T>, empty: T): Promise<T> => {
    try {
      return await load();
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : `${label} could not be read.`);
      return empty;
    }
  };
  const [steps, calories, active, heart, sleep, weight, exercises] = await Promise.all([
    read("Steps", () => healthRollup(token, "steps", window.start, endExclusive), []),
    read("Calories", () => healthRollup(token, "total-calories", calorieStart, endExclusive), []),
    read("Active minutes", () => healthList(token, "active-minutes", `active_minutes.interval.civil_start_time >= "${window.start}" AND active_minutes.interval.civil_start_time < "${endExclusive}"`), []),
    read("Heart rate", () => healthList(token, "daily-resting-heart-rate", `daily_resting_heart_rate.date >= "${window.start}" AND daily_resting_heart_rate.date < "${endExclusive}"`), []),
    read("Sleep", () => healthList(token, "sleep", `sleep.interval.civil_end_time >= "${window.start}" AND sleep.interval.civil_end_time < "${endExclusive}"`, 25), []),
    read("Weight", () => healthList(token, "weight", `weight.sample_time.civil_time >= "${window.start}" AND weight.sample_time.civil_time < "${endExclusive}"`), []),
    read("Runs", () => healthList(token, "exercise", `exercise.interval.civil_start_time >= "${window.start}" AND exercise.interval.civil_start_time < "${endExclusive}"`, 25), []),
  ]);
  const minutes = parseHealthActiveMinutes(active as Parameters<typeof parseHealthActiveMinutes>[0]);
  return {
    maps: {
      fitbitSteps: parseHealthStepsRollup(steps as Parameters<typeof parseHealthStepsRollup>[0]),
      fitbitCalories: parseHealthCalorieRollup(calories as Parameters<typeof parseHealthCalorieRollup>[0]),
      fitbitFairly: minutes.fairly,
      fitbitVery: minutes.very,
      fitbitHeart: parseHealthRestingHeart(heart as Parameters<typeof parseHealthRestingHeart>[0]),
      fitbitSleep: parseHealthSleep(sleep as Parameters<typeof parseHealthSleep>[0]),
      fitbitWeight: parseHealthWeight(weight as Parameters<typeof parseHealthWeight>[0]),
    },
    activities: parseHealthExercises(exercises as Parameters<typeof parseHealthExercises>[0]) as FitbitActivity[],
    activityWarning: warnings[0] || "",
  };
}

function addIsoDay(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function civilDate(iso: string): { date: { year: number; month: number; day: number } } {
  const [year, month, day] = iso.split("-").map(Number);
  return { date: { year, month, day } };
}

async function healthJson(token: string, path: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const response = await fetch(`https://health.googleapis.com/v4${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = (await response.json().catch(() => ({}))) as { error?: { details?: { reason?: string }[] } };
  if (!response.ok) {
    if (body.error?.details?.some((detail) => detail.reason === "ACCOUNT_NOT_LINKED")) {
      throw new Error("This Google account is not linked to Google Health yet. Open the Google Health app, sign in, then connect again.");
    }
    throw new Error("Google Health data could not be read.");
  }
  return body as Record<string, unknown>;
}

async function healthRollup(token: string, dataType: string, start: string, end: string): Promise<unknown[]> {
  const body = await healthJson(token, `/users/me/dataTypes/${dataType}/dataPoints:dailyRollUp`, {
    method: "POST",
    body: JSON.stringify({ range: { start: civilDate(start), end: civilDate(end) }, windowSizeDays: 1 }),
  });
  return Array.isArray(body.rollupDataPoints) ? body.rollupDataPoints : [];
}

async function healthList(token: string, dataType: string, filter: string, pageSize = 1000): Promise<unknown[]> {
  const points: unknown[] = [];
  let pageToken = "";
  for (let page = 0; page < 8; page += 1) {
    const params = new URLSearchParams({ filter, pageSize: String(pageSize) });
    if (pageToken) params.set("pageToken", pageToken);
    const body = await healthJson(token, `/users/me/dataTypes/${dataType}/dataPoints?${params.toString()}`);
    const batch = Array.isArray(body.dataPoints) ? body.dataPoints : [];
    points.push(...batch);
    pageToken = typeof body.nextPageToken === "string" ? body.nextPageToken : "";
    if (!pageToken || batch.length < pageSize) break;
  }
  return points;
}

function base64url(bytes: Uint8Array): string {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
