"""
Clustering Service — DBSCAN Hotspot Detection

Uses scikit-learn DBSCAN on complaint geo-coordinates to identify
geographic concentrations of demand (hotspots).

This is classical ML — NOT an LLM.
"""
from typing import List, Dict, Any

import numpy as np

try:
    from sklearn.cluster import DBSCAN
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


def detect_hotspots(
    complaints: List[Dict[str, Any]],
    eps_km: float = 0.5,       # neighborhood radius in km
    min_samples: int = 2,      # minimum complaints to form a cluster
) -> Dict[str, Any]:
    """
    Run DBSCAN clustering on complaint coordinates.

    Args:
        complaints: list of complaint dicts with lat, lng, issue_category, ward_id
        eps_km: DBSCAN epsilon in kilometers (converted to degrees internally)
        min_samples: minimum samples to form a core point

    Returns:
        {
            clusters: [{cluster_id, complaint_ids, center_lat, center_lng,
                        dominant_category, complaint_count, ward_ids}],
            noise_complaint_ids: [int],
            algorithm: str,
        }
    """
    # Filter to complaints with valid coordinates
    valid = [c for c in complaints if c.get("lat") and c.get("lng")]

    if len(valid) < 2:
        return {"clusters": [], "noise_complaint_ids": [c.get("id") for c in complaints], "algorithm": "DBSCAN (insufficient data)"}

    coords = np.array([[c["lat"], c["lng"]] for c in valid])

    if SKLEARN_AVAILABLE:
        # Convert km to degrees (rough approximation: 1 deg ≈ 111 km)
        eps_deg = eps_km / 111.0
        db = DBSCAN(eps=eps_deg, min_samples=min_samples, metric="euclidean").fit(coords)
        labels = db.labels_
        algorithm = f"scikit-learn DBSCAN (eps={eps_km}km, min_samples={min_samples})"
    else:
        # Naive fallback: group complaints by ward
        labels = np.array([c.get("ward_id", -1) for c in valid])
        algorithm = "Ward-based grouping (scikit-learn unavailable)"

    unique_labels = set(labels)
    clusters = []

    for label in sorted(unique_labels):
        if label == -1:
            continue  # noise

        mask = labels == label
        cluster_complaints = [valid[i] for i in range(len(valid)) if mask[i]]

        center_lat = float(np.mean([c["lat"] for c in cluster_complaints]))
        center_lng = float(np.mean([c["lng"] for c in cluster_complaints]))

        # Dominant category
        categories = [c.get("issue_category", "unknown") for c in cluster_complaints]
        dominant_category = max(set(categories), key=categories.count)

        ward_ids = list(set(c.get("ward_id") for c in cluster_complaints if c.get("ward_id")))

        clusters.append({
            "cluster_id": int(label),
            "complaint_ids": [c["id"] for c in cluster_complaints if "id" in c],
            "center_lat": round(center_lat, 6),
            "center_lng": round(center_lng, 6),
            "dominant_category": dominant_category,
            "complaint_count": len(cluster_complaints),
            "ward_ids": ward_ids,
            "severity": "high" if len(cluster_complaints) >= 4 else "medium" if len(cluster_complaints) >= 2 else "low",
        })

    noise_ids = [valid[i]["id"] for i in range(len(valid)) if labels[i] == -1 and "id" in valid[i]]

    return {
        "clusters": sorted(clusters, key=lambda x: x["complaint_count"], reverse=True),
        "noise_complaint_ids": noise_ids,
        "total_complaints_analyzed": len(valid),
        "algorithm": algorithm,
    }


def get_ward_demand_heatmap(
    complaints: List[Dict[str, Any]],
    wards: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Aggregate complaint counts and urgency per ward for heatmap rendering.
    """
    from collections import defaultdict, Counter

    ward_data: Dict[int, dict] = defaultdict(lambda: {"count": 0, "urgencies": [], "categories": []})

    for c in complaints:
        wid = c.get("ward_id")
        if wid:
            ward_data[wid]["count"] += 1
            ward_data[wid]["urgencies"].append(c.get("urgency", "medium"))
            ward_data[wid]["categories"].append(c.get("issue_category", "other"))

    URGENCY_SCORE = {"critical": 4, "high": 3, "medium": 2, "low": 1}

    result = []
    for ward in wards:
        wid = ward["id"]
        data = ward_data[wid]
        urgency_score = (
            sum(URGENCY_SCORE.get(u, 2) for u in data["urgencies"]) / max(len(data["urgencies"]), 1)
        )
        categories = Counter(data["categories"])
        result.append({
            "ward_id": wid,
            "ward_name": ward["name"],
            "complaint_count": data["count"],
            "avg_urgency_score": round(urgency_score, 2),
            "top_categories": dict(categories.most_common(3)),
            "heat_intensity": min(1.0, data["count"] / 5.0),  # normalize to 0-1 for map
        })

    return sorted(result, key=lambda x: x["complaint_count"], reverse=True)
