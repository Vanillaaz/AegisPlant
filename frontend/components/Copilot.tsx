"use client";

import { RiskState } from "@/lib/types";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: { id: string; title: string; reference: string }[];
}

interface Props {
  onClose: () => void;
  currentRisk: RiskState;
  apiUrl: string;
}

const SUGGESTED_QUESTIONS = [
  "Why is this alert critical?",
  "What procedure applies to hot work near gas risk?",
  "Show me similar historical near misses",
  "What must the supervisor verify before releasing the permit?",
  "What is the H₂S evacuation threshold?",
];

export default function Copilot({ onClose, currentRisk, apiUrl }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "I'm the Aegis Safety Copilot. I can answer questions about the current alert, applicable safety procedures, and historical near-miss events. All answers are cited from safety documents.\n\nHow can I help you?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return;

    const userMsg: Message = { role: "user", content: question };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/copilot/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          alert_context: {
            risk_score: currentRisk.risk_score,
            severity: currentRisk.severity,
            contributing_factors: currentRisk.contributing_factors,
          },
        }),
      });

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          citations: data.citations || [],
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Unable to reach safety knowledge base. Please check system connectivity.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed right-0 top-0 h-screen flex flex-col animate-slide-in"
      style={{
        width: 420,
        background: "var(--bg-secondary)",
        borderLeft: "1px solid var(--border)",
        zIndex: 100,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
          >
            💬
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Safety Copilot
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              Cited from safety documents
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded flex items-center justify-center text-sm transition-all hover:scale-110"
          style={{ background: "#1e2d45", color: "var(--text-muted)" }}
        >
          ✕
        </button>
      </div>

      {/* Risk context */}
      {currentRisk.risk_score > 30 && (
        <div
          className="px-4 py-2 text-xs"
          style={{ background: "#dc262610", borderBottom: "1px solid #dc262620" }}
        >
          <span style={{ color: "var(--text-muted)" }}>Active context: </span>
          <span style={{ color: "#ef4444", fontWeight: 600 }}>
            Risk Score {currentRisk.risk_score} · {currentRisk.severity.toUpperCase()}
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[85%] rounded-xl px-4 py-3 text-sm"
              style={
                msg.role === "user"
                  ? { background: "#2563eb", color: "white", borderRadius: "18px 18px 4px 18px" }
                  : {
                      background: "var(--bg-card)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border)",
                      borderRadius: "4px 18px 18px 18px",
                    }
              }
            >
              <p style={{ lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{msg.content}</p>

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2" style={{ borderTop: "1px solid #1e2d45" }}>
                  <div className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                    Sources:
                  </div>
                  {msg.citations.map(c => (
                    <div
                      key={c.id}
                      className="text-xs py-1 px-2 rounded mb-1"
                      style={{ background: "#2563eb15", color: "#60a5fa", border: "1px solid #2563eb20" }}
                    >
                      📄 {c.title} <span style={{ color: "var(--text-muted)" }}>[{c.reference}]</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div
              className="px-4 py-3 rounded-xl text-sm"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
            >
              <span className="animate-blink">●</span>{" "}
              <span className="animate-blink" style={{ animationDelay: "0.2s" }}>●</span>{" "}
              <span className="animate-blink" style={{ animationDelay: "0.4s" }}>●</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      <div
        className="px-4 py-2"
        style={{ borderTop: "1px solid var(--border)", background: "var(--bg-primary)" }}
      >
        <div className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
          Suggested questions:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs px-2.5 py-1.5 rounded-full transition-all hover:scale-105"
              style={{
                background: "#1e2d45",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div
        className="p-3"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="Ask about this incident, procedure, or near-miss..."
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "white",
            }}
          >
            ↑
          </button>
        </div>
        <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
          ⚠ Decision support only. Always verify with qualified safety personnel.
        </p>
      </div>
    </div>
  );
}
