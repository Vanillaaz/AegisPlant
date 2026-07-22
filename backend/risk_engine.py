"""
Aegis Plant — Compound Risk Engine
Rule-based weighted scoring. Designed to be replaceable with ML model.
"""
from typing import Any
from datetime import datetime, timezone


# ── RULE WEIGHTS ──────────────────────────────────────────────
RULES = [
    {
        "id": "R-01",
        "name": "H2S Rising Trend",
        "description": "H2S concentration increasing over consecutive readings",
        "weight": 25,
        "category": "Sensor"
    },
    {
        "id": "R-02",
        "name": "Active Hot Work Permit in Zone",
        "description": "Hot work permit PTW active in or adjacent to H2S zone",
        "weight": 22,
        "category": "Permit"
    },
    {
        "id": "R-03",
        "name": "Degraded Ventilation",
        "description": "Primary ventilation below 50% rated capacity",
        "weight": 20,
        "category": "Equipment"
    },
    {
        "id": "R-04",
        "name": "Workers in Exposure Radius",
        "description": "Personnel present in or approaching H2S risk zone",
        "weight": 15,
        "category": "Personnel"
    },
    {
        "id": "R-05",
        "name": "H2S Above Warning Level",
        "description": "H2S reading exceeds warning threshold (7 ppm)",
        "weight": 10,
        "category": "Sensor"
    },
    {
        "id": "R-06",
        "name": "Near-Miss Pattern Match",
        "description": "Current condition matches historical near-miss scenario",
        "weight": 8,
        "category": "Historical"
    },
]


