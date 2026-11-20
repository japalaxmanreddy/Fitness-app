/**
 * After the device Worker is deployed, paste its address here.
 * Example: "https://fitness-devices.example.workers.dev"
 * Leave this blank and the Connected devices section stays hidden.
 */
export const DEVICE_WORKER_URL = "";

export function deviceWorkerUrl(): string {
  return DEVICE_WORKER_URL.trim().replace(/\/+$/, "");
}

export function devicesConfigured(): boolean {
  return deviceWorkerUrl() !== "";
}
