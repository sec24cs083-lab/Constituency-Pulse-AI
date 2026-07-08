from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from database import get_db
from models import Project
from services.simulation_service import simulate_delay, simulate_portfolio_delay

router = APIRouter(prefix="/simulation", tags=["simulation"])


@router.post("/delay/{project_id}")
def simulate_project_delay(
    project_id: int,
    delay_months: int = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    """
    Simulate the cost and priority impact of delaying a specific project by N months.
    Uses deterministic rule-based projection — NOT an LLM.
    """
    if not 1 <= delay_months <= 24:
        raise HTTPException(status_code=400, detail="delay_months must be between 1 and 24")

    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    return simulate_delay(
        project_id=p.id,
        project_name=p.name,
        current_score=p.priority_score,
        estimated_cost_lakhs=p.net_cost_lakhs or p.estimated_cost_lakhs,
        delay_risk=p.delay_risk,
        delay_months=delay_months,
    )


@router.post("/delay/portfolio")
def simulate_portfolio_delay_endpoint(
    project_ids: list = Body(..., embed=True),
    delay_months: int = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    """Simulate delay impact across a portfolio of projects."""
    projects = db.query(Project).filter(Project.id.in_(project_ids)).all()
    project_dicts = [
        {
            "id": p.id, "name": p.name,
            "priority_score": p.priority_score,
            "net_cost_lakhs": p.net_cost_lakhs,
            "estimated_cost_lakhs": p.estimated_cost_lakhs,
            "delay_risk": p.delay_risk,
        }
        for p in projects
    ]
    return simulate_portfolio_delay(project_dicts, delay_months)
