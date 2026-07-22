"use client";

import { RiskState } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, AlertTriangle, FileText, Send, Loader2 } from "lucide-react";

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
    <div className="fixed right-0 top-0 h-screen w-[420px] flex flex-col animate-slide-in bg-slate-950/95 backdrop-blur-2xl border-l border-slate-800 shadow-2xl z-50">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
            <MessageSquare className="text-white" size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100">
              Safety Copilot
            </div>
            <div className="text-xs font-medium text-indigo-400">
              Cited from safety documents
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      {/* Risk context */}
      {currentRisk.risk_score > 30 && (
        <div className="px-5 py-2.5 text-xs bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
          <span className="text-slate-300">Active context: </span>
          <span className="text-red-400 font-bold uppercase tracking-wider">
            Risk Score {currentRisk.risk_score} · {currentRisk.severity}
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-slate-900/80 text-slate-300 border border-slate-700/50 rounded-tl-sm"
              }`}
            >
              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                  <div className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                    <FileText size={12} />
                    Sources cited:
                  </div>
                  <div className="space-y-1.5">
                    {msg.citations.map(c => (
                      <div
                        key={c.id}
                        className="text-[11px] py-1.5 px-2.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 leading-snug"
                      >
                        <span className="font-semibold text-indigo-200">{c.title}</span>
                        <span className="text-indigo-400/70 ml-1">[{c.reference}]</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="px-5 py-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/50 rounded-tl-sm text-indigo-400 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm font-medium">Analyzing documents...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/30">
        <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2.5">
          Suggested questions
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs font-medium px-3 py-1.5 rounded-full transition-all bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            placeholder="Ask about this incident or procedure..."
            className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none bg-slate-900 border border-slate-700 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="w-11 h-11 flex items-center justify-center rounded-xl font-medium transition-all bg-gradient-to-br from-indigo-600 to-blue-600 text-white hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:shadow-none"
          >
            <Send size={16} className={input.trim() ? "ml-0.5" : ""} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 mt-3 justify-center">
          <AlertTriangle size={12} className="text-amber-500/70" />
          Decision support only. Always verify with qualified safety personnel.
        </div>
      </div>
    </div>
  );
}
