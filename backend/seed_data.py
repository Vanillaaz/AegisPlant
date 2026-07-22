"""
Aegis Plant — Seed Data
All synthetic / clearly-labelled demo data for the primary incident scenario.
Scenario: H2S rise + hot-work permit + degraded ventilation + workers approaching Compressor C-12
"""
from datetime import datetime, timezone

# ── PLANT ZONES ───────────────────────────────────────────────
ZONES = [
    {
        "id": "Z-01", "name": "Compressor C-12 Area",
        "hazard_classification": "Flammable Gas / Toxic",
        "max_occupancy": 2,
        "x": 340, "y": 180, "w": 160, "h": 120,
        "color": "#ef4444",
        "description": "High-pressure compressor zone. H2S risk area. Requires PPE Level C minimum."
    },
    {
        "id": "Z-02", "name": "Hot Work Zone",
        "hazard_classification": "Ignition Source",
        "max_occupancy": 3,
        "x": 260, "y": 160, "w": 100, "h": 80,
        "color": "#f97316",
        "description": "Designated hot work area. Active permits must be displayed. Fire watch required."
    },
    {
        "id": "Z-03", "name": "Ventilation Control Room",
        "hazard_classification": "Low",
        "max_occupancy": 10,
        "x": 80, "y": 80, "w": 140, "h": 100,
        "color": "#22c55e",
        "description": "Main plant control room. Monitors all SCADA systems."
    },
    {
        "id": "Z-04", "name": "Confined Space Entry",
        "hazard_classification": "Oxygen Deficiency / Toxic",
        "max_occupancy": 2,
        "x": 520, "y": 220, "w": 110, "h": 90,
        "color": "#a855f7",
        "description": "Confined space. Entry requires permit, gas testing, and standby person."
    },
    {
        "id": "Z-05", "name": "Maintenance Workshop",
        "hazard_classification": "Low",
        "max_occupancy": 15,
        "x": 80, "y": 280, "w": 150, "h": 100,
        "color": "#3b82f6",
        "description": "General maintenance area. Machine guards and PPE required."
    },
    {
        "id": "Z-06", "name": "Evacuation Assembly Point A",
        "hazard_classification": "Safe",
        "max_occupancy": 200,
        "x": 640, "y": 360, "w": 120, "h": 70,
        "color": "#10b981",
        "description": "Primary muster point. Report to safety officer on assembly."
    },
    {
        "id": "Z-07", "name": "Chemical Storage",
        "hazard_classification": "Flammable / Corrosive",
        "max_occupancy": 2,
        "x": 340, "y": 340, "w": 130, "h": 80,
        "color": "#eab308",
        "description": "Flammable and corrosive chemical storage. No ignition sources."
    },
]

# ── EQUIPMENT ─────────────────────────────────────────────────
EQUIPMENT = [
    {
        "id": "EQ-C12", "name": "Compressor C-12", "type": "Centrifugal Compressor",
        "zone_id": "Z-01", "operational_status": "running",
        "maintenance_status": "normal",
        "x": 400, "y": 220,
        "specs": "Discharge pressure: 45 bar | Flow: 12,000 Nm³/h | H2S duty"
    },
    {
        "id": "EQ-V07", "name": "Ventilation Unit V-07", "type": "Forced Draft Ventilator",
        "zone_id": "Z-01", "operational_status": "degraded",
        "maintenance_status": "work-order-open",
        "x": 360, "y": 260,
        "specs": "Capacity: 5,000 m³/h | Status: DEGRADED — 40% flow capacity only"
    },
    {
        "id": "EQ-GD01", "name": "Gas Detector GD-01", "type": "Fixed Gas Detector",
        "zone_id": "Z-01", "operational_status": "running",
        "maintenance_status": "calibrated",
        "x": 420, "y": 190,
        "specs": "H2S sensor | Range: 0–50 ppm | Alarm at 10 ppm | Last cal: 2026-07-15"
    },
    {
        "id": "EQ-GD02", "name": "Gas Detector GD-02", "type": "Fixed Gas Detector",
        "zone_id": "Z-02", "operational_status": "running",
        "maintenance_status": "calibrated",
        "x": 300, "y": 185,
        "specs": "H2S + LEL sensor | Adjacent to hot work zone"
    },
    {
        "id": "EQ-FW01", "name": "Fire Watch Station FW-01", "type": "Fire Watch Point",
        "zone_id": "Z-02", "operational_status": "active",
        "maintenance_status": "normal",
        "x": 280, "y": 200,
        "specs": "Active fire watch. Extinguisher CO2-45kg present."
    },
    {
        "id": "EQ-P05", "name": "Process Pump P-05", "type": "Centrifugal Pump",
        "zone_id": "Z-07", "operational_status": "running",
        "maintenance_status": "normal",
        "x": 390, "y": 375,
        "specs": "H2S sour water service | Seal flush active"
    },
]

