"use client";

import React, { useState } from "react";
import AppLayout from "@/components/AppLayout";
import Supplier360Drawer from "@/components/Supplier360Drawer";
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileText,
  ExternalLink,
  Building2,
  Award,
  Layers,
  ArrowRight,
  Database,
  Cpu,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { EvidenceCard } from "@/lib/ai-assistant";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  evidence?: EvidenceCard[];
  toolsExecuted?: string[];
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Hello! I am your SourceTrace AI Regulatory & ESG Copilot. I have live query access to enterprise supplier integrity tables, Scope-3 calculations, and cryptographic audit ledgers.\n\nAsk me about supplier status shifts, high-risk entities, expired accreditations, or top carbon emitters.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const quickPrompts = [
    "Why did this supplier's status change?",
    "Which suppliers are high-risk?",
    "Show expired certificates by tier",
    "Who are our top Scope-3 carbon emitters?",
    "What changed in the audit ledger today?",
    "Which suppliers currently need attention?",
  ];

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim()) return;

    const userMsg: ChatMessage = {
      role: "user",
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        role: "assistant",
        text: data.answer || "Unable to retrieve response from database.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        evidence: data.evidence || [],
        toolsExecuted: data.toolsExecuted || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `An error occurred querying the database: ${err?.message || "Service unavailable."}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold uppercase tracking-wider interactive-badge font-mono">
              AI Copilot
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-slate-400 text-xs font-mono">Ledger Grounded</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">AI Assistant</h1>
          <p className="text-xs text-slate-400">
            Grounded queries over verified vendor records, certificates, and Scope-3 calculations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 flex items-center space-x-1.5 card-hover">
            <Database className="h-3.5 w-3.5" />
            <span>Database Tool Calling</span>
          </div>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-mono text-[11px] shrink-0">Quick Queries:</span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendPrompt(p)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition whitespace-nowrap font-medium text-xs flex items-center space-x-1 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="h-3 w-3 text-cyan-400" />
            <span>{p}</span>
          </button>
        ))}
      </div>

      {/* Main Chat Interface */}
      <div className="glass-panel rounded-2xl flex flex-col h-[600px] overflow-hidden border border-slate-800">
        {/* Messages Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start space-x-3 ${m.role === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
            >
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                  m.role === "assistant"
                    ? "bg-emerald-600 text-slate-950"
                    : "bg-slate-800 text-slate-200"
                }`}
              >
                {m.role === "assistant" ? <Bot className="h-4 w-4" /> : "U"}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs max-w-2xl leading-relaxed space-y-3 ${
                  m.role === "assistant"
                    ? "bg-slate-900/90 border border-slate-800 text-slate-200"
                    : "bg-emerald-600 text-slate-950 font-semibold"
                }`}
              >
                {/* Tools executed tag */}
                {m.toolsExecuted && m.toolsExecuted.length > 0 && (
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 pb-2 border-b border-slate-800 text-[10px] font-mono text-cyan-400">
                    <Cpu className="h-3 w-3 shrink-0" />
                    <span>Tools Executed:</span>
                    {m.toolsExecuted.map((t) => (
                      <span key={t} className="px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800 text-slate-300">
                        {t}()
                      </span>
                    ))}
                  </div>
                )}

                {/* Message Text with simple line-break rendering */}
                <div className="whitespace-pre-line leading-relaxed font-sans">{m.text}</div>

                {/* Evidence Cards Grid */}
                {m.evidence && m.evidence.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                      Verifiable Database Evidence Records ({m.evidence.length}):
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {m.evidence.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={() => {
                            if (ev.type === "SUPPLIER") {
                              setSelectedSupplierId(ev.id);
                            } else if (ev.link) {
                              window.location.href = ev.link;
                            }
                          }}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 transition hover:border-slate-700 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                              {ev.type}
                            </span>
                            {ev.badge && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                  ev.badgeColor || "bg-slate-800 text-slate-300"
                                }`}
                              >
                                {ev.badge}
                              </span>
                            )}
                          </div>

                          <h5 className="font-bold text-white text-xs truncate">{ev.title}</h5>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{ev.subtitle}</p>

                          <span className="text-[10px] text-cyan-400 font-mono flex items-center space-x-1 pt-1">
                            <span>{ev.type === "SUPPLIER" ? "Open Supplier 360" : `View in ${ev.link?.replace("/", "")}`}</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <span
                  className={`text-[9px] block mt-1 ${
                    m.role === "assistant" ? "text-slate-500 font-mono" : "text-slate-900"
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center space-x-2 text-xs text-slate-400 pl-11">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Executing database query tools & synthesizing evidence...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendPrompt(input)}
            placeholder="Ask why a supplier changed status, who are top emitters, or check expired certs..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
          <button
            onClick={() => handleSendPrompt(input)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>

      {/* Supplier 360 Drawer */}
      <Supplier360Drawer
        supplierId={selectedSupplierId}
        onClose={() => setSelectedSupplierId(null)}
      />
    </AppLayout>
  );
}
