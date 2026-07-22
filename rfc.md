# RFC: Aegis Plant - AI-Powered Industrial Safety Intelligence Platform

## 1. Project Overview

Build a production-style hackathon prototype called **Aegis Plant**.

Aegis Plant is an AI-powered industrial safety command centre that detects dangerous combinations of operational conditions before they become incidents. It combines simulated IoT/SCADA sensor streams, work permits, maintenance status, worker location, CCTV/PPE signals, historical near-miss reports, and safety procedures into one explainable risk view.

The product must not be a generic dashboard or chatbot. Its core value is identifying **compound risk**: situations where no individual signal is severe enough to trigger an alarm, but their combination creates a high-risk scenario.

### One-line pitch

Aegis Plant detects hazardous combinations across industrial operations and gives safety teams the evidence and workflow to prevent incidents before workers enter danger.

## 2. Primary Demo Scenario

The entire prototype should be optimized around one high-impact scenario:

A maintenance team has an active **hot-work permit** near Compressor C-12. H₂S gas readings are rising but remain below the conventional single-sensor alarm threshold. A maintenance ticket shows ventilation equipment is degraded. Two workers are approaching the restricted area.

Aegis Plant must:

1. Ingest the changing conditions through a replayable simulation.
2. Detect the compound risk.
3. Highlight the affected plant zone and exposed workers on a map.
4. Explain why the situation is dangerous.
5. Retrieve relevant safety procedure and near-miss evidence.
6. Recommend a specific intervention: hold the permit, isolate the zone, ventilate, and dispatch a response team.
7. Require a supervisor approval before action.
8. Record all evidence and actions in an audit trail.
9. Show risk reduction after the intervention.

## 3. Target Users

- Safety Officer
- Shift Supervisor
- Control Room Operator
- Maintenance Manager
- Emergency Response Coordinator
- Plant Head / Compliance Auditor

## 4. Product Goals

### Core goals

- Detect compound risk earlier than basic sensor-threshold alerts.
- Give the user an understandable explanation, not a black-box score.
- Show the people, permits, equipment, and location affected by the risk.
- Recommend an actionable intervention.
- Demonstrate human-in-the-loop safety governance.
- Maintain an auditable event timeline.

### Non-goals for prototype

- Do not connect to real SCADA or OT systems.
- Do not autonomously shut down equipment.
- Do not claim real regulatory certification.
- Do not build a full computer-vision training pipeline.
- Do not attempt multiple industrial use cases before the primary scenario works perfectly.

## 5. Functional Requirements

### 5.1 Safety Command Centre

Build a responsive web application with the following main views:

1. **Live Operations Dashboard**
   - Current plant risk score.
   - Number of active permits.
   - Number of workers in elevated-risk zones.
   - Active alerts by severity.
   - Sensor trend summary.

2. **Interactive Plant Map**
   - Simplified 2D industrial plant layout.
   - Zones such as Compressor C-12, hot-work area, confined-space area, control room, and evacuation assembly point.
   - Worker locations.
   - Equipment markers.
   - Active permits.
   - Dynamic heatmap or risk-zone overlay.
   - Clicking an object opens contextual details.

3. **Compound Risk Alert Panel**
   - Severity: Low, Medium, High, Critical.
   - Compound-risk score from 0 to 100.
   - Confidence score.
   - Contributing conditions.
   - Affected workers.
   - Affected permits and equipment.
   - Recommended action.
   - Estimated risk reduction after recommended action.

4. **Risk Explanation View**
   - Human-readable explanation, for example:

     “Critical compound risk detected near Compressor C-12. Rising H₂S concentration, an active hot-work permit, degraded ventilation status, and worker presence create an elevated ignition and exposure risk. Similar conditions were present in two previous near-miss events.”

   - Evidence timeline.
   - Sensor readings.
   - Permit details.
   - Maintenance status.
   - Relevant procedure and incident citations.

5. **Intervention Approval Workflow**
   - Safety officer can approve, reject, or escalate the recommendation.
   - Approval action is logged with timestamp and user identity.
   - After approval, show simulated actions:
     - Permit held
     - Workers notified
     - Zone isolated
     - Ventilation response dispatched

6. **Audit Trail**
   - Chronological timeline of all sensor events, system decisions, human actions, and generated evidence.
   - Exportable incident/evidence report as JSON or PDF-style screen.

### 5.2 Compound Risk Engine

The risk engine must combine multiple inputs instead of relying on one threshold.

