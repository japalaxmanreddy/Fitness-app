import { useEffect, useState } from "react";
import { ANIMS, lerp, type P, type Prop } from "./motion";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function line(x: P, y: P): string {
  return `M${x[0]},${x[1]} L${y[0]},${y[1]}`;
}

export function Demo({ anim, label }: { anim: string; label: string }) {
  const reduced = usePrefersReducedMotion();
  const [runToken, setRunToken] = useState(0);
  const [t, setT] = useState(0);
  const animate = !reduced || runToken > 0;

  useEffect(() => {
    setT(0);
  }, [anim]);

  useEffect(() => {
    if (!animate) return;
    let frame = 0;
    const start = performance.now();
    const loop = (now: number) => {
      const elapsed = (now - start) / 1000;
      if (document.hidden) {
        frame = requestAnimationFrame(loop);
        return;
      }
      if (reduced && elapsed >= 3.2) {
        setT(0);
        setRunToken(0);
        return;
      }
      setT(elapsed % 3.2);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [animate, anim, reduced]);

  const clip = ANIMS[anim] ?? ANIMS.squat;
  const k = (1 - Math.cos((2 * Math.PI * t) / 3.2)) / 2;
  const h = lerp(clip.a.h, clip.b.h, k);
  const s = lerp(clip.a.s, clip.b.s, k);
  const p = lerp(clip.a.p, clip.b.p, k);
  const e = lerp(clip.a.e, clip.b.e, k);
  const w = lerp(clip.a.w, clip.b.w, k);
  const kn = lerp(clip.a.k, clip.b.k, k);
  const f = lerp(clip.a.f, clip.b.f, k);
  const k2 = lerp(clip.a.k2 ?? clip.a.k, clip.b.k2 ?? clip.b.k, k);
  const f2 = lerp(clip.a.f2 ?? clip.a.f, clip.b.f2 ?? clip.b.f, k);
  const c = clip.a.c && clip.b.c ? lerp(clip.a.c, clip.b.c, k) : null;
  const torso = c ? `M${s[0]},${s[1]} Q${c[0]},${c[1]} ${p[0]},${p[1]}` : line(s, p);

  return (
    <div className="demo">
      <svg viewBox="0 0 200 160" width="100%" role="img" aria-label={`Animation of ${label}`}>
        <line x1={10} y1={150.5} x2={190} y2={150.5} stroke="var(--line)" strokeWidth={1} />
        {(clip.props ?? []).map((prop: Prop, index: number) =>
          prop.t === "r" ? (
            <rect key={index} x={prop.v[0]} y={prop.v[1]} width={prop.v[2]} height={prop.v[3]} rx={2} fill="var(--prop)" opacity={0.5} />
          ) : prop.t === "l" ? (
            <line key={index} x1={prop.v[0]} y1={prop.v[1]} x2={prop.v[2]} y2={prop.v[3]} stroke="var(--prop)" strokeWidth={3} strokeLinecap="round" opacity={0.6} />
          ) : (
            <circle key={index} cx={prop.v[0]} cy={prop.v[1]} r={prop.v[2]} fill="none" stroke="var(--prop)" strokeWidth={3} opacity={0.6} />
          ),
        )}
        <path d={`${line(p, k2)} L${f2[0]},${f2[1]}`} stroke="var(--ink)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.35} />
        <path d={torso} stroke="var(--ink)" strokeWidth={6} strokeLinecap="round" fill="none" />
        <path d={`${line(p, kn)} L${f[0]},${f[1]}`} stroke="var(--ink)" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d={`${line(s, e)} L${w[0]},${w[1]}`} stroke="var(--ink)" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx={h[0]} cy={h[1]} r={8.5} fill="var(--ink)" />
        {clip.weight ? <rect x={w[0] - 8} y={w[1] - 3.5} width={16} height={7} rx={2} fill="var(--accent)" /> : null}
      </svg>
      {reduced ? (
        <button type="button" className="btn" onClick={() => setRunToken((value) => value + 1)}>
          Play animation
        </button>
      ) : null}
    </div>
  );
}
