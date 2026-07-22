"use client";

import { SimState, getSeverityColor } from "@/lib/types";
import { useState } from "react";

interface Props { simState: SimState; }

// Static plant layout — pixel positions on 800×480 canvas
const ZONES = [
  { id: "Z-01", name: "Compressor C-12", x: 340, y: 180, w: 160, h: 120, hazard: "Flammable Gas / Toxic", color: "#ef4444" },
  { id: "Z-02", name: "Hot Work Zone", x: 260, y: 160, w: 100, h: 80, hazard: "Ignition Source", color: "#f97316" },
  { id: "Z-03", name: "Control Room", x: 80, y: 80, w: 140, h: 100, hazard: "Low", color: "#3b82f6" },
  { id: "Z-04", name: "Confined Space", x: 520, y: 220, w: 110, h: 90, hazard: "Oxygen / Toxic", color: "#a855f7" },
  { id: "Z-05", name: "Maintenance Shop", x: 80, y: 280, w: 150, h: 100, hazard: "Low", color: "#64748b" },
  { id: "Z-06", name: "Assembly Point A", x: 640, y: 360, w: 120, h: 70, hazard: "Safe", color: "#10b981" },
  { id: "Z-07", name: "Chemical Storage", x: 340, y: 340, w: 130, h: 80, hazard: "Flammable / Corrosive", color: "#eab308" },
];

const EQUIPMENT_MARKERS = [
  { id: "EQ-C12", label: "C-12", x: 420, y: 230, icon: "⚙", zone: "Z-01" },
  { id: "EQ-V07", label: "V-07", x: 360, y: 270, icon: "🌬", zone: "Z-01" },
  { id: "EQ-GD01", label: "GD-01", x: 440, y: 195, icon: "📡", zone: "Z-01" },
  { id: "EQ-GD02", label: "GD-02", x: 300, y: 185, icon: "📡", zone: "Z-02" },
  { id: "EQ-P05", label: "P-05", x: 390, y: 375, icon: "⚡", zone: "Z-07" },
];

const PERMIT_MARKERS = [
  { id: "PTW-481", label: "PTW-481\nHot Work", x: 280, y: 170, color: "#f97316" },
];

