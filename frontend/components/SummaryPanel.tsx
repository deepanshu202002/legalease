"use client";
import { useEffect, useRef, useState } from "react";
import { streamSummary } from "@/lib/api";

interface SummaryPanelProps {
  analysisId: string;
  onComplete?: () => void;
}

export default function SummaryPanel({ analysisId, onComplete }: SummaryPanelProps) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    setText("");
    setDone(false);
    setError("");

    esRef.current = streamSummary(
      analysisId,
      (chunk) => setText((p) => p + chunk),
      () => { setDone(true); onComplete?.(); },
      (msg) => setError(msg),
    );
    return () => { esRef.current?.close(); };
  }, [analysisId]);

  if (error) return (
    <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:12, padding:16, color:"#f87171", fontSize:14 }}>
      Failed to generate summary: {error}
    </div>
  );

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16, padding: "26px 30px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div className="pulse-dot" style={{ background: done ? "var(--amber-400)" : "var(--green-400)" }} />
        <span style={{ fontWeight: 800, fontSize: 13, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Legal Analysis Summary
        </span>
      </div>
      <p style={{
        fontSize: "15.5px", lineHeight: "1.8", color: "rgba(255,255,255,0.85)",
        fontWeight: 450,
      }}
        className={!done && text ? "blink-cursor" : ""}
      >
        {text ? text : (
          <span style={{ color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>Extracting contract intelligence…</span>
        )}
      </p>
    </div>
  );
}
