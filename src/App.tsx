import { useEffect, useState } from "react";
import { formatLong } from "./dates";
import { Library } from "./screens/Library";
import { Progress } from "./screens/Progress";
import { Running } from "./screens/Running";
import { Today } from "./screens/Today";
import { Workouts } from "./screens/Workouts";
import { useStore } from "./store";
import type { ThemeChoice } from "./storage";
import { Icon } from "./ui";

const TABS = [
  { id: "today", label: "Today" },
  { id: "workouts", label: "Workouts" },
  { id: "running", label: "Running" },
  { id: "library", label: "Library" },
  { id: "progress", label: "Progress" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function tabFromHash(): TabId {
  const hash = location.hash.replace("#", "");
  if (hash === "exercises" || hash === "stretch") return "library";
  return TABS.some((tab) => tab.id === hash) ? (hash as TabId) : "today";
}

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function isDark(theme: ThemeChoice): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return prefersDark();
}

export function App() {
  const { data, setProfile, saveError } = useStore();
  const [tab, setTab] = useState<TabId>(tabFromHash);
  const dark = isDark(data.profile.theme);

  useEffect(() => {
    const onHash = () => {
      const hash = location.hash.replace("#", "");
      if (hash === "exercises" || hash === "stretch") history.replaceState(null, "", "#library");
      setTab(tabFromHash());
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (data.profile.theme === "system") document.documentElement.dataset.theme = media.matches ? "dark" : "light";
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [dark, data.profile.theme]);

  return (
    <div className="phone">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="header">
        <div>
          <p className="wordmark">Fitness</p>
          <p className="header-date">{formatLong()}</p>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
          onClick={() => setProfile({ theme: dark ? "light" : "dark" })}
        >
          <Icon name={dark ? "sun" : "moon"} />
        </button>
      </header>
      {saveError ? (
        <p className="banner" role="alert">
          {saveError}
        </p>
      ) : null}
      <main id="content" className="main">
        {tab === "today" ? <Today /> : null}
        {tab === "workouts" ? <Workouts /> : null}
        {tab === "running" ? <Running /> : null}
        {tab === "library" ? <Library /> : null}
        {tab === "progress" ? <Progress /> : null}
      </main>
      <nav className="tabbar" aria-label="Primary">
        {TABS.map((item) => (
          <button key={item.id} type="button" aria-current={tab === item.id ? "page" : undefined} onClick={() => { location.hash = item.id; }}>
            <Icon name={item.id} />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
