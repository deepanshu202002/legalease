"use client";
import { useEffect, useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { getHistory, deleteAnalysis, HistoryItem } from "@/lib/api";
import InsightCard from "@/components/InsightCard";
import { Search, Trash2, ChevronDown, ChevronUp, Clock, FileX } from "lucide-react";

function riskColor(score: number) {
  if (score <= 33) return "#10b981";
  if (score <= 66) return "#f59e0b";
  return "#ef4444";
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    getHistory()
      .then(setItems)
      .catch(() => toast.error("Failed to load history"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.contract_preview.toLowerCase().includes(q) ||
        i.risk_label.toLowerCase().includes(q) ||
        (i.summary || "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteAnalysis(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Analysis deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
      setConfirmId(null);
    }
  };

  const toggleExpand = (id: string) =>
    setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 60px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Clock size={20} color="#f87171" />
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#f5f5f5", letterSpacing: "-0.02em" }}>
            Analysis History
          </h1>
        </div>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14 }}>
          All past contract analyses, newest first.
        </p>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 24 }}>
        <Search size={16} color="rgba(255,255,255,0.35)" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by content, risk level or summary…"
          style={{
            width: "100%", padding: "12px 16px 12px 42px",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12, color: "#f5f5f5", fontSize: 14, fontFamily: "inherit", outline: "none",
            transition: "border 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = "rgba(220,38,38,0.4)")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
        />
      </div>

      {/* States */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.35)" }}>
          <div className="spinner" style={{ width: 28, height: 28, margin: "0 auto 12px" }} />
          Loading history…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 80, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileX size={28} color="rgba(255,255,255,0.25)" />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
            {search ? "No matching analyses" : "No analyses yet"}
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.25)" }}>
            {search ? "Try a different search term" : "Analyze a contract on the home page to get started."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((item) => {
            const isOpen = expanded[item.id];
            const c = riskColor(item.risk_score);
            const isConfirming = confirmId === item.id;
            return (
              <div key={item.id} className="fade-up" style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 14, overflow: "hidden", transition: "border 0.2s",
              }}>
                {/* Row header */}
                <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                  {/* Score badge */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: `${c}15`, border: `1px solid ${c}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 17, fontWeight: 800, color: c,
                  }}>{item.risk_score}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: c, background: `${c}15`, border: `1px solid ${c}30`, borderRadius: 6, padding: "2px 8px" }}>
                        {item.risk_label}
                      </span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.contract_preview.slice(0, 120)}{item.contract_preview.length > 120 ? "…" : ""}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {isConfirming ? (
                      <>
                        <button onClick={() => handleDelete(item.id)} disabled={!!deleting} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.5)", background: "rgba(239,68,68,0.15)", color: "#f87171", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                          {deleting === item.id ? "…" : "Confirm"}
                        </button>
                        <button onClick={() => setConfirmId(null)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer" }}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmId(item.id)} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", cursor: "pointer", color: "rgba(255,255,255,0.35)", transition: "all 0.2s" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.4)"; (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)"; }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                    <button onClick={() => toggleExpand(item.id)} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", cursor: "pointer", color: "rgba(255,255,255,0.5)" }}>
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded content */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {item.cards.map((c, i) => <InsightCard key={i} type={c.type} text={c.text} delay={i * 60} />)}
                    {item.summary && (
                      <div style={{ marginTop: 4, padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>AI Summary</div>
                        <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.7)" }}>{item.summary}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