# ── SENSORS ───────────────────────────────────────────────────
SENSORS = [
    {
        "id": "SEN-H2S-01", "equipment_id": "EQ-GD01", "zone_id": "Z-01",
        "sensor_type": "H2S", "unit": "ppm",
        "normal_range": [0, 5], "warning_threshold": 7, "alarm_threshold": 10
    },
    {
        "id": "SEN-H2S-02", "equipment_id": "EQ-GD02", "zone_id": "Z-02",
        "sensor_type": "H2S", "unit": "ppm",
        "normal_range": [0, 4], "warning_threshold": 6, "alarm_threshold": 10
    },
    {
        "id": "SEN-TEMP-01", "equipment_id": "EQ-C12", "zone_id": "Z-01",
        "sensor_type": "Temperature", "unit": "°C",
        "normal_range": [20, 45], "warning_threshold": 50, "alarm_threshold": 60
    },
    {
        "id": "SEN-PRES-01", "equipment_id": "EQ-C12", "zone_id": "Z-01",
        "sensor_type": "Pressure", "unit": "bar",
        "normal_range": [40, 47], "warning_threshold": 48, "alarm_threshold": 50
    },
    {
        "id": "SEN-VENT-01", "equipment_id": "EQ-V07", "zone_id": "Z-01",
        "sensor_type": "Ventilation Flow", "unit": "m³/h",
        "normal_range": [4500, 5500], "warning_threshold": 3000, "alarm_threshold": 2000
    },
    {
        "id": "SEN-LEL-01", "equipment_id": "EQ-GD01", "zone_id": "Z-01",
        "sensor_type": "LEL", "unit": "%LEL",
        "normal_range": [0, 5], "warning_threshold": 10, "alarm_threshold": 20
    },
]

# ── WORKERS ───────────────────────────────────────────────────
WORKERS = [
    {
        "id": "W-001", "name": "Rajan Mehta", "role": "Maintenance Technician",
        "badge": "MT-4421", "current_zone_id": "Z-05", "ppe_status": "compliant",
        "x": 140, "y": 320, "color": "#60a5fa"
    },
    {
        "id": "W-002", "name": "Priya Sharma", "role": "Maintenance Technician",
        "badge": "MT-4422", "current_zone_id": "Z-05", "ppe_status": "compliant",
        "x": 165, "y": 340, "color": "#60a5fa"
    },
    {
        "id": "W-003", "name": "Anil Kumar", "role": "Safety Officer",
        "badge": "SO-0091", "current_zone_id": "Z-03", "ppe_status": "compliant",
        "x": 135, "y": 115, "color": "#34d399"
    },
    {
        "id": "W-004", "name": "Suresh Nair", "role": "Control Room Operator",
        "badge": "OP-2210", "current_zone_id": "Z-03", "ppe_status": "compliant",
        "x": 160, "y": 130, "color": "#34d399"
    },
    {
        "id": "W-005", "name": "Deepak Singh", "role": "Shift Supervisor",
        "badge": "SS-0034", "current_zone_id": "Z-03", "ppe_status": "compliant",
        "x": 110, "y": 100, "color": "#fbbf24"
    },
]

