import { useEffect, useMemo, useState } from "react";
import { LIBRARY_GROUPS, filterLibrary, libraryEntries, type LibraryGroup } from "../day-plan";
import { MoveCard } from "../day-view";
import { takeExerciseRequest } from "../nav";
import { Segmented } from "../ui";

export function Library() {
  const entries = useMemo(() => libraryEntries(), []);
  const [group, setGroup] = useState<LibraryGroup>("All");
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState<string | null>(null);
  const shown = filterLibrary(entries, group, query);

  useEffect(() => {
    const apply = () => {
      const name = takeExerciseRequest();
      if (!name) return;
      setGroup("All");
      setQuery("");
      setFocus(name);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  return (
    <div className="stack-lg">
      <div>
        <h1>Library</h1>
        <p className="lede">Warm-ups, strength moves, stretches, and the short breaks for later in the day.</p>
      </div>
      <label className="field">
        <span>Search</span>
        <input
          type="search"
          placeholder="Search moves"
          value={query}
          enterKeyHint="search"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <Segmented
        label="Library filter"
        value={group}
        onChange={setGroup}
        options={LIBRARY_GROUPS.map((item) => ({ value: item, label: item }))}
        wrap
      />
      {shown.length === 0 ? <p className="note">Nothing matches that search.</p> : null}
      <div className="stack">
        {shown.map((move) => (
          <MoveCard key={`${move.group}-${move.name}`} move={move} initiallyOpen={move.name === focus} />
        ))}
      </div>
    </div>
  );
}
