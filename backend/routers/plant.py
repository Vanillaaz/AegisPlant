from fastapi import APIRouter
from fastapi.requests import Request
from seed_data import ZONES, EQUIPMENT, WORKERS, SENSORS

router = APIRouter()

@router.get("/zones")
async def get_zones():
    return {"zones": ZONES}

@router.get("/equipment")
async def get_equipment(request: Request):
    sim = request.app.state.sim_engine
    # Merge live status from sim
    result = []
    for eq in EQUIPMENT:
        eq_copy = dict(eq)
        result.append(eq_copy)
    return {"equipment": result}

@router.get("/workers")
async def get_workers(request: Request):
    sim = request.app.state.sim_engine
    return {"workers": list(sim.worker_positions.values())}

@router.get("/sensors")
async def get_sensors(request: Request):
    sim = request.app.state.sim_engine
    result = []
    for sensor in SENSORS:
        s = dict(sensor)
        history = sim.sensor_history.get(sensor["id"], [0.0])
        s["current_value"] = history[-1] if history else 0.0
        s["history"] = history[-20:]
        result.append(s)
    return {"sensors": result}

@router.get("/permits")
async def get_permits(request: Request):
    sim = request.app.state.sim_engine
    return {"permits": sim.active_permits}
