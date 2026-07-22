"use client";

import { SimState, Alert, getSeverityColor } from "@/lib/types";
import { useState } from "react";

interface Props {
  simState: SimState;
  onApprove: (alertId: string) => void;
  onReject: (alertId: string, reason: string) => void;
}

export default function AlertPanel({ simState, onApprove, onReject }: Props) {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(
    simState.alerts[0] || null
  );
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [approving, setApproving] = useState(false);

  const alerts = simState.alerts;
  const alert = selectedAlert || alerts[0] || null;

  if (!alert && alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 space-y-4 animate-fade-up">
        <div className="text-5xl">🛡️</div>
        <div className="text-lg font-semibold" style={{ color: "var(--text-secondary)" }}>
          No active alerts
        </div>
        <div className="text-sm" style={{ color: "var(--text-muted)" }}>
          Start the incident simulation to see compound risk detection in action
        </div>
      </div>
    );
  }

  const sColor = alert ? getSeverityColor(alert.severity) : "#10b981";

  const handleApprove = async () => {
    if (!alert) return;
    setApproving(true);
    await onApprove(alert.id);
    setTimeout(() => setApproving(false), 1000);
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          Compound Risk Alert
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          Evidence-based incident review and intervention approval
        </p>
      </div>

      {alert && (
        <div className="grid grid-cols-3 gap-4">
          {/* Alert detail — 2 cols */}
          <div className="col-span-2 space-y-4">
            {/* Header card */}
            <div
              className="card animate-risk-glow"
              style={{
                border: `1px solid ${sColor}50`,
                background: `${sColor}08`,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded uppercase animate-blink"
                      style={{ background: `${sColor}25`, color: sColor, border: `1px solid ${sColor}40` }}
                    >
                      ● {alert.severity}
                    </span>
                    <span className="text-xs mono" style={{ color: "var(--text-muted)" }}>
                      {alert.id} · {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                    Compound Risk — Compressor C-12 Area
                  </h2>
                  <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                    Rising H₂S + Active Hot Work + Degraded Ventilation + Worker Presence
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black mono" style={{ color: sColor }}>
                    {alert.risk_score}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Risk Score /100</div>
                  <div className="text-sm font-semibold mt-1" style={{ color: "#60a5fa" }}>
                    {Math.round(alert.confidence * 100)}% confidence
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div
                className="p-3 rounded-lg text-sm"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border)" }}
              >
                <div className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                  AI EXPLANATION
                </div>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  Critical compound risk detected near Compressor C-12. Rising H₂S concentration ({" "}
                  <span style={{ color: "#ef4444" }}>7.3 ppm, rising 12+ min</span>), active hot-work permit
                  PTW-481 creating an ignition source, degraded ventilation V-07 at{" "}
                  <span style={{ color: "#f59e0b" }}>~40% capacity</span>, and{" "}
                  <span style={{ color: "#f97316" }}>2 workers entering the exposure radius</span>{" "}
                  create a compounded ignition and exposure risk. Similar conditions were present in{" "}
                  <strong>2 previous near-miss events</strong> (NM-2024-047: 94% match).
                </p>
              </div>

              {/* Lead time comparison */}
              {alert.lead_time_minutes && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div
                    className="p-3 rounded-lg text-center"
                    style={{ background: "#ef444410", border: "1px solid #ef444425" }}
                  >
                    <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Threshold-Only</div>
                    <div className="text-xl font-black mono" style={{ color: "#ef4444" }}>
                      {alert.baseline_would_alert ? "NOW" : "—"}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>alert time</div>
                  </div>
                  <div
                    className="p-3 rounded-lg text-center"
                    style={{ background: "#10b98110", border: "1px solid #10b98125" }}
                  >
                    <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Aegis Detection</div>
                    <div className="text-xl font-black mono" style={{ color: "#10b981" }}>
                      {alert.lead_time_minutes} min
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>earlier</div>
                  </div>
                  <div
                    className="p-3 rounded-lg text-center"
                    style={{ background: "#2563eb10", border: "1px solid #2563eb25" }}
                  >
                    <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Exposure Avoided</div>
                    <div className="text-xl font-black mono" style={{ color: "#60a5fa" }}>
                      {alert.exposure_minutes_avoided} min
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>worker·min</div>
                  </div>
                </div>
              )}
            </div>

            {/* Contributing factors */}
            <div className="card">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                Contributing Evidence
              </h3>
              <div className="space-y-2">
                {(alert.contributing_factors || []).map((f, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3 rounded-lg text-sm"
                    style={{ background: "#dc262608", border: "1px solid #dc262620" }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                      style={{ background: "#dc262620", color: "#ef4444" }}
                    >
                      {i + 1}
                    </div>
                    <span style={{ color: "var(--text-secondary)" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Near miss evidence */}
            <div className="card" style={{ border: "1px solid #f59e0b20" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#f59e0b" }}>
                📁 Historical Near-Miss Evidence
              </h3>
              <div className="space-y-3">
                {[
                  {
                    id: "NM-2024-047", date: "14 Sep 2024", match: "94%",
                    title: "H2S accumulation near C-09 during hot work with degraded ventilation",
                    outcome: "Zone evacuated. No injuries. PTW suspended."
                  },
                  {
                    id: "NM-2025-008", date: "19 Feb 2025", match: "88%",
                    title: "Hot work permitted while ventilation was degraded",
                    outcome: "Work stopped. 3h delay. Procedure revised."
                  }
                ].map(nm => (
                  <div
                    key={nm.id}
                    className="p-3 rounded-lg text-xs"
                    style={{ background: "#f59e0b08", border: "1px solid #f59e0b20" }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold mono" style={{ color: "#f59e0b" }}>{nm.id}</span>
                      <span style={{ color: "var(--text-muted)" }}>{nm.date}</span>
                      <span
                        className="ml-auto font-bold px-1.5 py-0.5 rounded"
                        style={{ background: "#f59e0b20", color: "#f59e0b" }}
                      >
                        {nm.match} match
                      </span>
                    </div>
                    <div style={{ color: "var(--text-secondary)" }}>{nm.title}</div>
                    <div className="mt-1 font-medium" style={{ color: "#10b981" }}>→ {nm.outcome}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Approval panel — 1 col */}
          <div className="space-y-3">
            {/* Recommended actions */}
            <div className="card" style={{ border: "1px solid #3b82f620" }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#60a5fa" }}>
                Recommended Actions
              </h3>
              <div className="space-y-2">
                {(alert.recommended_actions || []).map((a, i) => (
                  <div
                    key={i}
                    className="flex gap-2 p-2 rounded text-xs"
                    style={{ background: "#3b82f610", border: "1px solid #3b82f625" }}
                  >
                    <span className="font-bold" style={{ color: "#60a5fa" }}>{i + 1}.</span>
                    <span style={{ color: "var(--text-secondary)" }}>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pre/post risk */}
            {alert.post_intervention_score !== undefined && (
              <div className="card">
                <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                  Projected Outcome
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--text-muted)" }}>Current risk</span>
                      <span className="mono font-bold" style={{ color: "#ef4444" }}>{alert.risk_score}/100</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1e2d45" }}>
                      <div className="h-full rounded-full" style={{ width: `${alert.risk_score}%`, background: "#ef4444" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--text-muted)" }}>After intervention</span>
                      <span className="mono font-bold" style={{ color: "#10b981" }}>{alert.post_intervention_score}/100</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "#1e2d45" }}>
                      <div className="h-full rounded-full" style={{ width: `${alert.post_intervention_score}%`, background: "#10b981" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Approval actions */}
            {alert.status === "active" && (
              <div className="card" style={{ border: "1px solid #1e2d45" }}>
                <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  Supervisor Approval
                </h3>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                  Action logged and added to audit trail. Requires Shift Supervisor.
                </p>
                <div className="space-y-2">
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="w-full py-3 rounded-lg text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-70"
                    style={{
                      background: "linear-gradient(135deg, #059669, #047857)",
                      color: "white",
                    }}
                  >
                    {approving ? "⏳ Applying..." : "✅ Approve & Execute"}
                  </button>
                  {!showRejectInput ? (
                    <button
                      onClick={() => setShowRejectInput(true)}
                      className="w-full py-2 rounded-lg text-sm font-medium transition-all"
                      style={{ background: "#1e2d45", color: "var(--text-secondary)" }}
                    >
                      ✗ Reject with Reason
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        className="w-full p-2 rounded text-xs resize-none"
                        style={{
                          background: "var(--bg-primary)",
                          border: "1px solid var(--border)",
                          color: "var(--text-primary)",
                        }}
                        rows={3}
                        placeholder="Enter rejection reason..."
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                      />
                      <button
                        onClick={() => {
                          onReject(alert.id, rejectReason);
                          setShowRejectInput(false);
                        }}
                        className="w-full py-2 rounded-lg text-xs font-semibold"
                        style={{ background: "#ef444420", color: "#ef4444", border: "1px solid #ef444430" }}
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  )}
                  <button
                    className="w-full py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ background: "#92400e20", color: "#f59e0b", border: "1px solid #f59e0b25" }}
                  >
                    ↑ Escalate to Plant Head
                  </button>
                </div>
              </div>
            )}

            {alert.status === "approved" && simState.interventionResult && (
              <div
                className="card animate-fade-up"
                style={{ border: "1px solid #10b98140", background: "#10b98110" }}
              >
                <h3 className="text-sm font-bold mb-2" style={{ color: "#10b981" }}>✅ Intervention Applied</h3>
                <div className="space-y-1 text-xs">
                  {["Permit PTW-481 status set to HELD",
                    "Zone C-12 access restriction logged",
                    "Gas response team dispatch sent",
                    "V-07 work order escalated to emergency"
                  ].map((a, i) => (
                    <div key={i} className="flex gap-1.5" style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "#10b981" }}>✓</span>{a}
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-2 rounded text-xs mono" style={{ background: "var(--bg-primary)", color: "#10b981" }}>
                  Risk: {(simState.interventionResult as Record<string, number>).pre_intervention_score} → {(simState.interventionResult as Record<string, number>).post_intervention_score} · {(simState.interventionResult as Record<string, number>).exposure_minutes_avoided} worker·min avoided
                </div>
              </div>
            )}

            {/* Policy references */}
            <div className="card">
              <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Policy References
              </h3>
              <div className="space-y-1.5 text-xs">
                {[
                  ["SOP-HSE-HW-001 §3.1", "Hot work suspended if ventilation below 80%"],
                  ["SOP-HSE-HW-001 §4.2", "Evacuate if H₂S > 7 ppm"],
                  ["ENG-STD-VENT-003 §3.3", "V-07 downgrade requires SO notification"],
                  ["OISD-STD-105 §4.4", "Compound risk assessed holistically"],
                ].map(([ref, desc]) => (
                  <div key={ref}>
                    <span className="font-bold mono" style={{ color: "#60a5fa" }}>{ref}</span>
                    <span style={{ color: "var(--text-muted)" }}> — {desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