Inputs:

- H₂S level
- Temperature
- Pressure
- Ventilation equipment status
- Active permit type
- Permit proximity to hazard zone
- Worker presence in risk zone
- Maintenance activity
- Shift handover status
- PPE compliance signal
- Historical near-miss similarity score

Example risk rules:

- Rising H₂S alone: medium risk.
- Hot work alone: medium risk.
- Worker presence alone: low risk.
- Rising H₂S + active hot work + worker proximity + failed/degraded ventilation: critical risk.
- Expired or incomplete permit during abnormal process conditions: high risk.
- Missing PPE in a hazardous zone: high risk.

The system should produce:

```json
{
  "risk_score": 92,
  "severity": "critical",
  "confidence": 0.91,
  "lead_time_minutes": 18,
  "contributing_factors": [
    "H2S concentration rising for 12 minutes",
    "Active hot-work permit PTW-481",
    "Ventilation asset V-07 marked degraded",
    "Two workers entering exposure radius"
  ],
  "recommended_actions": [
    "Hold permit PTW-481",
    "Restrict access to Zone C-12",
    "Dispatch gas-response team",
    "Verify ventilation asset V-07"
  ]
}
```

The initial implementation may use weighted rules and deterministic scoring. Design it so a future anomaly-detection or ML model can replace or enhance the scoring layer.

### 5.3 RAG Safety Copilot

Implement a cited safety knowledge assistant.

It should answer questions such as:

- “Why is this alert critical?”
- “What procedure applies to hot work near gas risk?”
- “Show similar historical near misses.”
- “What must the supervisor verify before releasing the permit?”

Use a small local knowledge base containing:

- Safety Operating Procedures
- Hot-work permit guidance
- Emergency response checklist
- Historical near-miss reports
- Simplified OISD/Factory Act style requirements

Every answer must include source citations linking to the stored source document and section.

Do not allow the LLM to make the final operational risk decision. The risk engine must remain deterministic and auditable.

## 6. Recommended Technology Stack

### Frontend

- Next.js with TypeScript
- Tailwind CSS
- shadcn/ui or equivalent component library
- Recharts for telemetry charts
- React Leaflet, SVG, or a custom canvas for plant map visualization
- WebSockets for live simulation updates

### Backend

- Python FastAPI
- Pydantic for validation
- REST APIs for data retrieval and actions
- WebSocket endpoint for simulation stream
- Background task for scenario playback

### Data

- PostgreSQL for permits, workers, incidents, actions, and audit events
- TimescaleDB extension or PostgreSQL tables for time-series sensor data
- pgvector for RAG embeddings
- Optional Neo4j for the industrial knowledge graph
- Local JSON seed data is acceptable for hackathon prototype mode

### AI

- Rule-based compound risk engine first
- Optional Isolation Forest or simple anomaly model for sensor trend anomalies
- OpenAI-compatible LLM provider for explanation and RAG
- Embeddings stored in pgvector
- Retrieval results with document metadata and source citations

### Deployment

- Docker Compose for local setup
- Frontend deployed to Vercel or equivalent
- Backend deployed to Railway, Render, AWS, Azure, or equivalent
- PostgreSQL managed service or Docker for prototype deployment

## 7. Data Model

### Core entities

```text
PlantZone
- id
- name
- polygon_coordinates
- hazard_classification
- max_occupancy

Equipment
- id
- name
- type
- zone_id
- operational_status
- maintenance_status

Sensor
- id
- equipment_id
- zone_id
- sensor_type
- unit
- normal_range

SensorReading
- id
- sensor_id
- timestamp
- value
- quality_flag

Worker
- id
- name
- role
- current_zone_id
- ppe_status

WorkPermit
- id
- permit_number
- permit_type
- zone_id
- status
- start_time
- end_time
- approved_by
- controls

MaintenanceWorkOrder
- id
- equipment_id
- status
- priority
- description
- created_at

RiskAlert
- id
- severity
- score
- confidence
- status
- created_at
- explanation
- recommended_actions

Intervention
- id
- alert_id
- action_type
- status
- approved_by
- approved_at
- result

KnowledgeDocument
- id
- title
- content
- source_type
- source_reference
- embedding

AuditEvent
- id
- timestamp
- actor_type
- actor_id
- event_type
- payload
```

## 8. API Requirements

### Read APIs