# ── PERMITS ───────────────────────────────────────────────────
PERMITS = [
    {
        "id": "PTW-481",
        "permit_number": "PTW-2026-481",
        "permit_type": "Hot Work",
        "zone_id": "Z-02",
        "equipment_id": "EQ-C12",
        "status": "active",
        "start_time": "2026-07-22T10:00:00Z",
        "end_time": "2026-07-22T14:00:00Z",
        "approved_by": "Deepak Singh",
        "assigned_to": ["W-001", "W-002"],
        "controls": [
            "Fire extinguisher on standby",
            "Fire watch assigned",
            "Gas test completed at 09:45",
            "Hot work within 15m of C-12"
        ],
        "gas_test_ppm": 1.2,
        "gas_test_time": "2026-07-22T09:45:00Z"
    },
    {
        "id": "PTW-479",
        "permit_number": "PTW-2026-479",
        "permit_type": "Confined Space Entry",
        "zone_id": "Z-04",
        "equipment_id": None,
        "status": "active",
        "start_time": "2026-07-22T08:00:00Z",
        "end_time": "2026-07-22T16:00:00Z",
        "approved_by": "Anil Kumar",
        "assigned_to": ["W-003"],
        "controls": [
            "Continuous gas monitoring",
            "Standby person designated",
            "Rescue equipment in place",
            "Atmospheric test every 30 min"
        ],
        "gas_test_ppm": 0.8,
        "gas_test_time": "2026-07-22T11:30:00Z"
    },
]

# ── MAINTENANCE WORK ORDERS ────────────────────────────────────
WORK_ORDERS = [
    {
        "id": "WO-2847",
        "equipment_id": "EQ-V07",
        "equipment_name": "Ventilation Unit V-07",
        "status": "in-progress",
        "priority": "high",
        "description": "Blade bearing replacement. Fan running at reduced capacity. Full replacement parts ETA: 4 hours.",
        "created_at": "2026-07-22T07:30:00Z",
        "assigned_to": "Maintenance Team B",
        "estimated_completion": "2026-07-22T16:00:00Z"
    },
    {
        "id": "WO-2845",
        "equipment_id": "EQ-C12",
        "equipment_name": "Compressor C-12",
        "status": "pending",
        "priority": "medium",
        "description": "Routine seal inspection scheduled. Not yet started. Seal flush system operating normally.",
        "created_at": "2026-07-21T14:00:00Z",
        "assigned_to": "Maintenance Team A",
        "estimated_completion": "2026-07-23T10:00:00Z"
    },
]

# ── NEAR MISS REPORTS ─────────────────────────────────────────
NEAR_MISSES = [
    {
        "id": "NM-2024-047",
        "title": "H2S Accumulation near C-09 during hot work",
        "date": "2024-09-14",
        "zone": "Compressor C-09 Area",
        "description": "During welding operations on a flange adjacent to compressor C-09, H2S concentration rose to 8.4 ppm over 20 minutes. Ventilation was running at reduced capacity due to a maintenance activity. Workers were evacuated when portable monitor alarmed at 7 ppm. No injuries. Root cause: concurrent maintenance on ventilation and hot work authorised without compound-risk assessment.",
        "contributing_factors": ["Rising H2S", "Reduced ventilation", "Active hot work", "Worker proximity"],
        "actions_taken": "Permit suspended. Zone evacuated. Ventilation restored. Re-assessment required before hot-work resumption.",
        "similarity_score": 0.94
    },
    {
        "id": "NM-2023-031",
        "title": "Expired PTW discovered during shift handover",
        "date": "2023-11-02",
        "zone": "Process Area 3",
        "description": "Maintenance team continued hot work after permit expiry. Shift handover did not include permit status review. Gas levels were within normal range. Corrective action: permit extension process revised and supervisor sign-off required.",
        "contributing_factors": ["Permit status gap", "Shift handover failure"],
        "actions_taken": "Permit control procedure revised. Training conducted for all supervisors.",
        "similarity_score": 0.61
    },
    {
        "id": "NM-2025-008",
        "title": "Degraded ventilation not flagged before hot work start",
        "date": "2025-02-19",
        "zone": "Storage Tank Area",
        "description": "Hot work permit issued while ventilation system for the adjacent area was in a degraded state. CMMS work order was not checked against active permits. Condition discovered during pre-job safety meeting. Work delayed 3 hours.",
        "contributing_factors": ["Degraded ventilation", "Active hot work", "CMMS-permit integration gap"],
        "actions_taken": "Automated cross-check between CMMS and PTW system implemented.",
        "similarity_score": 0.88
    },
]

