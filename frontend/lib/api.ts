import { METHODS } from "http";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface CardItem {
  type: "warning" | "safe" | "neutral";
  text: string;
}
export interface AnalysisResponse {
  analysis_id: string;
  risk_score: number;
  risk_label: string;
  cards: CardItem[];
}
export interface HistoryItem {
  id: string;
  contract_preview: string;
  risk_score: number;
  risk_label: string;
  cards: CardItem[];
  summary: string | null;
  created_at: string;
}

export async function analyzeText(text: string): Promise<AnalysisResponse> {
  const res = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || "Analysis failed"); }
  return res.json();
}



export async function analyzeFile(file: File): Promise<AnalysisResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/analyze/file`, { method: "POST", body: form });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.detail || "File analysis failed");
  }
  return res.json();
}

export function streamSummary(
  id: string,
  onChunk: (t: string) => void,
  onDone: () => void,
  onError: (m: string) => void
): EventSource {
  const es = new EventSource(`${API_URL}/analyze/stream?id=${id}`);
  es.addEventListener("chunk", (e) => onChunk((e as MessageEvent).data));
  es.addEventListener("done", () => { es.close(); onDone(); });
  es.addEventListener("error", (e) => { es.close(); onError((e as MessageEvent).data || "Stream error"); });
  return es;
}




export async function getHistory(): Promise<HistoryItem[]> {
  const res = await fetch(`${API_URL}/history`);
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export async function deleteAnalysis(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/history/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete");
}
