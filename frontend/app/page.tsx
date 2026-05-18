"use client";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { analyzeText, analyzeFile, AnalysisResponse, CardItem } from "@/lib/api";
import RiskGauge from "@/components/RiskGauge";
import InsightCard from "@/components/InsightCard";
import SummaryPanel from "@/components/SummaryPanel";
import Chatbot from "@/components/Chatbot";
import UploadZone from "@/components/UploadZone";
import { Sparkles, FileText, Type } from "lucide-react";

export default function HomePage() {
  const [contractText, setContractText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"text" | "file">("text");

  const isEmpty = activeTab === "text" ? !contractText.trim() : !pendingFile;

  const handleAnalyze = useCallback(async () => {
    if (isEmpty || loading) return;
    setLoading(true);
    setResult(null);
    try {
      let res: AnalysisResponse;
      if (activeTab === "file" && pendingFile) {
        res = await analyzeFile(pendingFile);
      } else {
        res = await analyzeText(contractText);
      }
      setResult(res);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [isEmpty, loading, activeTab, pendingFile, contractText]);

  return (
    <div style={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column", padding: result ? 0 : "40px 24px 60px", overflow: "hidden" }}>
      {!result ? (
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          {/* Hero */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.25)",
              borderRadius: 999, padding: "6px 16px", marginBottom: 20,
            }}>
              <Sparkles size={14} color="#f87171" />
              <span style={{ fontSize: 13, color: "#f87171", fontWeight: 600 }}>Powered by Gemini 2.5 Flash</span>
            </div>
            <h1 style={{
              fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800,
              color: "#f5f5f5", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 16,
            }}>
              Analyze any contract<br />
              <span style={{ background: "linear-gradient(135deg,#dc2626,#f87171)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                in seconds
              </span>
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", maxWidth: 520, margin: "0 auto" }}>
              Paste your contract or upload a PDF/DOCX. Get an instant risk score, plain-English insights, and AI-powered recommendations.
            </p>
          </div>

          {/* Main grid */}
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            {/* LEFT — Input panel */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "rgba(255,255,255,0.9)", marginBottom: 4 }}>Contract Input</div>

              {/* Tab switcher */}
              <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
                {([["text", "Paste Text", <Type size={14} key="t" />], ["file", "Upload File", <FileText size={14} key="f" />]] as const).map(([tab, label, icon]) => (
                  <button key={tab} onClick={() => setActiveTab(tab as "text" | "file")} style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
                    background: activeTab === tab ? "rgba(220,38,38,0.2)" : "transparent",
                    color: activeTab === tab ? "#f87171" : "rgba(255,255,255,0.5)",
                    transition: "all 0.2s",
                  }}>{icon}{label}</button>
                ))}
              </div>

              {activeTab === "text" ? (
                <textarea
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  placeholder="Paste your contract text here…"
                  style={{
                    minHeight: 220, resize: "vertical", background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px",
                    color: "#f5f5f5", fontSize: 14, lineHeight: 1.65, fontFamily: "inherit",
                    outline: "none", transition: "border 0.2s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(220,38,38,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                />
              ) : (
                <UploadZone onFile={setPendingFile} disabled={loading} />
              )}

              {/* Analyze button */}
              <button
                onClick={handleAnalyze}
                disabled={isEmpty || loading}
                style={{
                  position: "relative", overflow: "hidden",
                  padding: "14px 24px", borderRadius: 12, border: "none", cursor: isEmpty || loading ? "not-allowed" : "pointer",
                  background: isEmpty || loading ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#dc2626,#991b1b)",
                  color: isEmpty || loading ? "rgba(255,255,255,0.35)" : "#fff",
                  fontWeight: 700, fontSize: 15, fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.2s",
                  boxShadow: isEmpty || loading ? "none" : "0 4px 20px rgba(220,38,38,0.35)",
                }}
              >
                {/* Shimmer */}
                {!isEmpty && !loading && (
                  <span style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.18) 50%,transparent 100%)",
                    animation: "shimmer 2.5s infinite",
                  }} />
                )}
                {loading ? (
                  <><span className="spinner" /> Analyzing…</>
                ) : (
                  <><Sparkles size={16} /> Analyze contract with AI</>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* SINGLE SCREEN DASHBOARD VIEW */
        <div style={{ display: "grid", gridTemplateColumns: "350px 1fr 400px", height: "100%", gap: 0, overflow: "hidden" }}>

          {/* LEFT: Summary Panel */}
          <div style={{ borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: "rgba(255,255,255,0.9)" }}>AI Summary</span>
              <button
                onClick={() => setResult(null)}
                style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
              >
                New Analysis
              </button>
            </div>
            <div className="custom-scrollbar" style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              <SummaryPanel analysisId={result.analysis_id} />
            </div>
          </div>

          {/* CENTER: Risk & Insights */}
          <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "20px 40px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.03)", flexShrink: 0 }}>
              <RiskGauge score={result.risk_score} label={result.risk_label} />
            </div>
            <div
              className="custom-scrollbar-hide"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 40px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              {/* LEGAL DISCLAIMER GUARDRAIL */}
              <div style={{
                background: "rgba(245,158,11,0.06)",
                border: "1px solid rgba(245,158,11,0.2)",
                borderRadius: 12,
                padding: "16px 20px",
                marginBottom: 16,
                display: "flex",
                gap: 12,
                alignItems: "flex-start"
              }}>
                <div style={{ color: "#f59e0b", flexShrink: 0, marginTop: 2 }}>
                  <Sparkles size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b", marginBottom: 3 }}>
                    Legal Disclaimer
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                    This is an AI-generated insight for informational purposes only. It is NOT professional legal advice.
                    Do not rely solely on this analysis. Always consult a qualified lawyer before taking any action.
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>Key Findings</div>
              {result.cards.map((c: CardItem, i: number) => (
                <InsightCard key={i} type={c.type} text={c.text} delay={i * 80} />
              ))}
              <div style={{ height: 40 }} /> {/* spacer */}
            </div>
          </div>

          {/* RIGHT: Chatbot */}
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.07)", height: "100%", overflow: "hidden" }}>
            <Chatbot analysisId={result.analysis_id} />
          </div>
        </div>
      )}
    </div>
  );
}
