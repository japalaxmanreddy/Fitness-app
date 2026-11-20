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
console.log("Callback URL for Withings: https://fitness-devices.<your-subdomain>.workers.dev/auth/withings/callback");
console.log("Callback URL for Fitbit: https://fitness-devices.<your-subdomain>.workers.dev/auth/fitbit/callback");
console.log("Use the https address printed by wrangler above, then add /auth/withings/callback or /auth/fitbit/callback.");
