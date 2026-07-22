# Aegis Plant 🛡️

**AI-Powered Industrial Safety Intelligence Platform**

AegisPlant is an advanced industrial plant simulation and dashboard platform designed to dynamically model, monitor, and mitigate operational risks in real-time. By aggregating various data streams—including IoT sensor readings (e.g., H₂S gas levels, ventilation flow rates), real-time worker geolocation, and active Permit-to-Work (PTW) statuses—AegisPlant computes a compound risk score using a deterministic risk engine. 

It detects hazardous compound risk combinations across industrial operations and gives safety teams the evidence and workflow to prevent incidents before workers enter danger.

## 🚀 Quick Start

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

### Optional: LLM-powered Copilot
Add your key to `backend/.env`:
```
GEMINI_API_KEY=your_key_here
```

---

## 🎬 Demo Walkthrough (3 minutes)

**Scenario: Compressor C-12 — Compound Risk Incident**

1. Open app at http://localhost:3000
2. Click **"▶ Start Incident Sim"** in the sidebar
3. Watch the **Dashboard** — H₂S rises, risk score climbs
4. Switch to **Plant Map** — see workers entering the risk zone (animated red pulse)
5. When risk hits ~92, a **CRITICAL alert** fires and the top banner appears
6. Switch to **Risk Alerts** — read the compound-risk explanation and near-miss evidence
7. Click **"✅ Approve & Execute"** as Shift Supervisor
8. Watch risk score drop, permit held, zone restricted in audit trail
9. Open **Safety Copilot** and ask: *"Why is this alert critical?"*
10. Switch to **Audit Trail** — see the complete immutable timeline

---

## 🏗️ Architecture

```
Aegis Plant
├── frontend/          Next.js 14 + TypeScript + Tailwind CSS
│   ├── app/           Pages and layout
│   └── components/    Dashboard, PlantMap, AlertPanel, Copilot, AuditLog
│
└── backend/           Python FastAPI
    ├── main.py        App + WebSocket manager
    ├── seed_data.py   Synthetic plant, sensor, worker, permit data
    ├── risk_engine.py Compound risk scoring (rule-based, pluggable)
    ├── simulation_engine.py  Deterministic incident replay
    └── routers/       dashboard, plant, alerts, simulation, copilot, audit
```

## 🧠 Key Features

| Feature | Description |
|---|---|
| **Compound Risk Engine** | Weighted rule-based scoring across 6 risk dimensions — detects risk 18 min before threshold alarm |
| **Live Plant Map** | SVG-based interactive map with animated risk zones, worker tracking, equipment status |
| **Evidence-based Alerts** | Each alert shows contributing factors, near-miss matches, policy citations, projected outcomes |
| **Human-in-the-Loop** | Supervisor approval required before any intervention. Action logged immutably. |
| **RAG Safety Copilot** | Citations from safety SOPs, emergency procedures, and near-miss reports. Gemini/OpenAI optional. |
| **Audit Trail** | Complete chronological event log of sensor readings, agent decisions, and human actions |

## 📊 Demo Metrics

```
Threshold-only alert lead time:    0 minutes (fires at 10 ppm H₂S)
Aegis Plant detection lead time:   18 minutes earlier (compound risk)
Workers identified at risk:        2
Active permits flagged:            1 (PTW-481)
Exposure-minutes avoided:          36
Risk score before intervention:    92/100
Risk score after intervention:     ~22/100
```

---

*All data is synthetic and clearly labelled. Aegis Plant is decision-support software — all safety decisions require qualified human verification.*
