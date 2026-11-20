import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const token = process.env.CLOUDFLARE_API_TOKEN || "";
const account = process.env.CLOUDFLARE_ACCOUNT_ID || "";
if (!token || !account) {
  console.log("Cloudflare secrets are not set. Skipping Worker deploy. The Pages site is unchanged.");
  process.exit(0);
}

const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
const listUrl = `https://api.cloudflare.com/client/v4/accounts/${account}/storage/kv/namespaces`;
const listed = await fetch(listUrl, { headers });
const listBody = await listed.json();
if (!listed.ok || !listBody.success) {
  console.error("Could not list KV namespaces. Check CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID.");
  process.exit(1);
}
let namespaceId = (listBody.result || []).find((item) => item.title === "FITNESS_TOKENS")?.id;
if (!namespaceId) {
  const created = await fetch(listUrl, { method: "POST", headers, body: JSON.stringify({ title: "FITNESS_TOKENS" }) });
  const createdBody = await created.json();
  if (!created.ok || !createdBody.success) {
    console.error("Could not create the FITNESS_TOKENS namespace.");
    process.exit(1);
  }
  namespaceId = createdBody.result.id;
  console.log(`Created KV namespace FITNESS_TOKENS ${namespaceId}`);
}

const config = readFileSync("wrangler.toml", "utf8").replace("REPLACE_WITH_KV_ID", namespaceId);
writeFileSync("wrangler.toml", config);

const subdomain = await ensureWorkersSubdomain();
console.log(`workers.dev subdomain: ${subdomain}`);

const secrets = ["WITHINGS_CLIENT_ID", "WITHINGS_CLIENT_SECRET", "FITBIT_CLIENT_ID", "FITBIT_CLIENT_SECRET"];
for (const name of secrets) {
  const value = process.env[name] || "";
  if (!value) {
    console.log(`${name} is not set yet. Add it in GitHub secrets and run this workflow again before Connect will work.`);
    continue;
  }
  const put = spawnSync("npx", ["wrangler", "secret", "put", name], { input: value, encoding: "utf8" });
  if (put.status !== 0) {
    console.error(put.stdout);
    console.error(put.stderr);
    process.exit(put.status || 1);
  }
}

const deployed = spawnSync("npx", ["wrangler", "deploy"], { encoding: "utf8" });
process.stdout.write(deployed.stdout || "");
process.stderr.write(deployed.stderr || "");
if (deployed.status !== 0) process.exit(deployed.status || 1);
const workerUrl = `https://fitness-devices.${subdomain}.workers.dev`;
console.log(`Worker URL: ${workerUrl}`);
console.log(`Callback URL for Withings: ${workerUrl}/auth/withings/callback`);
console.log(`Callback URL for Fitbit: ${workerUrl}/auth/fitbit/callback`);

async function ensureWorkersSubdomain() {
  const current = await accountFetch("/workers/subdomain");
  const existing = current.body?.result?.subdomain;
  if (current.body?.success && existing) return existing;
  const missing = (current.body?.errors || []).some((error) => error.code === 10007);
  if (!missing && !current.body?.success) {
    console.error("Could not read the workers.dev subdomain.");
    console.error(JSON.stringify(current.body?.errors || []));
    process.exit(1);
  }
  const suffix = account.replace(/[^a-z0-9]/gi, "").slice(0, 8).toLowerCase();
  const candidates = ["fitness-app", "fitness-devices", suffix ? `fitness-${suffix}` : ""].filter(Boolean);
  for (const name of candidates) {
    const created = await accountFetch("/workers/subdomain", {
      method: "PUT",
      body: JSON.stringify({ subdomain: name }),
    });
    if (created.body?.success && created.body.result?.subdomain) {
      console.log(`Registered workers.dev subdomain ${created.body.result.subdomain}`);
      return created.body.result.subdomain;
    }
    const taken = (created.body?.errors || []).some((error) => error.code === 10031);
    if (taken) continue;
    console.error("Could not register a workers.dev subdomain.");
    console.error(JSON.stringify(created.body?.errors || []));
    console.error("Open the Workers onboarding page in the Cloudflare dashboard and register a subdomain, then run this workflow again.");
    process.exit(1);
  }
  console.error("Could not register a workers.dev subdomain. The tried names were already taken.");
  process.exit(1);
}

async function accountFetch(path, init) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}${path}`, {
    ...init,
    headers,
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}