# ── SAFETY DOCUMENTS (KNOWLEDGE BASE) ─────────────────────────
SAFETY_DOCUMENTS = [
    {
        "id": "DOC-SOP-HW-001",
        "title": "Hot Work Safety Operating Procedure",
        "source_type": "SOP",
        "source_reference": "SOP-HSE-HW-001 Rev 4",
        "content": """
Hot Work Safety Operating Procedure — SOP-HSE-HW-001 Rev 4

1. SCOPE
This procedure applies to all hot work activities including welding, cutting, grinding, and any work producing sparks or open flames within the plant boundary.

2. PRE-JOB REQUIREMENTS
2.1 A valid Permit to Work (PTW) must be obtained before any hot work commences.
2.2 Gas testing must be performed immediately before work starts. Work must not commence if H2S > 2 ppm in the work area.
2.3 If ventilation equipment in the zone is operating below 80% rated capacity, hot work is PROHIBITED until ventilation is restored or independent forced ventilation is provided.
2.4 Isolation of all ignition-sensitive equipment within 15 metres must be confirmed.

3. CONCURRENT ACTIVITY RESTRICTIONS
3.1 Hot work must not proceed simultaneously with any maintenance activity that reduces ventilation effectiveness in the same zone or adjacent zone.
3.2 When H2S gas concentrations are rising (two consecutive readings showing increase), work must be suspended regardless of absolute value being below alarm threshold.

4. GAS MONITORING DURING WORK
4.1 Continuous monitoring is required by a dedicated gas monitor operator.
4.2 Immediate suspension if H2S exceeds 5 ppm. Evacuation if H2S exceeds 7 ppm.
4.3 Suspend work and investigate if any sensor shows an upward trend over 10 minutes.

5. PERMIT CANCELLATION CRITERIA
Any of the following require immediate permit cancellation:
- H2S > 5 ppm
- LEL > 10%
- Ventilation failure or degradation below 50% capacity
- Change in process conditions from those assessed at permit issue
- Any emergency in adjacent zone
""",
        "embedding": None
    },
    {
        "id": "DOC-SOP-GAS-002",
        "title": "H2S Emergency Response Procedure",
        "source_type": "Emergency Procedure",
        "source_reference": "ERP-HSE-GAS-002 Rev 2",
        "content": """
H2S Emergency Response Procedure — ERP-HSE-GAS-002 Rev 2

1. HAZARD PROFILE
H2S (Hydrogen Sulphide) is a colourless, flammable, extremely hazardous gas. It is heavier than air and accumulates in low-lying areas and confined spaces. The threshold limit value (TLV-TWA) is 1 ppm. The immediately dangerous to life and health (IDLH) level is 50 ppm.

2. ALARM LEVELS
Level 1 — Warning: 5 ppm. Warn all personnel. Investigate source.
Level 2 — Alarm: 10 ppm. Stop all work. Evacuate zone. Don SCBA.
Level 3 — Emergency: 25 ppm. Full site emergency response. Initiate muster.

3. COMPOUND RISK CONDITIONS
When H2S levels are rising (even below 5 ppm), AND any of the following apply:
- Active hot work within 50 metres
- Ventilation operating below design capacity
- Workers in the proximity without SCBA
→ Treat as Level 2 Alarm condition immediately. Do not wait for threshold breach.

4. IMMEDIATE ACTIONS FOR SUPERVISOR
a) Hold or cancel any active hot work permit in the affected zone.
b) Restrict entry to affected zone.
c) Notify Safety Officer and Plant Head.
d) Dispatch gas response team with SCBA.
e) Confirm ventilation status and take corrective action.
f) Do not allow re-entry until two consecutive readings below 1 ppm.
""",
        "embedding": None
    },
    {
        "id": "DOC-SOP-VENT-003",
        "title": "Ventilation Management Standard",
        "source_type": "Engineering Standard",
        "source_reference": "ENG-STD-VENT-003 Rev 1",
        "content": """
Ventilation Management Standard — ENG-STD-VENT-003 Rev 1

1. PURPOSE
Defines minimum ventilation requirements for hazardous area operations, maintenance activities, and permit work.

2. MINIMUM REQUIREMENTS
2.1 All hazardous areas must maintain a minimum of 10 air changes per hour.
2.2 If primary ventilation capacity drops below 80%, an engineering assessment is required before operations continue.
2.3 If primary ventilation capacity drops below 50%, all hot work and confined space entry must cease immediately.

3. MAINTENANCE IMPACT
3.1 Any maintenance activity affecting ventilation equipment must be reviewed against active permits in the same zone.
3.2 Maintenance on ventilation must be logged in the CMMS and cross-referenced with the PTW register before work commences.
3.3 Ventilation V-07 (Zone C-12) is a critical safety system. Any planned or unplanned downgrade of V-07 requires Safety Officer notification within 15 minutes.

4. COMPENSATORY MEASURES
When primary ventilation is degraded, compensatory measures (portable ventilation, increased monitoring frequency, restricted occupancy) must be documented and approved by the Shift Supervisor before any hot work proceeds.
""",
        "embedding": None
    },
    {
        "id": "DOC-OISD-004",
        "title": "OISD Standard 105 — Work Permit System",
        "source_type": "Regulatory Reference",
        "source_reference": "OISD-STD-105 Section 4",
        "content": """
OISD Standard 105 — Work Permit System (Relevant Excerpt)

Section 4: Special Precautions for Hot Work

4.1 Hot work permits shall not be issued when atmospheric concentration of flammable vapours/gases in the area exceeds 10% of LEL.

4.2 For H2S environments, hot work shall not be permitted when H2S concentration exceeds 5 ppm at the work site.

4.3 Before issuing a hot work permit in H2S service areas, the permit issuer shall verify:
(a) Current gas readings and trend
(b) Status of all ventilation systems in the zone
(c) Concurrent maintenance activities that may affect process containment
(d) Workers' proximity and PPE level

4.4 Permit issuers must ensure that combination of operational conditions does not create unacceptable risk even if individual parameters are within limits.

Note: Compound or synergistic risks (e.g., rising gas + degraded ventilation + ignition source) must be assessed holistically, not parameter by parameter.
""",
        "embedding": None
    },
]

