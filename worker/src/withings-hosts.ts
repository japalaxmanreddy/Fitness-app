export type WithingsHosts = {
  authorize: string;
  api: string;
};

const US: WithingsHosts = {
  authorize: "https://account.us.withingsmed.com/oauth2_user/authorize2",
  api: "https://wbsapi.us.withingsmed.net",
};

const EU: WithingsHosts = {
  authorize: "https://account.withings.com/oauth2_user/authorize2",
  api: "https://wbsapi.withings.net",
};

export function withingsHosts(region: string | undefined): WithingsHosts {
  const value = (region || "us").trim().toLowerCase();
  if (value === "eu" || value === "public") return EU;
  return US;
}