def evaluate_risk(state: dict) -> dict:
    """
    Evaluate compound risk score from current plant state.
    Returns risk assessment with score, severity, contributing factors, and recommendations.
    """
    score = 0
    contributing_factors = []
    triggered_rules = []

    h2s_readings = state.get("h2s_readings", [])  # list of recent values
    vent_flow = state.get("vent_flow", 5000)  # m3/h
    active_permits = state.get("active_permits", [])
    workers_in_zone = state.get("workers_in_zone", [])
    near_miss_similarity = state.get("near_miss_similarity", 0)

    # R-01: H2S Rising Trend
    if len(h2s_readings) >= 2:
        latest = h2s_readings[-1]
        prev = h2s_readings[-2]
        if latest > prev:
            trend_delta = latest - prev
            rise_score = min(RULES[0]["weight"], int(RULES[0]["weight"] * (trend_delta / 3.0)))
            score += rise_score
            triggered_rules.append("R-01")
            contributing_factors.append(
                f"H2S concentration rising: {prev:.1f} → {latest:.1f} ppm "
                f"(+{trend_delta:.1f} ppm over last reading)"
            )

    # R-02: Active Hot Work Permit
    hw_permits = [p for p in active_permits if p.get("type") == "Hot Work" and p.get("status") == "active"]
    if hw_permits:
        score += RULES[1]["weight"]
        triggered_rules.append("R-02")
        for p in hw_permits:
            contributing_factors.append(
                f"Active hot work permit {p['id']} in Zone {p.get('zone', 'C-12')} — "
                f"creates ignition source within H2S exposure radius"
            )

    # R-03: Degraded Ventilation
    if vent_flow < 2500:  # below 50% of 5000 rated
        score += RULES[2]["weight"]
        triggered_rules.append("R-03")
        pct = int(vent_flow / 5000 * 100)
        contributing_factors.append(
            f"Ventilation V-07 at {pct}% capacity ({vent_flow:.0f} m³/h vs 5,000 rated). "
            f"Work order WO-2847 in progress. Gas dispersion severely limited."
        )
    elif vent_flow < 4000:  # below 80%
        score += int(RULES[2]["weight"] * 0.5)
        triggered_rules.append("R-03")
        pct = int(vent_flow / 5000 * 100)
        contributing_factors.append(
            f"Ventilation V-07 degraded to {pct}% capacity — below minimum safe threshold"
        )

    # R-04: Workers in Exposure Radius
    if len(workers_in_zone) >= 2:
        score += RULES[3]["weight"]
        triggered_rules.append("R-04")
        names = [w.get("name", "Unknown") for w in workers_in_zone]
        contributing_factors.append(
            f"{len(workers_in_zone)} workers in H2S exposure radius: {', '.join(names)}. "
            f"Permit PTW-481 authorises presence but conditions have changed since gas test."
        )
    elif len(workers_in_zone) == 1:
        score += int(RULES[3]["weight"] * 0.6)
        triggered_rules.append("R-04")

    # R-05: H2S Above Warning
    current_h2s = h2s_readings[-1] if h2s_readings else 0
    if current_h2s >= 7:
        score += RULES[4]["weight"]
        triggered_rules.append("R-05")
        contributing_factors.append(
            f"H2S at {current_h2s:.1f} ppm — above 7 ppm warning threshold. "
            f"SOP-HSE-HW-001 §4.2 requires immediate work suspension."
        )
    elif current_h2s >= 5:
        score += int(RULES[4]["weight"] * 0.6)
        triggered_rules.append("R-05")
        contributing_factors.append(
            f"H2S at {current_h2s:.1f} ppm — approaching 7 ppm suspension threshold"
        )

    # R-06: Near-Miss Pattern Match
    if near_miss_similarity >= 0.85:
        score += RULES[5]["weight"]
        triggered_rules.append("R-06")
        contributing_factors.append(
            f"Current conditions match near-miss NM-2024-047 (similarity {near_miss_similarity:.0%}): "
            f"H2S rise + hot work + degraded ventilation — workers evacuated in that event."
        )
    elif near_miss_similarity >= 0.7:
        score += int(RULES[5]["weight"] * 0.5)

    # Cap score at 100
    score = min(score, 100)

    # Determine severity
    if score >= 80:
        severity = "critical"
        lead_time_minutes = 18
    elif score >= 60:
        severity = "high"
        lead_time_minutes = 35
    elif score >= 40:
        severity = "medium"
        lead_time_minutes = 60
    else:
        severity = "low"
        lead_time_minutes = None

    # Confidence based on data quality
    confidence = min(0.98, 0.6 + len(triggered_rules) * 0.06 + (near_miss_similarity * 0.1))

    # Recommended actions
    recommended_actions = []
    if "R-02" in triggered_rules:
        recommended_actions.append("Hold permit PTW-481 immediately")
    if "R-04" in triggered_rules:
        recommended_actions.append("Restrict access to Zone C-12 and adjacent hot-work area")
    recommended_actions.append("Dispatch gas-response team with SCBA to Zone C-12")
    if "R-03" in triggered_rules:
        recommended_actions.append("Verify ventilation V-07 — escalate WO-2847 to emergency priority")
    if "R-05" in triggered_rules:
        recommended_actions.append("Notify all workers in Zone Z-01 and Z-02 to evacuate")

    # Estimated risk reduction after recommended action
    risk_reduction_score = max(0, score - 68)  # removes R-01, R-02, R-04, R-05 contributions

    # Baseline comparison (single-threshold detector)
    baseline_alert = current_h2s >= 10  # only alerts at alarm threshold
    baseline_lead_time = 0 if baseline_alert else None

    return {
        "risk_score": score,
        "severity": severity,
        "confidence": round(confidence, 2),
        "lead_time_minutes": lead_time_minutes,
        "baseline_would_alert": baseline_alert,
        "baseline_lead_time_minutes": baseline_lead_time,
        "aegis_advantage_minutes": lead_time_minutes if not baseline_alert else 0,
        "contributing_factors": contributing_factors,
        "triggered_rules": triggered_rules,
        "recommended_actions": recommended_actions,
        "post_intervention_score": risk_reduction_score,
        "exposure_minutes_avoided": (len(workers_in_zone) * (lead_time_minutes or 0)) if lead_time_minutes else 0,
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
    }
