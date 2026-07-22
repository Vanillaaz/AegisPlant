"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import PlantMap from "@/components/PlantMap";
import AlertPanel from "@/components/AlertPanel";
import AuditLog from "@/components/AuditLog";
import Copilot from "@/components/Copilot";
import { SimState, initialSimState } from "@/lib/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/plant-events";

export default function Home() {
  const [activeView, setActiveView] = useState<"dashboard" | "map" | "alert" | "audit" | "copilot">("dashboard");
  const [simState, setSimState] = useState<SimState>(initialSimState);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: string }[]>([]);

  // ── WebSocket connection ──────────────────────────────────
  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => {
      setWsConnected(false);
      setTimeout(connectWs, 3000);
    };
    ws.onerror = () => ws.close();

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        handleWsEvent(data);
      } catch {}
    };
  }, []);

  useEffect(() => {
    connectWs();
    return () => wsRef.current?.close();
  }, [connectWs]);

  // Poll dashboard when WS not connected
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const [summary, sensors, workers, alerts, audit] = await Promise.all([
          fetch(`${API}/api/dashboard/summary`).then(r => r.json()),
          fetch(`${API}/api/plant/sensors`).then(r => r.json()),
          fetch(`${API}/api/plant/workers`).then(r => r.json()),
          fetch(`${API}/api/alerts`).then(r => r.json()),
          fetch(`${API}/api/audit-events`).then(r => r.json()),
        ]);
        setSimState(prev => ({
          ...prev,
          summary,
          sensors: sensors.sensors || [],
          workers: workers.workers || [],
          alerts: alerts.alerts || [],
          auditEvents: audit.events || [],
        }));
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleWsEvent = (data: Record<string, unknown>) => {
    const event = data.event as string;

    if (event === "risk_score_updated") {
      setSimState(prev => ({
        ...prev,
        summary: {
          ...prev.summary,
          plant_risk_score: data.risk_score as number,
          risk_severity: data.severity as string,
        },
        currentRisk: {
          risk_score: data.risk_score as number,
          severity: data.severity as string,
          confidence: data.confidence as number,
          contributing_factors: (data.contributing_factors as string[]) || [],
          recommended_actions: (data.recommended_actions as string[]) || [],
        },
      }));
    }

    if (event === "risk_alert_created") {
      addNotification(`⚠️ CRITICAL ALERT: Compound risk score ${data.risk_score}`, "critical");
      setActiveView("alert");
      setSimState(prev => ({
        ...prev,
        alerts: [data as unknown as SimState["alerts"][0], ...prev.alerts],
      }));
    }

    if (event === "sensor_reading_created") {
      setSimState(prev => ({
        ...prev,
        sensors: prev.sensors.map(s =>
          s.id === (data.sensor_id as string)
            ? { ...s, current_value: data.value as number, history: [...(s.history || []), data.value as number].slice(-20) }
            : s
        ),
      }));
    }

    if (event === "worker_location_updated") {
      setSimState(prev => ({
        ...prev,
        workers: prev.workers.map(w =>
          w.id === (data.worker_id as string)
            ? { ...w, current_zone_id: data.zone_id as string, x: data.x as number, y: data.y as number }
            : w
        ),
      }));
    }

    if (event === "intervention_approved") {
      const result = data.result as Record<string, unknown>;
      addNotification(`✅ Intervention approved. Risk reduced from ${result?.pre_intervention_score} → ${result?.post_intervention_score}`, "success");
      setSimState(prev => ({
        ...prev,
        interventionResult: result,
        summary: {
          ...prev.summary,
          plant_risk_score: result?.post_intervention_score as number || 20,
          risk_severity: "medium",
          intervention_applied: true,
        },
      }));
    }
  };

  const addNotification = (message: string, type: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [{ id, message, type }, ...prev.slice(0, 4)]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 6000);
  };

  const startSimulation = async () => {
    await fetch(`${API}/api/simulation/start`, { method: "POST" });
    addNotification("🔴 Incident simulation started — watch plant map", "warning");
    setSimState(prev => ({ ...prev, summary: { ...prev.summary, simulation_running: true } }));
  };

  const resetSimulation = async () => {
    await fetch(`${API}/api/simulation/reset`, { method: "POST" });
    setSimState(initialSimState);
    addNotification("🔄 Simulation reset to normal operating conditions", "info");
  };

  const approveAlert = async (alertId: string) => {
    const res = await fetch(`${API}/api/alerts/${alertId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved_by: "supervisor", approved_by_name: "Deepak Singh (Shift Supervisor)" }),
    });
    if (res.ok) {
      const result = await res.json();
      setSimState(prev => ({
        ...prev,
        interventionResult: result,
        alerts: prev.alerts.map(a => a.id === alertId ? { ...a, status: "approved" } : a),
      }));
    }
  };

  const rejectAlert = async (alertId: string, reason: string) => {
    await fetch(`${API}/api/alerts/${alertId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejected_by: "supervisor", reason }),
    });
    setSimState(prev => ({
      ...prev,
      alerts: prev.alerts.map(a => a.id === alertId ? { ...a, status: "rejected" } : a),
    }));
  };

  const riskScore = simState.summary?.plant_risk_score || 0;
  const severity = simState.summary?.risk_severity || "low";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        wsConnected={wsConnected}
        riskScore={riskScore}
        severity={severity}
        alertCount={simState.alerts.filter(a => a.status === "active").length}
        pendingApprovals={simState.alerts.filter(a => a.status === "active").length}
        onStartSim={startSimulation}
        onResetSim={resetSimulation}
        simRunning={simState.summary?.simulation_running || false}
        onOpenCopilot={() => setCopilotOpen(true)}
      />

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col bg-slate-950">
        {/* Top risk banner */}
        {severity === "critical" && !simState.interventionResult && (
          <div
            className="flex items-center gap-3 px-6 py-2.5 text-sm font-medium animate-risk-glow"
            style={{ background: "#dc262618", borderBottom: "1px solid #dc262640", color: "#ef4444" }}
          >
            <span className="animate-blink">⚠</span>
            <span>CRITICAL COMPOUND RISK DETECTED — Compressor C-12 Area — Risk Score: {riskScore}/100</span>
            <span className="ml-auto text-xs opacity-70">Click Alert Panel for details and approval workflow</span>
          </div>
        )}
        {simState.interventionResult && (
          <div
            className="flex items-center gap-3 px-6 py-2.5 text-sm font-medium"
            style={{ background: "#10b98118", borderBottom: "1px solid #10b98140", color: "#10b981" }}
          >
            <span>✅</span>
            <span>INTERVENTION APPLIED — Risk reduced from {(simState.interventionResult as Record<string,number>).pre_intervention_score} → {(simState.interventionResult as Record<string,number>).post_intervention_score} — Permit PTW-481 HELD — Zone C-12 RESTRICTED</span>
          </div>
        )}

        {/* Main view */}
        <div className="flex-1 overflow-auto p-4">
          {activeView === "dashboard" && (
            <Dashboard simState={simState} onViewAlert={() => setActiveView("alert")} />
          )}
          {activeView === "map" && (
            <PlantMap simState={simState} />
          )}
          {activeView === "alert" && (
            <AlertPanel
              simState={simState}
              onApprove={approveAlert}
              onReject={rejectAlert}
            />
          )}
          {activeView === "audit" && (
            <AuditLog events={simState.auditEvents} />
          )}
        </div>
      </main>

      {/* Copilot panel */}
      {copilotOpen && (
        <Copilot
          onClose={() => setCopilotOpen(false)}
          currentRisk={simState.currentRisk}
          apiUrl={API}
        />
      )}

      {/* Floating copilot button */}
      {!copilotOpen && (
        <button
          onClick={() => setCopilotOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full text-sm font-semibold transition-all hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            color: "white",
            boxShadow: "0 4px 20px #2563eb50",
          }}
        >
          <span>💬</span> Safety Copilot
        </button>
      )}

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {notifications.map(n => (
          <div
            key={n.id}
            className="animate-slide-in px-4 py-3 rounded-lg text-sm font-medium max-w-sm"
            style={{
              background: n.type === "critical" ? "#dc2626dd" : n.type === "success" ? "#059669dd" : "#1e40afdd",
              backdropFilter: "blur(8px)",
              color: "white",
              border: `1px solid ${n.type === "critical" ? "#ef4444" : n.type === "success" ? "#10b981" : "#3b82f6"}40`,
            }}
          >
            {n.message}
          </div>
        ))}
      </div>
    </div>
  );
}
