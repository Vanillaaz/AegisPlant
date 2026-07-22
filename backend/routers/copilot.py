from fastapi import APIRouter
from fastapi.requests import Request
from pydantic import BaseModel
from seed_data import SAFETY_DOCUMENTS, NEAR_MISSES
import os
import json

router = APIRouter()

class CopilotQuery(BaseModel):
    question: str
    alert_context: dict = {}

def simple_retrieval(question: str, top_k: int = 3) -> list[dict]:
    """Keyword-based retrieval fallback (no embedding service required)."""
    q_lower = question.lower()
    keywords = {
        "hot work": ["DOC-SOP-HW-001", "DOC-OISD-004"],
        "h2s": ["DOC-SOP-GAS-002", "DOC-SOP-HW-001"],
        "ventilation": ["DOC-SOP-VENT-003", "DOC-SOP-HW-001"],
        "permit": ["DOC-SOP-HW-001", "DOC-OISD-004"],
        "near miss": [],
        "emergency": ["DOC-SOP-GAS-002"],
        "supervisor": ["DOC-SOP-GAS-002", "DOC-OISD-004"],
        "procedure": ["DOC-SOP-HW-001", "DOC-SOP-VENT-003"],
        "evacuat": ["DOC-SOP-GAS-002"],
        "critical": ["DOC-SOP-GAS-002", "DOC-SOP-HW-001"],
    }

    doc_ids = set()
    for kw, ids in keywords.items():
        if kw in q_lower:
            doc_ids.update(ids)

    if not doc_ids:
        doc_ids = {SAFETY_DOCUMENTS[0]["id"], SAFETY_DOCUMENTS[1]["id"]}

    results = [doc for doc in SAFETY_DOCUMENTS if doc["id"] in doc_ids][:top_k]
    return results

def build_context_prompt(question: str, docs: list[dict], alert_context: dict) -> str:
    ctx_parts = []
    for doc in docs:
        ctx_parts.append(f"=== {doc['title']} [{doc['source_reference']}] ===\n{doc['content'][:1500]}")

    # Add near-miss context if relevant
    if "near miss" in question.lower() or "similar" in question.lower() or "history" in question.lower():
        for nm in NEAR_MISSES[:2]:
            ctx_parts.append(f"=== Near Miss Report {nm['id']} ({nm['date']}) ===\n{nm['description']}")

    alert_summary = ""
    if alert_context:
        score = alert_context.get("risk_score", "N/A")
        factors = alert_context.get("contributing_factors", [])
        alert_summary = f"\nCurrent Alert Context:\n- Risk Score: {score}\n- Contributing Factors: {chr(10).join(f'  * {f}' for f in factors)}"

    system = """You are Aegis Safety Copilot, an industrial safety knowledge assistant.
Answer questions using ONLY the provided safety documents and near-miss reports.
Always cite the source document and section number.
Never make the final operational safety decision — always recommend supervisor verification.
Format: Answer, then [Sources: doc title, section].
Keep answers concise and actionable."""

    return f"""{system}

{chr(10).join(ctx_parts)}
{alert_summary}

Question: {question}

Answer (cite your sources):"""

@router.post("/query")
async def copilot_query(payload: CopilotQuery, request: Request):
    docs = simple_retrieval(payload.question)

    # Try LLM if API key available
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY")

    if api_key and os.getenv("GEMINI_API_KEY"):
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.0-flash")
            prompt = build_context_prompt(payload.question, docs, payload.alert_context)
            response = model.generate_content(prompt)
            answer = response.text
        except Exception as e:
            answer = _fallback_answer(payload.question, docs)
    elif api_key and os.getenv("OPENAI_API_KEY"):
        try:
            import openai
            openai.api_key = api_key
            prompt = build_context_prompt(payload.question, docs, payload.alert_context)
            resp = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
            )
            answer = resp.choices[0].message.content
        except Exception as e:
            answer = _fallback_answer(payload.question, docs)
    else:
        answer = _fallback_answer(payload.question, docs)

    citations = [{"id": d["id"], "title": d["title"], "reference": d["source_reference"]} for d in docs]

    return {
        "answer": answer,
        "citations": citations,
        "retrieval_count": len(docs),
    }

def _fallback_answer(question: str, docs: list[dict]) -> str:
    q = question.lower()

    if "why" in q and "critical" in q:
        return (
            "This alert is classified CRITICAL because multiple compound risk factors are simultaneously present: "
            "(1) H₂S concentration is rising continuously, (2) an active hot-work permit PTW-481 creates an ignition source "
            "within the H₂S exposure radius, (3) ventilation V-07 is operating at only ~40% capacity — far below the 80% minimum "
            "required by ENG-STD-VENT-003 before hot work can proceed, and (4) two workers are physically present in the exposure zone. "
            "No single factor alone would trigger a threshold alarm, but their combination creates a critical compound hazard. "
            "OISD-STD-105 Section 4.4 explicitly requires holistic assessment of compound/synergistic risks."
        )
    elif "procedure" in q or "hot work" in q:
        return (
            "Per SOP-HSE-HW-001 §3.1, hot work must not proceed simultaneously with any maintenance activity "
            "that reduces ventilation effectiveness in the same zone. §4.2 requires immediate work suspension "
            "if H₂S exceeds 5 ppm. Current conditions satisfy both suspension criteria. "
            "Supervisor action: Hold permit PTW-481, evacuate zone, restore ventilation."
        )
    elif "near miss" in q or "similar" in q or "histor" in q:
        return (
            "Two closely matching near-miss events were identified: "
            "NM-2024-047 (similarity 94%): H₂S accumulation near C-09 during hot work with degraded ventilation — "
            "workers evacuated when portable monitor alarmed at 7 ppm. Root cause: concurrent maintenance on ventilation "
            "and hot work without compound-risk assessment. "
            "NM-2025-008 (similarity 88%): Hot work permitted while ventilation was degraded — condition discovered "
            "during pre-job safety meeting, work delayed 3 hours."
        )
    elif "supervisor" in q or "verify" in q or "before" in q:
        return (
            "Before releasing permit PTW-481, the supervisor must verify: "
            "(1) H₂S readings are below 2 ppm at the work site (SOP-HSE-HW-001 §2.2), "
            "(2) Ventilation V-07 is operating at ≥80% rated capacity or independent forced ventilation is provided (§2.3), "
            "(3) No concurrent maintenance is reducing ventilation effectiveness in Zone C-12 (§3.1), "
            "(4) A fresh gas test has been performed within the last 30 minutes (OISD-STD-105 §4.3)."
        )
    else:
        # Return snippet from first doc
        if docs:
            snippet = docs[0]["content"][:400].strip()
            return f"Based on {docs[0]['title']} [{docs[0]['source_reference']}]:\n\n{snippet}..."
        return "Please consult the relevant safety procedure for this situation. Safety Officer verification is required."


@router.get("/search")
async def knowledge_search(q: str):
    results = simple_retrieval(q)
    return {"documents": [{"id": d["id"], "title": d["title"], "reference": d["source_reference"]} for d in results]}
