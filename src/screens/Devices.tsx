import { useEffect, useRef, useState } from "react";
import { deviceWorkerUrl, devicesConfigured } from "../device-config";
import {
  connectDevice,
  deviceStatus,
  disconnectDevice,
  lastSyncTime,
  syncDevices,
  syncIsDue,
  type DeviceLinks,
} from "../devices";
import { mergeSync } from "../sync-merge";
import { useStore } from "../store";

const EMPTY: DeviceLinks = { withings: false, fitbit: false };

export function Devices() {
  const configured = devicesConfigured();
  const { data, setCheckins } = useStore();
  const checkins = useRef(data.checkins);
  checkins.current = data.checkins;
  const [links, setLinks] = useState<DeviceLinks>(EMPTY);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [syncedAt, setSyncedAt] = useState(lastSyncTime);

  async function runSync(quiet = false) {
    setBusy(true);
    try {
      const payload = await syncDevices();
      setLinks(payload.connected);
      setCheckins(mergeSync(checkins.current, payload.days));
      setSyncedAt(lastSyncTime());
      if (!quiet) setMessage(payload.warnings[0] || "Synced.");
      else if (payload.warnings[0]) setMessage(payload.warnings[0]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sync did not finish.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!configured) return;
    const params = new URLSearchParams(location.search);
    if (params.get("connected") === "withings" || params.get("connected") === "fitbit") {
      setMessage(`${params.get("connected") === "withings" ? "Withings" : "Fitbit"} is connected.`);
    } else if (params.get("error")) {
      setMessage(params.get("error") || "");
    }
    let cancel = false;
    deviceStatus()
      .then((next) => {
        if (!cancel) setLinks(next);
      })
      .catch(() => {
        if (!cancel) setMessage("The sync service did not answer.");
      });
    if (syncIsDue()) void runSync(true);
    return () => {
      cancel = true;
    };
    // Auto-sync only when this screen first opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured]);

  if (!configured) return null;

  async function onDisconnect(provider: "withings" | "fitbit") {
    setBusy(true);
    try {
      await disconnectDevice(provider);
      setLinks(await deviceStatus());
      setMessage(`${provider === "withings" ? "Withings" : "Fitbit"} disconnected.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not disconnect.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card stack">
      <h2>Connected devices</h2>
      <p className="note">Withings and Fitbit can fill weight, steps, and calories. Numbers you type yourself stay put.</p>
      <DeviceRow
        name="Withings"
        connected={links.withings}
        busy={busy}
        onConnect={() => {
          connectDevice("withings");
          if (deviceWorkerUrl() === "mock") void deviceStatus().then(setLinks);
        }}
        onDisconnect={() => void onDisconnect("withings")}
      />
      <DeviceRow
        name="Fitbit"
        connected={links.fitbit}
        busy={busy}
        onConnect={() => {
          connectDevice("fitbit");
          if (deviceWorkerUrl() === "mock") void deviceStatus().then(setLinks);
        }}
        onDisconnect={() => void onDisconnect("fitbit")}
      />
      <button type="button" className="btn primary" disabled={busy} onClick={() => void runSync(false)}>
        {busy ? "Syncing…" : "Sync now"}
      </button>
      <p className="note">{syncedAt ? `Last sync ${new Date(syncedAt).toLocaleString()}` : "Not synced yet."}</p>
      {message ? <p className="note">{message}</p> : null}
    </section>
  );
}

function DeviceRow({
  name,
  connected,
  busy,
  onConnect,
  onDisconnect,
}: {
  name: string;
  connected: boolean;
  busy: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="device-row">
      <div>
        <strong>{name}</strong>
        <p className="note">{connected ? "Connected" : "Not connected"}</p>
      </div>
      {connected ? (
        <button type="button" className="btn" disabled={busy} onClick={onDisconnect}>
          Disconnect
        </button>
      ) : (
        <button type="button" className="btn" disabled={busy} onClick={onConnect}>
          Connect
        </button>
      )}
    </div>
  );
}
