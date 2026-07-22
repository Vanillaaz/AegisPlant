from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import json
from datetime import datetime, timezone
from typing import Optional

from routers import dashboard, plant, simulation, alerts, interventions, copilot, audit
from simulation_engine import SimulationEngine

sim_engine = SimulationEngine()

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.sim_engine = sim_engine
    yield

app = FastAPI(
    title="Aegis Plant API",
    description="AI-powered industrial safety intelligence platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api/dashboard")
app.include_router(plant.router, prefix="/api/plant")
app.include_router(simulation.router, prefix="/api/simulation")
app.include_router(alerts.router, prefix="/api/alerts")
app.include_router(interventions.router, prefix="/api/interventions")
app.include_router(copilot.router, prefix="/api/copilot")
app.include_router(audit.router, prefix="/api/audit-events")

# ── WebSocket connection manager ──────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, data: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.active.remove(ws)

manager = ConnectionManager()
app.state.ws_manager = manager

@app.websocket("/ws/plant-events")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            # Keep alive — client can also send messages
            data = await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)

@app.get("/api/health")
async def health():
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}
