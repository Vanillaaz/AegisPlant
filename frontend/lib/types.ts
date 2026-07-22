export interface Sensor {
  id: string;
  sensor_type: string;
  unit: string;
  zone_id: string;
  current_value: number;
  history: number[];
  normal_range: number[];
  warning_threshold: number;
  alarm_threshold: number;
  equipment_id: string;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  badge: string;
  current_zone_id: string;
  ppe_status: string;
  x: number;
  y: number;
  color: string;
}

export interface Alert {
  id: string;
  severity: string;
  risk_score: number;
  status: string;
  created_at: string;
  contributing_factors: string[];
  recommended_actions: string[];
  confidence: number;
  lead_time_minutes: number | null;
  post_intervention_score: number;
  exposure_minutes_avoided: number;
  triggered_rules: string[];
  baseline_would_alert: boolean;
  aegis_advantage_minutes: number;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor_type: string;
  actor_id: string;
  actor_name: string;
  event_type: string;
  payload: Record<string, unknown>;
  description: string;
}

export interface DashboardSummary {
  plant_risk_score: number;
  risk_severity: string;
  active_permits_count: number;
  workers_in_elevated_zones: number;
  active_alerts: number;
  critical_alerts: number;
  simulation_running: boolean;
  simulation_step: number;
  intervention_applied: boolean;
}

export interface RiskState {
  risk_score: number;
  severity: string;
  confidence: number;
  contributing_factors: string[];
  recommended_actions: string[];
}

export interface SimState {
  summary: DashboardSummary;
  sensors: Sensor[];
  workers: Worker[];
  alerts: Alert[];
  auditEvents: AuditEvent[];
  currentRisk: RiskState;
  interventionResult: Record<string, unknown> | null;
}

export const initialSimState: SimState = {
  summary: {
    plant_risk_score: 12,
    risk_severity: "low",
    active_permits_count: 2,
    workers_in_elevated_zones: 0,
    active_alerts: 0,
    critical_alerts: 0,
    simulation_running: false,
    simulation_step: 0,
    intervention_applied: false,
  },
  sensors: [],
  workers: [],
  alerts: [],
  auditEvents: [],
  currentRisk: {
    risk_score: 12,
    severity: "low",
    confidence: 0.4,
    contributing_factors: [],
    recommended_actions: [],
  },
  interventionResult: null,
};

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical": return "#dc2626";
    case "high": return "#f97316";
    case "medium": return "#f59e0b";
    case "low": return "#10b981";
    default: return "#10b981";
  }
}

export function getSensorStatus(value: number, warning: number, alarm: number): "normal" | "warning" | "alarm" {
  if (value >= alarm) return "alarm";
  if (value >= warning) return "warning";
  return "normal";
}
