import { deviceWorkerUrl, devicesConfigured } from "./device-config";
import type { SyncedDay } from "./sync-merge";

const DEVICE_ID_KEY = "fitness-device-id";
const LAST_SYNC_KEY = "fitness-last-sync";
const MOCK_KEY = "fitness-mock-devices";
export const SYNC_GAP_MS = 6 * 60 * 60 * 1000;

export type DeviceLinks = { withings: boolean; fitbit: boolean };

export type SyncPayload = {
  days: SyncedDay[];
  connected: DeviceLinks;
  warnings: string[];
};

export function getDeviceId(): string {
  const current = localStorage.getItem(DEVICE_ID_KEY) ?? "";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(current)) return current;
  const created = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, created);
  return created;
}

export function lastSyncTime(): string {
  return localStorage.getItem(LAST_SYNC_KEY) ?? "";
}

export function rememberSync(time = new Date().toISOString()): void {
  localStorage.setItem(LAST_SYNC_KEY, time);
}

export function syncIsDue(now = Date.now()): boolean {
  const last = Date.parse(lastSyncTime());
  if (!Number.isFinite(last)) return true;
  return now - last >= SYNC_GAP_MS;
}

function mockFlags(): DeviceLinks {
  try {
    const raw = JSON.parse(localStorage.getItem(MOCK_KEY) ?? "{}") as Partial<DeviceLinks>;
    return { withings: Boolean(raw.withings), fitbit: Boolean(raw.fitbit) };
  } catch {
    return { withings: false, fitbit: false };
  }
}

function saveMock(flags: DeviceLinks): void {
  localStorage.setItem(MOCK_KEY, JSON.stringify(flags));
}

function mockPayload(): SyncPayload {
  const connected = mockFlags();
  const date = new Date().toISOString().slice(0, 10);
  const day: SyncedDay = { date };
  if (connected.withings) {
    day.weightLb = 194.2;
    day.fatPct = 24.1;
    day.muscleLb = 78.4;
    day.bmi = 27.1;
    day.weightSource = "withings";
    day.bodySource = "withings";
  }
  if (connected.fitbit) {
    day.steps = 8420;
    day.calories = 2140;
    day.activeMinutes = 32;
    day.restingHr = 62;
    day.sleepMinutes = 430;
    day.stepsSource = "fitbit";
    day.caloriesSource = "fitbit";
    day.activitySource = "fitbit";
    day.sleepSource = "fitbit";
  }
  return { days: connected.withings || connected.fitbit ? [day] : [], connected, warnings: [] };
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`${deviceWorkerUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getDeviceId()}`,
      ...(init?.headers ?? {}),
    },
  });
  return response;
}

export async function deviceStatus(): Promise<DeviceLinks> {
  if (deviceWorkerUrl() === "mock") return mockFlags();
  const response = await request("/status");
  if (!response.ok) throw new Error("The sync service did not answer.");
  const body = (await response.json()) as Partial<DeviceLinks>;
  return { withings: Boolean(body.withings), fitbit: Boolean(body.fitbit) };
}

export function connectDevice(provider: "withings" | "fitbit"): void {
  if (deviceWorkerUrl() === "mock") {
    const flags = mockFlags();
    flags[provider] = true;
    saveMock(flags);
    return;
  }
  const url = new URL(`${deviceWorkerUrl()}/auth/${provider}/start`);
  url.searchParams.set("device", getDeviceId());
  window.location.assign(url.toString());
}

export async function disconnectDevice(provider: "withings" | "fitbit"): Promise<void> {
  if (deviceWorkerUrl() === "mock") {
    const flags = mockFlags();
    flags[provider] = false;
    saveMock(flags);
    return;
  }
  const response = await request("/disconnect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider }),
  });
  if (!response.ok) throw new Error("Could not disconnect.");
}

export async function syncDevices(days = 30): Promise<SyncPayload> {
  if (deviceWorkerUrl() === "mock") {
    rememberSync();
    return mockPayload();
  }
  const response = await request(`/sync?days=${days}`);
  if (!response.ok) throw new Error("Sync did not finish.");
  const body = (await response.json()) as Partial<SyncPayload>;
  rememberSync();
  return {
    days: Array.isArray(body.days) ? body.days : [],
    connected: { withings: Boolean(body.connected?.withings), fitbit: Boolean(body.connected?.fitbit) },
    warnings: Array.isArray(body.warnings) ? body.warnings : [],
  };
}

export { devicesConfigured };
