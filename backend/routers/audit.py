from fastapi import APIRouter
from fastapi.requests import Request

router = APIRouter()

@router.get("")
async def get_audit_events(request: Request, limit: int = 100):
    sim = request.app.state.sim_engine
    from seed_data import AUDIT_SEED
    all_events = AUDIT_SEED + sim.audit_log
    return {"events": list(reversed(all_events))[:limit]}
