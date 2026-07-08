from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Project, Ward, Scheme, Complaint
from services.scoring_service import DEFAULT_WEIGHTS
import json

router = APIRouter(prefix="/projects", tags=["projects"])


def _project_to_dict(p: Project, include_complaints: bool = False) -> dict:
    d = {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "ward_id": p.ward_id,
        "ward_name": p.ward.name if p.ward else None,
        "category": p.category,
        "estimated_cost_lakhs": p.estimated_cost_lakhs,
        "matched_scheme_id": p.matched_scheme_id,
        "scheme_name": p.matched_scheme.name if p.matched_scheme else None,
        "scheme_short_name": p.matched_scheme.short_name if p.matched_scheme else None,
        "scheme_cofunding_lakhs": p.scheme_cofunding_lakhs,
        "scheme_cofunding_pct": (
            round(p.scheme_cofunding_lakhs / p.estimated_cost_lakhs * 100, 1)
            if p.estimated_cost_lakhs and p.scheme_cofunding_lakhs else 0
        ),
        "net_cost_lakhs": p.net_cost_lakhs,
        "population_affected": p.population_affected,
        "infra_evidence": p.infra_evidence,
        "infra_evidence_source": p.infra_evidence_source,
        "delay_risk": p.delay_risk,
        "priority_score": p.priority_score,
        "score_breakdown": p.score_breakdown,
        "status": p.status,
        "is_funded": p.is_funded,
        "ai_summary": p.ai_summary,
        "complaint_count": len(p.complaints) if p.complaints else 0,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }
    if include_complaints:
        d["complaints"] = [
            {
                "id": c.id, "translated_text": c.translated_text or c.raw_text,
                "urgency": c.urgency, "channel": c.channel,
                "location_name": c.location_name,
            }
            for c in (p.complaints or [])
        ]
    return d


@router.get("/")
def list_projects(
    category: Optional[str] = None,
    ward_id: Optional[int] = None,
    status: Optional[str] = None,
    min_score: Optional[float] = None,
    db: Session = Depends(get_db),
):
    """Get all projects, ranked by priority score descending."""
    query = db.query(Project)
    if category:
        query = query.filter(Project.category == category)
    if ward_id:
        query = query.filter(Project.ward_id == ward_id)
    if status:
        query = query.filter(Project.status == status)
    if min_score is not None:
        query = query.filter(Project.priority_score >= min_score)

    projects = query.order_by(Project.priority_score.desc()).all()
    return {
        "projects": [_project_to_dict(p) for p in projects],
        "total": len(projects),
        "scoring_weights": DEFAULT_WEIGHTS,
        "scoring_method": "Deterministic weighted formula (not LLM). See /docs for formula.",
    }


@router.get("/{project_id}")
def get_project(project_id: int, db: Session = Depends(get_db)):
    """Get full project detail including complaints and score breakdown."""
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")
    return _project_to_dict(p, include_complaints=True)


@router.get("/{project_id}/score-breakdown")
def get_score_breakdown(project_id: int, db: Session = Depends(get_db)):
    """Get the full explainable score breakdown for a project."""
    p = db.query(Project).filter(Project.id == project_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        "project_id": p.id,
        "project_name": p.name,
        "total_score": p.priority_score,
        "score_breakdown": p.score_breakdown,
        "weights": DEFAULT_WEIGHTS,
        "formula": "score = Σ(weight_i × normalized_factor_i) × 100",
        "note": "This score is computed by a deterministic formula, not an LLM.",
    }
