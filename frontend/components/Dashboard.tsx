"use client";

import { SimState, getSensorStatus } from "@/lib/types";
import { useState, useEffect } from "react";
import {
  LineChart, Line, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { 
  ShieldAlert, Activity, Users, ClipboardList, 
  AlertTriangle, ArrowRight, Zap, Info
} from "lucide-react";

interface Props {
  simState: SimState;
  onViewAlert: () => void;
}

const SENSOR_LABELS: Record<string, string> = {
  "SEN-H2S-01": "H₂S · Zone C-12",
  "SEN-H2S-02": "H₂S · Hot Work Zone",
  "SEN-TEMP-01": "Temp · C-12",
  "SEN-PRES-01": "Pres · C-12",
  "SEN-VENT-01": "Ventilation V-07",
  "SEN-LEL-01": "LEL · Zone C-12",
};

export default function Dashboard({ simState, onViewAlert }: Props) {
  const { summary, sensors, workers, currentRisk } = simState;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="p-8 text-slate-400">Loading command centre...</div>;

  const isCritical = summary.risk_severity === "critical";

  const kpis = [
    {
      label: "Plant Risk Score",
      value: summary.plant_risk_score,
      unit: "/100",
      color: isCritical ? "text-red-500" : (summary.plant_risk_score > 50 ? "text-amber-500" : "text-emerald-500"),
      bg: isCritical ? "bg-red-500/10 border-red-500/30" : "bg-slate-900/50 border-slate-800",
      icon: <Activity className={isCritical ? "text-red-500" : "text-slate-400"} size={22} />,
      glow: isCritical,
    },
    {
      label: "Active Permits",
      value: summary.active_permits_count,
      unit: "",
      color: "text-slate-200",
      bg: "bg-slate-900/50 border-slate-800",
      icon: <ClipboardList className="text-amber-500" size={22} />,
      glow: false,
    },
    {
      label: "Workers at Risk",
      value: summary.workers_in_elevated_zones,
      unit: "",
      color: summary.workers_in_elevated_zones > 0 ? "text-red-500" : "text-slate-200",
      bg: summary.workers_in_elevated_zones > 0 ? "bg-red-500/10 border-red-500/30" : "bg-slate-900/50 border-slate-800",
      icon: <Users className={summary.workers_in_elevated_zones > 0 ? "text-red-500" : "text-slate-400"} size={22} />,
      glow: summary.workers_in_elevated_zones > 0,
    },
    {
      label: "Critical Alerts",
      value: summary.critical_alerts,
      unit: "",
      color: summary.critical_alerts > 0 ? "text-red-500" : "text-slate-200",
      bg: summary.critical_alerts > 0 ? "bg-red-500/10 border-red-500/30" : "bg-slate-900/50 border-slate-800",
      icon: <ShieldAlert className={summary.critical_alerts > 0 ? "text-red-500" : "text-emerald-500"} size={22} />,
      glow: summary.critical_alerts > 0,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
            Command Centre
            {isCritical && <span className="flex h-3 w-3 relative ml-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Reliance Hazira Complex · Unit 3 · {new Date().toLocaleTimeString()} IST
          </p>
        </div>
        {isCritical && (
          <button
            onClick={onViewAlert}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white animate-risk-glow transition-all hover:scale-105 bg-red-600/80 backdrop-blur-md"
          >
            <AlertTriangle size={18} />
            View Critical Alert
            <ArrowRight size={16} />
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden backdrop-blur-xl border rounded-2xl p-5 shadow-lg transition-all duration-300 ${kpi.bg} ${kpi.glow ? 'shadow-red-900/20' : ''}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-slate-950/40 rounded-lg border border-slate-800/50">
                {kpi.icon}
              </div>
            </div>
            <div className={`text-4xl font-bold font-mono tracking-tight ${kpi.color}`}>
              {kpi.value}<span className="text-lg font-medium text-slate-500 ml-1">{kpi.unit}</span>
            </div>
            <div className="text-sm font-medium text-slate-400 mt-1.5">
              {kpi.label}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Sensor Trends (Left 2 Columns) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Activity size={18} className="text-blue-500" />
                Live Sensor Telemetry
              </h2>
              <span className="text-xs font-mono px-3 py-1 bg-slate-800/50 text-slate-400 rounded-full border border-slate-700/50">
                Live Data Feed
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {sensors.slice(0, 4).map(sensor => {
                const history = sensor.history || [];
                const chartData = history.map((v, i) => ({ t: i, v }));
                const status = getSensorStatus(sensor.current_value, sensor.warning_threshold, sensor.alarm_threshold);
                
                const isAlarm = status === "alarm";
                const isWarn = status === "warning";
                
                const statusColor = isAlarm ? "#ef4444" : isWarn ? "#f59e0b" : "#3b82f6";
                const statusBg = isAlarm ? "bg-red-500/10 text-red-500 border-red-500/20" : isWarn ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20";

                return (
                  <div
                    key={sensor.id}
                    className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/80 transition-colors hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-medium text-slate-300">
                          {SENSOR_LABELS[sensor.id] || sensor.sensor_type}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Alarm threshold: {sensor.alarm_threshold} {sensor.unit}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold font-mono tracking-tight" style={{ color: statusColor }}>
                          {sensor.current_value?.toFixed(1)} <span className="text-sm font-medium text-slate-500">{sensor.unit}</span>
                        </div>
                        <div className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded border mt-1 ${statusBg}`}>
                          {status}
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-16 mt-4 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <Line
                            type="monotone" dataKey="v"
                            stroke={statusColor} strokeWidth={2.5}
                            dot={false} isAnimationActive={false}
                          />
                          <ReferenceLine y={sensor.alarm_threshold} stroke="#ef4444" strokeOpacity={0.4} strokeDasharray="4 4" />
                          <ReferenceLine y={sensor.warning_threshold} stroke="#f59e0b" strokeOpacity={0.3} strokeDasharray="4 4" />
                          <Tooltip
                            contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px", color: "#f8fafc", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}
                            itemStyle={{ color: statusColor, fontWeight: "bold" }}
                            formatter={(v: number) => [`${v?.toFixed(1)} ${sensor.unit}`, "Value"]}
                            labelStyle={{ display: "none" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Baseline vs Aegis Comparison */}
          {currentRisk.risk_score > 30 && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-indigo-500/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(79,70,229,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Zap size={120} />
              </div>
              <h2 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Zap size={16} /> AI Compound Risk vs. Baseline
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative z-10">
                <div>
                  <div className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Baseline Alert</div>
                  <div className="text-3xl font-bold font-mono text-slate-600">
                    {simState.alerts[0]?.baseline_would_alert ? <span className="text-red-500">TRIGGERED</span> : "—"}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">Relies on single sensor crossing 10 ppm H₂S</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Aegis Detection</div>
                  <div className="text-3xl font-bold font-mono text-emerald-400">
                    {simState.alerts[0]?.lead_time_minutes || currentRisk.risk_score > 50 ? "18 min" : "—"}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">Detected via compound risk patterns</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Prevention Advantage</div>
                  <div className="text-3xl font-bold font-mono text-indigo-400">
                    +{simState.alerts[0]?.aegis_advantage_minutes || (currentRisk.risk_score > 50 ? 18 : 0)} min
                  </div>
                  <div className="text-xs text-slate-500 mt-2">Extra response time saved</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Context & Workers */}
        <div className="space-y-6">
          
          {/* Active Risk Factors */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2 mb-4">
              <Info size={18} className="text-amber-500" />
              Active Risk Factors
            </h2>
            {currentRisk.contributing_factors.length === 0 ? (
              <div className="text-sm text-slate-400 bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 text-center">
                All parameters operating normally.
              </div>
            ) : (
              <div className="space-y-3">
                {currentRisk.contributing_factors.map((f, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-3.5 rounded-xl text-sm bg-red-500/5 border border-red-500/10 text-slate-300"
                  >
                    <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{f}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Workers in Zone */}
          <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl flex-1">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2 mb-4">
              <Users size={18} className="text-indigo-400" />
              Personnel Tracking
            </h2>
            {workers.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-4">Scanning RFID...</div>
            ) : (
              <div className="space-y-3">
                {workers.map(w => {
                  const inRisk = ["Z-01", "Z-02"].includes(w.current_zone_id);
                  return (
                    <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                      <div className="relative flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${inRisk ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-300'}`}>
                          {w.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        {inRisk && (
                          <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-slate-950"></span>
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-200 truncate">{w.name}</div>
                        <div className="text-xs text-slate-500 truncate">{w.role}</div>
                      </div>
                      
                      <div className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${
                        inRisk ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                        {inRisk ? "At Risk" : "Safe"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
