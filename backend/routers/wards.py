from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Ward, Complaint
from services.clustering_service import detect_hotspots, get_ward_demand_heatmap

router = APIRouter(prefix="/wards", tags=["wards"])


def _ward_to_dict(w: Ward) -> dict:
    return {
        "id": w.id,
        "name": w.name,
        "constituency_name": w.constituency_name,
        "population": w.population,
        "households": w.households,
        "literacy_rate": w.literacy_rate,
        "sc_st_percentage": w.sc_st_percentage,
        "road_coverage_pct": w.road_coverage_pct,
        "water_access_pct": w.water_access_pct,
        "electricity_pct": w.electricity_pct,
        "school_count": w.school_count,
        "health_centre_count": w.health_centre_count,
        "drainage_coverage_pct": w.drainage_coverage_pct,
        "lat": w.lat,
        "lng": w.lng,
        "boundary_geojson": w.boundary_geojson,
        "complaint_count": len(w.complaints) if w.complaints else 0,
        "project_count": len(w.projects) if w.projects else 0,
    }


@router.get("/")
def list_wards(db: Session = Depends(get_db)):
    """Get all wards with demographic and infra data."""
    wards = db.query(Ward).all()
    ward_dicts = [_ward_to_dict(w) for w in wards]

    # Add demand heatmap
    all_complaints = db.query(Complaint).all()
    complaint_dicts = [
        {"id": c.id, "ward_id": c.ward_id, "urgency": c.urgency, "issue_category": c.issue_category}
        for c in all_complaints
    ]
    heatmap = get_ward_demand_heatmap(complaint_dicts, ward_dicts)
    heatmap_map = {h["ward_id"]: h for h in heatmap}

    for w in ward_dicts:
        w["heatmap"] = heatmap_map.get(w["id"], {})

    return {"wards": ward_dicts, "total": len(ward_dicts)}


@router.get("/{ward_id}")
def get_ward(ward_id: int, db: Session = Depends(get_db)):
    """Get a single ward with full details."""
    w = db.query(Ward).filter(Ward.id == ward_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Ward not found")
    return _ward_to_dict(w)


@router.get("/{ward_id}/hotspots")
def get_ward_hotspots(
    ward_id: int,
    eps_km: float = 0.5,
    min_samples: int = 2,
    db: Session = Depends(get_db),
):
    """
    Run DBSCAN clustering on complaints in this ward to detect hotspots.
    Algorithm: scikit-learn DBSCAN (not LLM).
    """
    ward = db.query(Ward).filter(Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")

    complaints = db.query(Complaint).filter(Complaint.ward_id == ward_id).all()
    complaint_dicts = [
        {
            "id": c.id, "lat": c.lat, "lng": c.lng,
            "issue_category": c.issue_category, "ward_id": c.ward_id,
            "urgency": c.urgency,
        }
        for c in complaints
    ]

    result = detect_hotspots(complaint_dicts, eps_km=eps_km, min_samples=min_samples)
    result["ward_id"] = ward_id
    result["ward_name"] = ward.name
    return result


@router.get("/hotspots/all")
def get_all_hotspots(
    eps_km: float = 0.8,
    min_samples: int = 2,
    db: Session = Depends(get_db),
):
    """
    Run DBSCAN clustering on ALL complaints across all wards.
    Used for the constituency-wide hotspot map.
    """
    complaints = db.query(Complaint).all()
    complaint_dicts = [
        {
            "id": c.id, "lat": c.lat, "lng": c.lng,
            "issue_category": c.issue_category, "ward_id": c.ward_id, "urgency": c.urgency,
        }
        for c in complaints
    ]
    return detect_hotspots(complaint_dicts, eps_km=eps_km, min_samples=min_samples)
