from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Scheme

router = APIRouter(prefix="/schemes", tags=["schemes"])


@router.get("/")
def list_schemes(db: Session = Depends(get_db)):
    """Get all government schemes in the database."""
    schemes = db.query(Scheme).all()
    return {
        "schemes": [
            {
                "id": s.id, "name": s.name, "short_name": s.short_name,
                "ministry": s.ministry, "description": s.description,
                "category": s.category, "funding_ceiling_lakhs": s.funding_ceiling_lakhs,
                "cofunding_pct": s.cofunding_pct,
                "eligibility_criteria": s.eligibility_criteria,
                "data_source": s.data_source,
            }
            for s in schemes
        ],
        "total": len(schemes),
        "note": "All scheme data is synthetic — structured like real GoI scheme data for demonstration.",
    }
