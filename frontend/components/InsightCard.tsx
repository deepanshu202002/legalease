"use client";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface InsightCardProps {
  type: "warning" | "safe" | "neutral";
  text: string;
  delay?: number;
}

const config = {
  warning: { color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", Icon: AlertTriangle, label: "Risk" },
  safe:    { color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.25)", Icon: CheckCircle,  label: "Safe" },
  neutral: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", Icon: Info,         label: "Note" },
};

export default function InsightCard({ type, text, delay = 0 }: InsightCardProps) {
  const { color, bg, border, Icon, label } = config[type] || config.neutral;
  return (
    <div className="float-anim fade-up" style={{
      animationDelay: `${delay}ms, ${delay}ms`,
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 10,
      padding: "10px 14px",
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 6,
        background: `${color}20`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon size={14} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
          {typeof text === "string" ? text : JSON.stringify(text)}
        </div>
      </div>
    </div>
  );
}