# ── SCENARIO TIMELINE (deterministic replay) ──────────────────
# Each step: time_offset_seconds, events to emit
SCENARIO_STEPS = [
    {
        "t": 0,
        "label": "Normal operations",
        "events": [
            {"type": "sensor_reading", "sensor_id": "SEN-H2S-01", "value": 1.2, "status": "normal"},
            {"type": "sensor_reading", "sensor_id": "SEN-H2S-02", "value": 0.8, "status": "normal"},
            {"type": "sensor_reading", "sensor_id": "SEN-TEMP-01", "value": 38.5, "status": "normal"},
            {"type": "sensor_reading", "sensor_id": "SEN-PRES-01", "value": 44.2, "status": "normal"},
            {"type": "sensor_reading", "sensor_id": "SEN-VENT-01", "value": 2050, "status": "degraded"},
            {"type": "sensor_reading", "sensor_id": "SEN-LEL-01", "value": 1.1, "status": "normal"},
        ]
    },
    {
        "t": 5,
        "label": "H2S begins rising",
        "events": [
            {"type": "sensor_reading", "sensor_id": "SEN-H2S-01", "value": 2.8, "status": "normal"},
            {"type": "sensor_reading", "sensor_id": "SEN-H2S-02", "value": 1.9, "status": "normal"},
            {"type": "sensor_reading", "sensor_id": "SEN-VENT-01", "value": 1980, "status": "degraded"},
        ]
    },
    {
        "t": 10,
        "label": "Workers moving toward C-12",
        "events": [
            {"type": "sensor_reading", "sensor_id": "SEN-H2S-01", "value": 4.1, "status": "normal"},
            {"type": "sensor_reading", "sensor_id": "SEN-H2S-02", "value": 3.2, "status": "normal"},
            {"type": "sensor_reading", "sensor_id": "SEN-VENT-01", "value": 1920, "status": "degraded"},
            {"type": "worker_location_updated", "worker_id": "W-001", "zone_id": "Z-02", "x": 275, "y": 200},
            {"type": "worker_location_updated", "worker_id": "W-002", "zone_id": "Z-02", "x": 295, "y": 215},
        ]
    },
    {
        "t": 16,
        "label": "H2S rising faster — compound risk emerging",
        "events": [
            {"type": "sensor_reading", "sensor_id": "SEN-H2S-01", "value": 5.9, "status": "warning"},
            {"type": "sensor_reading", "sensor_id": "SEN-H2S-02", "value": 4.7, "status": "normal"},
            {"type": "sensor_reading", "sensor_id": "SEN-VENT-01", "value": 1850, "status": "degraded"},
            {"type": "sensor_reading", "sensor_id": "SEN-LEL-01", "value": 3.4, "status": "normal"},
            {"type": "worker_location_updated", "worker_id": "W-001", "zone_id": "Z-01", "x": 355, "y": 240},
            {"type": "worker_location_updated", "worker_id": "W-002", "zone_id": "Z-01", "x": 370, "y": 255},
        ]
    },
    {
        "t": 20,
        "label": "AEGIS PLANT: COMPOUND RISK DETECTED — CRITICAL",
        "events": [
            {"type": "sensor_reading", "sensor_id": "SEN-H2S-01", "value": 7.3, "status": "warning"},
            {"type": "sensor_reading", "sensor_id": "SEN-H2S-02", "value": 6.1, "status": "warning"},
            {"type": "sensor_reading", "sensor_id": "SEN-VENT-01", "value": 1780, "status": "alarm"},
            {"type": "sensor_reading", "sensor_id": "SEN-LEL-01", "value": 5.2, "status": "normal"},
            {"type": "risk_alert_created", "alert_id": "ALT-001", "severity": "critical", "score": 92},
        ]
    },
]

# ── AUDIT LOG SEED ─────────────────────────────────────────────
AUDIT_SEED = [
    {
        "id": "AEV-001",
        "timestamp": "2026-07-22T10:00:00Z",
        "actor_type": "human",
        "actor_id": "W-005",
        "actor_name": "Deepak Singh (Shift Supervisor)",
        "event_type": "permit_issued",
        "payload": {"permit_id": "PTW-481", "type": "Hot Work", "zone": "Z-02"},
        "description": "Hot work permit PTW-481 issued for Zone Z-02. Gas test at 09:45: H2S 1.2 ppm. All controls verified."
    },
    {
        "id": "AEV-002",
        "timestamp": "2026-07-22T07:30:00Z",
        "actor_type": "cmms",
        "actor_id": "CMMS",
        "actor_name": "Maintenance CMMS",
        "event_type": "work_order_created",
        "payload": {"work_order_id": "WO-2847", "equipment": "V-07", "status": "in-progress"},
        "description": "Work order WO-2847 opened for V-07 blade bearing replacement. Ventilation operating at 40% capacity."
    },
]
