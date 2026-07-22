from fastapi import APIRouter
from fastapi.requests import Request

router = APIRouter()

@router.get("/summary")
async def get_summary(request: Request):
    sim = request.app.state.sim_engine
    return sim.get_dashboard_summary()