export default function PlantMap({ simState }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const { workers, summary } = simState;
  const riskZones = summary.risk_severity === "critical" ? ["Z-01", "Z-02"] : [];

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Interactive Plant Map
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Hazira Unit 3 — Process Area · Click any zone for details
          </p>
        </div>
        {/* Legend */}
        <div className="flex gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
          {[
            { color: "#ef4444", label: "Critical Risk" },
            { color: "#f97316", label: "High Risk" },
            { color: "#eab308", label: "Elevated" },
            { color: "#10b981", label: "Safe" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* SVG map — 2 cols */}
        <div
          className="col-span-2 card relative overflow-hidden"
          style={{ padding: 0, height: 520 }}
        >
          <svg
            viewBox="0 0 800 480"
            width="100%"
            height="100%"
            style={{ background: "#080c18", display: "block" }}
          >
            {/* Grid */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e2d4520" strokeWidth="0.5" />
              </pattern>
              <radialGradient id="riskGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="800" height="480" fill="url(#grid)" />

            {/* Plant boundary */}
            <rect x="60" y="60" width="720" height="380" rx="4" fill="none" stroke="#1e2d45" strokeWidth="1" />
            <text x="70" y="78" fill="#64748b" fontSize="11" fontFamily="monospace">HAZIRA UNIT 3 — PROCESS AREA</text>

            {/* Risk heatmap overlay for critical zones */}
            {riskZones.includes("Z-01") && (
              <ellipse cx="420" cy="240" rx="120" ry="80" fill="url(#riskGlow)">
                <animate attributeName="rx" values="100;140;100" dur="2s" repeatCount="indefinite" />
                <animate attributeName="ry" values="70;100;70" dur="2s" repeatCount="indefinite" />
              </ellipse>
            )}

            {/* Zones */}
            {ZONES.map(zone => {
              const isRisk = riskZones.includes(zone.id);
              const isSelected = selectedZone === zone.id;
              const riskAlpha = isRisk ? "40" : "15";
              const borderAlpha = isRisk ? "80" : isSelected ? "60" : "30";

              return (
                <g key={zone.id} style={{ cursor: "pointer" }} onClick={() => setSelectedZone(zone.id === selectedZone ? null : zone.id)}>
                  <rect
                    x={zone.x} y={zone.y} width={zone.w} height={zone.h}
                    rx="4"
                    fill={`${zone.color}${riskAlpha}`}
                    stroke={`${zone.color}${borderAlpha}`}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  {isRisk && (
                    <rect
                      x={zone.x} y={zone.y} width={zone.w} height={zone.h}
                      rx="4" fill="none"
                      stroke={zone.color}
                      strokeWidth="1.5"
                      opacity="0.6"
                    >
                      <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.5s" repeatCount="indefinite" />
                    </rect>
                  )}
                  <text
                    x={zone.x + zone.w / 2} y={zone.y + 16}
                    textAnchor="middle" fill={zone.color}
                    fontSize="10" fontFamily="monospace" fontWeight="600"
                  >
                    {zone.id}
                  </text>
                  <text
                    x={zone.x + zone.w / 2} y={zone.y + 28}
                    textAnchor="middle" fill="#94a3b8"
                    fontSize="9" fontFamily="monospace"
                  >
                    {zone.name}
                  </text>
                </g>
              );
            })}

            {/* Equipment markers */}
            {EQUIPMENT_MARKERS.map(eq => {
              const degraded = eq.id === "EQ-V07";
              return (
                <g key={eq.id}>
                  <circle
                    cx={eq.x} cy={eq.y} r="10"
                    fill={degraded ? "#f59e0b20" : "#1e3a5f"}
                    stroke={degraded ? "#f59e0b" : "#2563eb"}
                    strokeWidth="1.5"
                  />
                  <text x={eq.x} y={eq.y + 4} textAnchor="middle" fontSize="9">{eq.icon}</text>
                  <text
                    x={eq.x} y={eq.y + 20} textAnchor="middle"
                    fill={degraded ? "#f59e0b" : "#60a5fa"}
                    fontSize="8" fontFamily="monospace"
                  >
                    {eq.label}
                  </text>
                  {degraded && (
                    <text x={eq.x + 8} y={eq.y - 8} fill="#f59e0b" fontSize="10">⚠</text>
                  )}
                </g>
              );
            })}

            {/* Permit markers */}
            {PERMIT_MARKERS.map(pm => (
              <g key={pm.id}>
                <rect
                  x={pm.x - 28} y={pm.y - 12} width={56} height={22}
                  rx="3" fill={`${pm.color}20`} stroke={pm.color} strokeWidth="1"
                />
                <text x={pm.x} y={pm.y + 2} textAnchor="middle" fill={pm.color} fontSize="7.5" fontFamily="monospace" fontWeight="bold">
                  🔥 {pm.id}
                </text>
              </g>
            ))}

            {/* Workers */}
            {workers.map(w => {
              const inRisk = ["Z-01", "Z-02"].includes(w.current_zone_id);
              return (
                <g key={w.id}>
                  {inRisk && (
                    <circle cx={w.x} cy={w.y} r="14" fill="none" stroke="#ef4444" strokeWidth="1.5">
                      <animate attributeName="r" values="12;20;12" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0;0.8" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle
                    cx={w.x} cy={w.y} r="9"
                    fill={inRisk ? "#ef444450" : `${w.color}40`}
                    stroke={inRisk ? "#ef4444" : w.color}
                    strokeWidth="2"
                  />
                  <text x={w.x} y={w.y + 4} textAnchor="middle" fontSize="10">👷</text>
                  <text
                    x={w.x} y={w.y + 22} textAnchor="middle"
                    fill={inRisk ? "#ef4444" : "#94a3b8"}
                    fontSize="8" fontFamily="monospace"
                  >
                    {w.name.split(" ")[0]}
                  </text>
                </g>
              );
            })}

            {/* North arrow */}
            <text x="745" y="440" fill="#1e2d45" fontSize="18">↑N</text>
            <text x="740" y="455" fill="#1e2d45" fontSize="9" fontFamily="monospace">NORTH</text>
          </svg>
        </div>

        {/* Zone detail panel */}
        <div className="space-y-3">
          {selectedZone ? (
            (() => {
              const zone = ZONES.find(z => z.id === selectedZone)!;
              const zoneWorkers = workers.filter(w => w.current_zone_id === selectedZone);
              const isRisk = riskZones.includes(selectedZone);
              return (
                <div className="card animate-fade-up" style={isRisk ? { border: `1px solid ${zone.color}40` } : {}}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: zone.color }} />
                    <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{zone.name}</h3>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span style={{ color: "var(--text-muted)" }}>Zone ID</span>
                      <span className="mono" style={{ color: "var(--text-secondary)" }}>{zone.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--text-muted)" }}>Hazard Class</span>
                      <span style={{ color: zone.color }}>{zone.hazard}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--text-muted)" }}>Risk Status</span>
                      <span style={{ color: isRisk ? "#ef4444" : "#10b981" }}>
                        {isRisk ? "⚠ AT RISK" : "✓ NORMAL"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "var(--text-muted)" }}>Workers Present</span>
                      <span style={{ color: zoneWorkers.length > 0 ? "#f59e0b" : "#10b981" }}>
                        {zoneWorkers.length}
                      </span>
                    </div>
                    {zoneWorkers.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {zoneWorkers.map(w => (
                          <div key={w.id} className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: w.color }} />
                            <span style={{ color: "var(--text-secondary)" }}>{w.name} — {w.role}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="card" style={{ color: "var(--text-muted)", fontSize: 13 }}>
              Click a zone on the map to see details.
            </div>
          )}

          {/* Active Permits */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Active Permits</h3>
            <div className="space-y-2">
              <div
                className="p-2 rounded text-xs"
                style={{ background: "#f9731615", border: "1px solid #f9731630" }}
              >
                <div className="font-bold" style={{ color: "#f97316" }}>🔥 PTW-2026-481</div>
                <div style={{ color: "var(--text-secondary)" }}>Hot Work — Zone C-12</div>
                <div style={{ color: "var(--text-muted)" }}>10:00 – 14:00 · Approved: D. Singh</div>
                <div
                  className="mt-1 text-xs font-bold"
                  style={{ color: simState.summary.intervention_applied ? "#ef4444" : "#f97316" }}
                >
                  Status: {simState.summary.intervention_applied ? "⛔ HELD" : "✓ ACTIVE"}
                </div>
              </div>
              <div
                className="p-2 rounded text-xs"
                style={{ background: "#a855f715", border: "1px solid #a855f730" }}
              >
                <div className="font-bold" style={{ color: "#a855f7" }}>🕳 PTW-2026-479</div>
                <div style={{ color: "var(--text-secondary)" }}>Confined Space — Zone C-04</div>
                <div style={{ color: "var(--text-muted)" }}>08:00 – 16:00 · Approved: A. Kumar</div>
              </div>
            </div>
          </div>

          {/* Equipment status */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Equipment Status</h3>
            <div className="space-y-2 text-xs">
              {[
                { id: "C-12", name: "Compressor C-12", status: "Running", color: "#10b981" },
                { id: "V-07", name: "Ventilation V-07", status: "DEGRADED", color: "#f59e0b" },
                { id: "GD-01", name: "Gas Detector GD-01", status: "Active", color: "#10b981" },
                { id: "GD-02", name: "Gas Detector GD-02", status: "Active", color: "#10b981" },
              ].map(eq => (
                <div key={eq.id} className="flex items-center justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>{eq.name}</span>
                  <span className="font-bold" style={{ color: eq.color }}>{eq.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
