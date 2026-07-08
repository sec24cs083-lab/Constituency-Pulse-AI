from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import Complaint, Ward
from services.nlp_service import NLPService
from config import settings

router = APIRouter(prefix="/complaints", tags=["complaints"])
nlp = NLPService(api_key=settings.anthropic_api_key)


def _complaint_to_dict(c: Complaint) -> dict:
    return {
        "id": c.id,
        "raw_text": c.raw_text,
        "language": c.language,
        "channel": c.channel,
        "translated_text": c.translated_text,
        "issue_category": c.issue_category,
        "urgency": c.urgency,
        "sentiment": c.sentiment,
        "ward_id": c.ward_id,
        "ward_name": c.ward.name if c.ward else None,
        "lat": c.lat,
        "lng": c.lng,
        "location_name": c.location_name,
        "entities": c.entities,
        "project_id": c.project_id,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }


@router.get("/")
def list_complaints(
    ward_id: Optional[int] = None,
    category: Optional[str] = None,
    urgency: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get all complaints with optional filters."""
    query = db.query(Complaint)
    if ward_id:
        query = query.filter(Complaint.ward_id == ward_id)
    if category:
        query = query.filter(Complaint.issue_category == category)
    if urgency:
        query = query.filter(Complaint.urgency == urgency)

    complaints = query.order_by(Complaint.created_at.desc()).all()
    return {"complaints": [_complaint_to_dict(c) for c in complaints], "total": len(complaints)}


@router.post("/")
def submit_complaint(
    raw_text: str = Body(..., embed=True),
    channel: str = Body("portal", embed=True),
    ward_id: Optional[int] = Body(None, embed=True),
    lat: Optional[float] = Body(None, embed=True),
    lng: Optional[float] = Body(None, embed=True),
    location_name: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
):
    """
    Submit a new complaint. Claude classifies, extracts entities, and translates it.
    Returns the processed complaint record.
    """
    # Use Claude (or mock) to classify
    classification = nlp.classify_complaint(raw_text)

    complaint = Complaint(
        raw_text=raw_text,
        language=classification.get("language_detected", "en"),
        channel=channel,
        translated_text=classification.get("translated_text", raw_text),
        issue_category=classification.get("issue_category", "other"),
        urgency=classification.get("urgency", "medium"),
        sentiment=classification.get("sentiment", 0.0),
        entities=classification.get("entities", {}),
        ward_id=ward_id,
        lat=lat,
        lng=lng,
        location_name=location_name,
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return {
        "message": "Complaint submitted and processed",
        "complaint": _complaint_to_dict(complaint),
        "classification_source": classification.get("_source", "claude"),
    }


@router.get("/{complaint_id}")
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    c = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return _complaint_to_dict(c)
