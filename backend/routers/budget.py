from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import Budget, Project
from services.optimization_service import optimize_budget

router = APIRouter(prefix="/budget", tags=["budget"])


@router.get("/")
def get_budget(db: Session = Depends(get_db)):
    """Get current MPLADS budget status."""
    budget = db.query(Budget).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget record not found")
    return {
        "id": budget.id,
        "mp_name": budget.mp_name,
        "constituency": budget.constituency,
        "fiscal_year": budget.fiscal_year,
        "total_allocation_lakhs": budget.total_allocation_lakhs,
        "amount_used_lakhs": budget.amount_used_lakhs,
        "amount_remaining_lakhs": budget.amount_remaining_lakhs,
        "notes": budget.notes,
        "data_source": budget.data_source,
    }


@router.post("/optimize")
def optimize_budget_allocation(
    available_budget_lakhs: float = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    """
    Run the PuLP knapsack optimizer to select the best project mix within budget.

    This uses integer linear programming — NOT an LLM.
    """
    if available_budget_lakhs <= 0:
        raise HTTPException(status_code=400, detail="Budget must be positive")

    projects = db.query(Project).filter(Project.status == "proposed").all()
    project_dicts = [
        {
            "id": p.id,
            "name": p.name,
            "net_cost_lakhs": p.net_cost_lakhs or p.estimated_cost_lakhs,
            "estimated_cost_lakhs": p.estimated_cost_lakhs,
            "priority_score": p.priority_score,
        }
        for p in projects
    ]

    result = optimize_budget(project_dicts, available_budget_lakhs)

    # Fetch funded project details
    funded_ids = result["funded_project_ids"]
    funded_projects = db.query(Project).filter(Project.id.in_(funded_ids)).all() if funded_ids else []

    result["funded_projects"] = [
        {
            "id": p.id, "name": p.name, "category": p.category,
            "net_cost_lakhs": p.net_cost_lakhs, "priority_score": p.priority_score,
            "ward_name": p.ward.name if p.ward else None,
        }
        for p in funded_projects
    ]

    # Update is_funded flags in DB
    db.query(Project).update({"is_funded": False})
    if funded_ids:
        db.query(Project).filter(Project.id.in_(funded_ids)).update({"is_funded": True})
    db.commit()

    return result


@router.put("/")
def update_budget(
    amount_used_lakhs: float = Body(..., embed=True),
    db: Session = Depends(get_db),
):
    """Update the amount used from the MPLADS budget."""
    budget = db.query(Budget).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    budget.amount_used_lakhs = amount_used_lakhs
    budget.amount_remaining_lakhs = budget.total_allocation_lakhs - amount_used_lakhs
    db.commit()
    db.refresh(budget)
    return {"message": "Budget updated", "amount_remaining_lakhs": budget.amount_remaining_lakhs}