```text
GET /api/dashboard/summary
GET /api/plant/zones
GET /api/equipment
GET /api/workers
GET /api/permits
GET /api/sensors/readings
GET /api/alerts
GET /api/alerts/{id}
GET /api/audit-events
GET /api/knowledge/search?q=
```

### Action APIs

```text
POST /api/simulation/start
POST /api/simulation/reset
POST /api/alerts/{id}/approve
POST /api/alerts/{id}/reject
POST /api/alerts/{id}/escalate
POST /api/permits/{id}/hold
POST /api/interventions
POST /api/copilot/query
```

### Live updates

```text
WS /ws/plant-events
```

WebSocket events should include:

- sensor_reading_created
- worker_location_updated
- permit_status_changed
- risk_alert_created
- intervention_approved
- risk_score_updated

## 9. User Experience Requirements

The interface should feel like an operational command centre, not a generic admin dashboard.

Visual direction:

- Dark industrial control-room theme
- High contrast and accessible typography
- Green / amber / red only for meaningful safety status
- Large, immediately visible critical-risk panel
- Clear action buttons for supervisor workflows
- Avoid overwhelming charts or clutter
- Every AI recommendation should show “Why?” and “Evidence” controls

Critical demo interaction:

1. User starts the incident simulation.
2. Dashboard shows normal conditions.
3. Signals gradually deteriorate.
4. Map displays rising risk around Compressor C-12.
5. System creates a critical compound-risk alert.
6. User opens alert and sees evidence.
7. User approves “Hold Permit and Isolate Zone.”
8. Map and risk score update.
9. Audit log proves the intervention and avoided exposure.

## 10. Evaluation Metrics

Display these metrics in the UI and pitch:

- Compound-risk detection lead time
- Lead-time advantage over gas-threshold baseline
- Number of exposed workers identified
- Number of conflicting permits detected
- Estimated exposure-minutes avoided
- Risk score before and after intervention
- Alert explanation confidence
- Safety procedure retrieval citation accuracy
- Time from detection to supervisor decision

Example:

```text
Threshold-only alert lead time: 0 minutes
Aegis Plant detection lead time: 18 minutes
Exposed workers identified: 2
Permit conflict identified: 1
Estimated exposure-minutes avoided: 36
```

## 11. Security and Governance

- Use role-based access: operator, supervisor, safety officer, administrator.
- Require supervisor approval for any simulated intervention.
- Log every model output and user action.
- Include confidence scores and source evidence.
- Clearly label all demo/synthetic data.
- Do not provide uncontrolled automatic shutdown actions.
- Keep the product positioned as decision support and workflow orchestration.

## 12. Delivery Plan

### Phase 1: Foundation

- Create frontend and backend scaffold.
- Seed plant layout, workers, sensors, equipment, and permits.
- Create static dashboard and map.
- Add scenario reset/start controls.

### Phase 2: Simulation

- Create deterministic incident replay.
- Stream sensor, worker, permit, and maintenance changes.
- Update charts and map in real time.

### Phase 3: Risk Intelligence

- Implement weighted compound-risk engine.
- Generate risk alerts and explanations.
- Build evidence timeline and intervention recommendations.

### Phase 4: Knowledge Intelligence

- Add small safety document corpus.
- Add embeddings, retrieval, and cited copilot responses.
- Link relevant procedure and historical near-miss evidence to alerts.

### Phase 5: Demo Readiness

- Build supervisor approval workflow.
- Build audit trail.
- Add baseline-versus-Aegis comparison.
- Add robust reset button for reliable repeatable demos.
- Validate the entire narrative in under three minutes.

## 13. Definition of Done

The project is complete when:

- A user can start a plant incident simulation.
- The platform visibly detects a compound hazard before a simple threshold breach.
- The plant map identifies the risk zone, relevant permit, equipment, and workers.
- The alert explains the contributing evidence.
- The user can retrieve safety guidance with citations.
- The supervisor can approve a recommended intervention.
- The simulated intervention reduces the displayed risk.
- Every event is visible in the audit log.
- The application runs locally through Docker Compose or documented setup steps.
- The demo can be reliably performed in three minutes without manual data edits.

## 14. Build Instructions for AI

Build this as a polished full-stack application. Prioritize the primary demo scenario and visual clarity over broad feature coverage. Use realistic but clearly labelled synthetic industrial data. Keep AI outputs explainable, cited, and constrained by deterministic safety logic. Do not create a generic chatbot-first application; the central experience must be a live, evidence-backed industrial risk command centre.