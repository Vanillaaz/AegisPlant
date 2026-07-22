"use client";

import { AuditEvent } from "@/lib/types";

interface Props { events: AuditEvent[]; }

const EVENT_COLORS: Record<string, string> = {
  permit_issued: "#f97316",
  work_order_created: "#f59e0b",
  alert_created: "#ef4444",
  intervention_approved: "#10b981",
  sensor_reading: "#3b82f6",
  location_update: "#8b5cf6",
  risk_alert_created: "#dc2626",
  intervention: "#10b981",
};

const EVENT_ICONS: Record<string, string> = {
  permit_issued: "📋",
  work_order_created: "🔧",
  alert_created: "⚠️",
  intervention_approved: "✅",
  sensor_reading: "📡",
  location_update: "👷",
  risk_alert_created: "🚨",
  system: "🤖",
};

export default function AuditLog({ events }: Props) {
  const allEvents = [
    // Static seed entries always shown
    {
      id: "AEV-001",
      timestamp: "2026-07-22T10:00:00Z",
      actor_type: "human",
      actor_id: "W-005",
      actor_name: "Deepak Singh (Shift Supervisor)",
      event_type: "permit_issued",
      payload: {},
      description: "Hot work permit PTW-481 issued for Zone Z-02. Gas test at 09:45: H₂S 1.2 ppm. All controls verified. Fire watch assigned."
    },
    {
      id: "AEV-002",
      timestamp: "2026-07-22T07:30:00Z",
      actor_type: "cmms",
      actor_id: "CMMS",
      actor_name: "Maintenance CMMS",
      event_type: "work_order_created",
      payload: {},
      description: "Work order WO-2847 opened for V-07 blade bearing replacement. Ventilation unit operating at ~40% capacity. ETA repair: 16:00."
    },
    ...events
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Audit Trail
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Immutable chronological record of all system decisions and human actions
          </p>
        </div>
        <div className="flex gap-2">
          <span
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: "#1e2d45", color: "var(--text-muted)" }}
          >
            {allEvents.length} events
          </span>
          <button
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background: "#2563eb20", color: "#60a5fa", border: "1px solid #2563eb30" }}
          >
            ↓ Export JSON
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-5 top-0 bottom-0 w-px"
          style={{ background: "var(--border)" }}
        />

        <div className="space-y-3 pl-12">
          {allEvents.map((event, idx) => {
            const color = EVENT_COLORS[event.event_type] || "#64748b";
            const icon = EVENT_ICONS[event.event_type] || "📌";
            const isSystemAgent = event.actor_type === "system" || event.actor_type === "cmms";
            const isHuman = event.actor_type === "human";
            const isCritical = event.event_type === "risk_alert_created" || event.event_type === "alert_created";

            return (
              <div
                key={event.id}
                className="relative animate-fade-up"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                {/* Timeline dot */}
                <div
                  className="absolute -left-10 top-3 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                  style={{
                    background: `${color}20`,
                    border: `2px solid ${color}60`,
                    zIndex: 1,
                  }}
                >
                  {icon}
                </div>

                <div
                  className="card"
                  style={isCritical ? {
                    border: `1px solid ${color}40`,
                    background: `${color}08`,
                  } : {}}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded uppercase"
                          style={{ background: `${color}20`, color }}
                        >
                          {event.event_type.replace(/_/g, " ")}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
                            background: isHuman ? "#fbbf2415" : "#3b82f615",
                            color: isHuman ? "#fbbf24" : "#60a5fa",
                          }}
                        >
                          {isHuman ? "👤" : "🤖"} {event.actor_name}
                        </span>
                        <span className="text-xs mono" style={{ color: "var(--text-muted)" }}>{event.id}</span>
                      </div>
                      <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        {event.description}
                      </p>
                    </div>
                    <div
                      className="text-xs mono whitespace-nowrap flex-shrink-0"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {new Date(event.timestamp).toLocaleTimeString("en-IN", {
                        hour: "2-digit", minute: "2-digit", second: "2-digit"
                      })}
                    </div>
                  </div>

                  {/* Payload preview */}
                  {event.payload && Object.keys(event.payload).length > 0 && (
                    <div
                      className="mt-2 p-2 rounded text-xs mono overflow-auto"
                      style={{ background: "var(--bg-primary)", color: "var(--text-muted)", maxHeight: 80 }}
                    >
                      {JSON.stringify(event.payload, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
