"use client";

import { getSeverityColor } from "@/lib/types";
import { LayoutDashboard, Map, ShieldAlert, FileText, Play, RotateCcw, Activity } from "lucide-react";

interface Props {
  activeView: string;
  setActiveView: (v: "dashboard" | "map" | "alert" | "audit" | "copilot") => void;
  wsConnected: boolean;
  riskScore: number;
  severity: string;
  alertCount: number;
  pendingApprovals: number;
  onStartSim: () => void;
  onResetSim: () => void;
  simRunning: boolean;
  onOpenCopilot: () => void;
}

const nav = [
  { id: "dashboard", icon: LayoutDashboard, label: "Command Centre" },
  { id: "map", icon: Map, label: "Plant Map" },
  { id: "alert", icon: ShieldAlert, label: "Risk Alerts" },
  { id: "audit", icon: FileText, label: "Audit Trail" },
];

export default function Sidebar({
  activeView, setActiveView, wsConnected, riskScore, severity,
  alertCount, pendingApprovals, onStartSim, onResetSim, simRunning, onOpenCopilot
}: Props) {
  
  const isCritical = severity === "critical";
  const sColor = isCritical ? "#ef4444" : severity === "elevated" ? "#f59e0b" : "#10b981";

  return (
    <aside className="flex flex-col h-screen w-64 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800 z-50 flex-shrink-0">
      
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Activity className="text-white" size={20} />
          </div>
          <div>
            <div className="text-sm font-bold tracking-widest text-slate-100">
              AEGIS PLANT
            </div>
            <div className="text-[11px] font-medium text-indigo-400 uppercase tracking-wider">
              Safety Intelligence
            </div>
          </div>
        </div>
      </div>

      {/* Risk Score Area */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/20">
        <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
          Plant Risk Score
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <div 
            className="text-5xl font-black font-mono tracking-tighter" 
            style={{ color: sColor, textShadow: isCritical ? `0 0 20px ${sColor}80` : "none" }}
          >
            {riskScore}
          </div>
        </div>
        
        <div className="mt-2 flex items-center">
          <div 
            className="text-[10px] font-bold uppercase px-2 py-1 rounded flex items-center gap-1.5"
            style={{ background: `${sColor}20`, color: sColor, border: `1px solid ${sColor}40` }}
          >
            {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
            {severity}
          </div>
        </div>

        {/* Risk progress bar */}
        <div className="mt-4 h-1.5 rounded-full bg-slate-800 overflow-hidden relative">
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${riskScore}%`,
              background: `linear-gradient(90deg, #10b981, ${sColor})`,
              boxShadow: isCritical ? `0 0 10px ${sColor}` : 'none'
            }}
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
        {nav.map(item => {
          const isActive = activeView === item.id;
          const badge = item.id === "alert" && alertCount > 0 ? alertCount : null;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as any)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent"
              }`}
            >
              <Icon size={18} className={isActive ? "text-indigo-500" : "text-slate-500"} />
              <span className="flex-1 text-left">{item.label}</span>
              {badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white shadow-sm shadow-red-500/50">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Demo Controls Area - Anchored to bottom */}
      <div className="mt-auto">
        <div className="p-4 border-t border-slate-800 bg-slate-900/20 space-y-3">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Demo Controls
          </div>
          <button
            onClick={onStartSim}
            disabled={simRunning}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              simRunning 
                ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                : "bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-900/30 border border-red-500/50"
            }`}
          >
            {simRunning ? <Activity size={14} className="animate-pulse" /> : <Play size={14} />}
            {simRunning ? "Simulation Running" : "Start Incident Sim"}
          </button>
          <button
            onClick={onResetSim}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700 transition-all"
          >
            <RotateCcw size={14} />
            Reset State
          </button>
        </div>

        {/* WS Status */}
        <div className="px-5 py-3 flex items-center gap-2 text-[11px] font-medium bg-slate-950 border-t border-slate-900">
          <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? "bg-emerald-500" : "bg-red-500"}`} />
          <span className={wsConnected ? "text-slate-400" : "text-red-400"}>
            {wsConnected ? "System Live" : "Disconnected"}
          </span>
          <span className="ml-auto text-slate-600 font-mono">v1.1</span>
        </div>
      </div>
    </aside>
  );
}
