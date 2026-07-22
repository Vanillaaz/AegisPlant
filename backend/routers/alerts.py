from fastapi import APIRouter, HTTPException
from fastapi.requests import Request
from pydantic import BaseModel

router = APIRouter()

class ApprovalPayload(BaseModel):
    approved_by: str
    approved_by_name: str = "Shift Supervisor"
    note: str = ""

class RejectionPayload(BaseModel):
    rejected_by: str
    reason: str

@router.get("")
async def get_alerts(request: Request):
    sim = request.app.state.sim_engine
    return {"alerts": sim.alerts}

@router.get("/{alert_id}")
async def get_alert(alert_id: str, request: Request):
    sim = request.app.state.sim_engine
    for a in sim.alerts:
        if a["id"] == alert_id:
            return a
    raise HTTPException(status_code=404, detail="Alert not found")

@router.post("/{alert_id}/approve")
async def approve_alert(alert_id: str, payload: ApprovalPayload, request: Request):
    sim = request.app.state.sim_engine
    manager = request.app.state.ws_manager

    for a in sim.alerts:
        if a["id"] == alert_id:
            a["status"] = "approved"
            a["approved_by"] = payload.approved_by
            break

    result = sim.apply_intervention({
        "alert_id": alert_id,
        "action_type": "hold_permit_isolate_zone",
        "approved_by": payload.approved_by,
        "approved_by_name": payload.approved_by_name,
        "actions": [
            "Hold permit PTW-481",
            "Restrict access to Zone C-12",
            "Dispatch gas-response team",
            "Escalate V-07 work order"
        ]
    })

    await manager.broadcast({
        "event": "intervention_approved",
        "alert_id": alert_id,
        "result": result
    })

    return result

@router.post("/{alert_id}/reject")
async def reject_alert(alert_id: str, payload: RejectionPayload, request: Request):
    sim = request.app.state.sim_engine
    for a in sim.alerts:
        if a["id"] == alert_id:
            a["status"] = "rejected"
            a["rejected_by"] = payload.rejected_by
            a["rejection_reason"] = payload.reason
            break
    return {"status": "rejected", "reason": payload.reason}

@router.post("/{alert_id}/escalate")
async def escalate_alert(alert_id: str, request: Request):
    sim = request.app.state.sim_engine
    for a in sim.alerts:
        if a["id"] == alert_id:
            a["status"] = "escalated"
            break
    return {"status": "escalated"}
