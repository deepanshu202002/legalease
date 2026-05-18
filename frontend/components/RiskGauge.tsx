"use client";
import { useEffect, useRef, useState } from "react";

interface RiskGaugeProps { score: number; label: string; }
const R = 70;
const CIRC = Math.PI * R;

function col(s: number) {
  if (s <= 33) return "#10b981";
  if (s <= 66) return "#f59e0b";
  return "#ef4444";
}

export default function RiskGauge({ score, label }: RiskGaugeProps) {
  const [cur, setCur] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const t0 = performance.now();
    const run = (now: number) => {
      const p = Math.min((now - t0) / 900, 1);
      setCur(Math.round((1 - Math.pow(1 - p, 3)) * score));
      if (p < 1) raf.current = requestAnimationFrame(run);
    };
    raf.current = requestAnimationFrame(run);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [score]);

  const offset = CIRC - (cur / 100) * CIRC;
  const c = col(score);
  const segs = [
    { c: "#10b981", on: score > 0 }, { c: "#34d399", on: score > 20 },
    { c: "#f59e0b", on: score > 40 }, { c: "#f87171", on: score > 60 },
    { c: "#ef4444", on: score > 80 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ position: "relative", width: 140, height: 80 }}>
        <svg viewBox="0 0 160 90" width="140" height="80">
          <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
          <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke={c} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${CIRC} ${CIRC}`} strokeDashoffset={offset}
            style={{ transition: "stroke 0.4s ease", filter: `drop-shadow(0 0 8px ${c}80)` }} />
        </svg>
        <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: c, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{cur}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>/100</div>
        </div>
      </div>
      <div style={{ display:"flex",gap:5 }}>
        {segs.map((s,i)=>(
          <div key={i} style={{
            width:28,height:6,borderRadius:3,
            background:s.on ? s.c : "rgba(255,255,255,0.1)",
            transition:"background 0.4s ease",
            boxShadow:s.on ? `0 0 6px ${s.c}80` : "none",
          }}/>
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: c, background: `${c}12`, border: `1px solid ${c}30`, borderRadius: 6, padding: "2px 10px" }}>
        {label}
      </div>
    </div>
  );
}
