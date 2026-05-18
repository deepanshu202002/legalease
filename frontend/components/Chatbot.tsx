"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chatbot({ analysisId }: { analysisId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your legal AI assistant. Note: This analysis is AI-generated for informational purposes and is NOT professional legal advice. Please consult a qualified lawyer before taking any action. How can I help you with this contract?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/chat/${String(analysisId)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_id: analysisId,
          question: userMessage.content,
          chat_history: messages.slice(1) // exclude initial greeting
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error processing your request." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[rgba(255,255,255,0.01)] backdrop-blur-md overflow-hidden">
      <div className="p-6 border-b border-[var(--border)] bg-[rgba(255,255,255,0.02)] shrink-0">
        <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2 text-lg">
          <Bot className="w-6 h-6 text-[var(--amber-400)]" />
          Contract Assistant
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Ask anything about the clauses, risks, or definitions.</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar min-h-0">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === "user" ? "bg-[var(--surface)] border border-[var(--border)]" : "bg-gradient-to-br from-[var(--amber-500)]/20 to-transparent border border-[var(--amber-500)]/30"}`}>
              {msg.role === "user" ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-[var(--amber-400)]" />}
            </div>
            <div className={`max-w-[85%] rounded-3xl px-7 py-5 shadow-sm leading-relaxed ${
              msg.role === "user" 
                ? "bg-[rgba(255,255,255,0.08)] border border-[var(--border)] text-[var(--text-primary)] rounded-tr-sm" 
                : "bg-[rgba(255,255,255,0.03)] border border-[var(--border)] text-[var(--text-secondary)] rounded-tl-sm"
            }`}>
              <p className="whitespace-pre-wrap text-[15.5px]">
                {typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-[var(--amber-500)]/20 to-transparent border border-[var(--amber-500)]/30 shadow-lg">
              <Bot className="w-5 h-5 text-[var(--amber-400)]" />
            </div>
            <div className="px-7 py-5 flex items-center bg-[rgba(255,255,255,0.03)] border border-[var(--border)] rounded-3xl">
              <Loader2 className="w-5 h-5 text-[var(--text-muted)] animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-8 border-t border-[var(--border)] bg-[rgba(255,255,255,0.03)] shadow-[0_-10px_40px_rgba(0,0,0,0.3)] shrink-0">
        <form onSubmit={handleSend} className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type your question here..."
            style={{ minHeight: "140px" }}
            className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[24px] p-8 pr-20 text-[16px] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--amber-500)]/50 focus:ring-1 focus:ring-[var(--amber-500)]/20 transition-all shadow-inner resize-none leading-relaxed"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-6 bottom-6 p-4 rounded-2xl bg-gradient-to-br from-[var(--amber-500)] to-[var(--amber-600)] text-white disabled:opacity-30 disabled:grayscale transition-all shadow-xl hover:scale-105 active:scale-95 z-10"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
}
