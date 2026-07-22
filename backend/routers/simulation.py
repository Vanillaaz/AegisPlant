import asyncio
from fastapi import APIRouter, BackgroundTasks
from fastapi.requests import Request

router = APIRouter()

@router.post("/start")
async def start_simulation(request: Request, background_tasks: BackgroundTasks):
    sim = request.app.state.sim_engine
    manager = request.app.state.ws_manager

    sim.set_broadcaster(manager.broadcast)

    sim.start()

    return {"status": "started", "message": "Incident simulation started. Watch plant map for changes."}

@router.post("/reset")
async def reset_simulation(request: Request):
    sim = request.app.state.sim_engine
    sim.reset()
    return {"status": "reset", "message": "Simulation reset to normal operating conditions."}

@router.get("/state")
async def get_state(request: Request):
    sim = request.app.state.sim_engine
    return {
        "running": sim.running,
        "step_index": sim.step_index,
        "intervention_applied": sim.intervention_applied,
        "current_risk": sim.current_risk,
    }
