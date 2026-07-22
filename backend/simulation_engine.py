"""
Aegis Plant — Simulation Engine
Deterministic scenario replay for the primary demo incident.
"""
import asyncio
from typing import Optional, Callable, Any
from datetime import datetime, timezone
import copy

from seed_data import SCENARIO_STEPS, WORKERS, PERMITS, SENSORS
from risk_engine import evaluate_risk


class SimulationEngine:
    def __init__(self):
        self.running = False
        self.step_index = 0
        self.broadcast_fn: Optional[Callable] = None
        self._task: Optional[asyncio.Task] = None

        # Live state
        self.sensor_history: dict[str, list[float]] = {s["id"]: [0.0] for s in SENSORS}
        self.worker_positions: dict[str, dict] = {w["id"]: dict(w) for w in WORKERS}
        self.active_permits: list[dict] = copy.deepcopy(PERMITS)
        self.audit_log: list[dict] = []
        self.alerts: list[dict] = []
        self.interventions: list[dict] = []
        self.current_risk: dict = {
            "risk_score": 12, "severity": "low", "confidence": 0.4,
            "contributing_factors": [], "recommended_actions": [],
            "lead_time_minutes": None, "post_intervention_score": 0,
            "exposure_minutes_avoided": 0
        }
        self.simulation_time_offset: int = 0
        self.intervention_applied = False

    def set_broadcaster(self, fn: Callable):
        self.broadcast_fn = fn

    async def _broadcast(self, event_type: str, data: dict):
        if self.broadcast_fn:
            await self.broadcast_fn({"event": event_type, **data})

    def reset(self):
        self.running = False
        if self._task and not self._task.done():
            self._task.cancel()
        self.step_index = 0
        self.sensor_history = {s["id"]: [0.0] for s in SENSORS}
        self.worker_positions = {w["id"]: dict(w) for w in WORKERS}
        self.active_permits = copy.deepcopy(PERMITS)
        self.audit_log = []
        self.alerts = []
        self.interventions = []
        self.simulation_time_offset = 0
        self.intervention_applied = False
        self.current_risk = {
            "risk_score": 12, "severity": "low", "confidence": 0.4,
            "contributing_factors": [], "recommended_actions": [],
            "lead_time_minutes": None, "post_intervention_score": 0,
            "exposure_minutes_avoided": 0
        }

    def start(self, loop: asyncio.AbstractEventLoop = None):
        if self.running:
            return
        self.running = True
        self._task = asyncio.ensure_future(self._run())

    async def _run(self):
        """Replay scenario steps with realistic pacing."""
        while self.running and self.step_index < len(SCENARIO_STEPS):
            step = SCENARIO_STEPS[self.step_index]
            self.simulation_time_offset = step["t"]

            for event in step["events"]:
                await self._process_event(event)
                await asyncio.sleep(0.3)

            # Recalculate compound risk after each step
            await self._recalculate_risk()

            # Broadcast step label
            await self._broadcast("simulation_step", {
                "step": self.step_index,
                "label": step["label"],
                "time_offset": step["t"]
            })

            self.step_index += 1

            # Pacing: 4 seconds between steps
            if self.step_index < len(SCENARIO_STEPS):
                await asyncio.sleep(4)

        self.running = False

    async def _process_event(self, event: dict):
        etype = event["type"]

        if etype == "sensor_reading":
            sid = event["sensor_id"]
            val = event["value"]
            if sid not in self.sensor_history:
                self.sensor_history[sid] = []
            self.sensor_history[sid].append(val)
            # Keep last 20 readings
            self.sensor_history[sid] = self.sensor_history[sid][-20:]

            await self._broadcast("sensor_reading_created", {
                "sensor_id": sid,
                "value": val,
                "status": event.get("status", "normal"),
                "timestamp": datetime.now(timezone.utc).isoformat()
            })

            # Audit
            self._add_audit("sensor_system", f"Sensor {sid} reading: {val}", "sensor_reading")

        elif etype == "worker_location_updated":
            wid = event["worker_id"]
            if wid in self.worker_positions:
                self.worker_positions[wid]["current_zone_id"] = event["zone_id"]
                self.worker_positions[wid]["x"] = event["x"]
                self.worker_positions[wid]["y"] = event["y"]

            await self._broadcast("worker_location_updated", {
                "worker_id": wid,
                "zone_id": event["zone_id"],
                "x": event["x"],
                "y": event["y"],
                "timestamp": datetime.now(timezone.utc).isoformat()
            })

            worker_name = self.worker_positions.get(wid, {}).get("name", wid)
            self._add_audit("worker_tracking", f"{worker_name} entered zone {event['zone_id']}", "location_update")

        elif etype == "risk_alert_created":
            alert = {
                "id": event["alert_id"],
                "severity": event["severity"],
                "score": event["score"],
                "status": "active",
                "created_at": datetime.now(timezone.utc).isoformat(),
                **self.current_risk
            }
            self.alerts.append(alert)
            await self._broadcast("risk_alert_created", alert)
            self._add_audit("aegis_risk_engine", f"CRITICAL compound risk alert generated. Score: {event['score']}", "alert_created")

    async def _recalculate_risk(self):
        """Build state snapshot and run risk engine."""
        h2s_vals = self.sensor_history.get("SEN-H2S-01", [0])
        vent_flow = (self.sensor_history.get("SEN-VENT-01", [5000]))[-1]

        workers_in_zone = [
            w for w in self.worker_positions.values()
            if w.get("current_zone_id") in ("Z-01", "Z-02")
        ]

        active_hw = [
            {"id": p["id"], "type": p["permit_type"], "zone": p["zone_id"], "status": p["status"]}
            for p in self.active_permits
            if p["permit_type"] == "Hot Work" and p["status"] == "active"
        ]

        # Near-miss similarity: rises as conditions worsen
        current_h2s = h2s_vals[-1] if h2s_vals else 0
        nm_sim = min(0.94, 0.3 + (current_h2s / 10) * 0.5 + (0.1 if len(workers_in_zone) > 0 else 0))

        state = {
            "h2s_readings": h2s_vals,
            "vent_flow": vent_flow,
            "active_permits": active_hw,
            "workers_in_zone": workers_in_zone,
            "near_miss_similarity": nm_sim
        }

        result = evaluate_risk(state)
        
        # Override risk if intervention has been applied
        if self.intervention_applied:
            result["risk_score"] = self.current_risk.get("post_intervention_score", 14)
            if result["risk_score"] == 0:
                result["risk_score"] = 14
            result["severity"] = "low"
            result["contributing_factors"] = ["Intervention active: Zone restricted, permit held."]

        self.current_risk = result

        await self._broadcast("risk_score_updated", {
            "risk_score": result["risk_score"],
            "severity": result["severity"],
            "confidence": result["confidence"],
            "contributing_factors": result["contributing_factors"],
            "recommended_actions": result["recommended_actions"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    def apply_intervention(self, intervention: dict) -> dict:
        """Apply an approved intervention and simulate outcome."""
        action_type = intervention.get("action_type", "")

        # Hold permit
        for p in self.active_permits:
            if p["id"] == "PTW-481":
                p["status"] = "held"

        self.intervention_applied = True
        self.interventions.append(intervention)

        # Simulate reduced risk
        post_score = self.current_risk.get("post_intervention_score", 15)

        result_audit = {
            "id": f"AEV-INT-{len(self.interventions):03d}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "actor_type": "human",
            "actor_id": intervention.get("approved_by", "supervisor"),
            "actor_name": intervention.get("approved_by_name", "Shift Supervisor"),
            "event_type": "intervention_approved",
            "payload": intervention,
            "description": f"Intervention approved: {', '.join(intervention.get('actions', []))}. Risk score projected to drop from {self.current_risk.get('risk_score', 92)} to {post_score}."
        }
        self.audit_log.append(result_audit)

        # Immediately apply score so frontend polling doesn't bounce back to old score
        self.current_risk["risk_score"] = max(post_score, 14)
        self.current_risk["severity"] = "low"
        self.current_risk["contributing_factors"] = ["Intervention active: Zone restricted, permit held."]

        return {
            "success": True,
            "actions_taken": [
                "Permit PTW-481 status set to HELD",
                "Zone C-12 access restriction logged",
                "Gas response team dispatch notification sent",
                "V-07 work order escalated to emergency priority",
            ],
            "pre_intervention_score": self.current_risk.get("risk_score", 92),
            "post_intervention_score": post_score,
            "exposure_minutes_avoided": self.current_risk.get("exposure_minutes_avoided", 36),
            "audit_entry": result_audit
        }

    def _add_audit(self, actor: str, description: str, event_type: str):
        self.audit_log.append({
            "id": f"AEV-{len(self.audit_log) + 100:04d}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "actor_type": "system",
            "actor_id": actor,
            "actor_name": actor,
            "event_type": event_type,
            "payload": {},
            "description": description
        })

    def get_dashboard_summary(self) -> dict:
        critical_alerts = [a for a in self.alerts if a.get("severity") == "critical" and a.get("status") == "active"]
        workers_at_risk = [
            w for w in self.worker_positions.values()
            if w.get("current_zone_id") in ("Z-01", "Z-02")
        ]
        active_permits = [p for p in self.active_permits if p["status"] in ("active", "held")]

        res_score = max(self.current_risk.get("risk_score", 0), 12 if not self.intervention_applied else 14)
        return {
            "plant_risk_score": res_score,
            "risk_severity": self.current_risk.get("severity", "low"),
            "active_permits_count": len(active_permits),
            "workers_in_elevated_zones": len(workers_at_risk),
            "active_alerts": len(critical_alerts),
            "critical_alerts": len(critical_alerts),
            "simulation_running": self.running,
            "simulation_step": self.step_index,
            "intervention_applied": self.intervention_applied,
        }
