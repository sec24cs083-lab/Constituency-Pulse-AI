"""
Priority Scoring Service — DETERMINISTIC WEIGHTED FORMULA

Formula:
    score = w1*urgency_score + w2*population_score + w3*cost_efficiency_score
            + w4*delay_risk_score + w5*scheme_fundability_score

All weights are visible and configurable. This formula — NOT an LLM — produces the
priority_score. The LLM only explains scores computed here.

Weights (default):
    urgency:            0.25
    population:         0.20
    cost_efficiency:    0.20
    delay_risk:         0.20
    scheme_fundability: 0.15
"""
from typing import Dict, Any, Optional


DEFAULT_WEIGHTS = {
    "urgency": 0.25,
    "population_affected": 0.20,
    "cost_efficiency": 0.20,
    "delay_risk": 0.20,
    "scheme_fundability": 0.15,
}

URGENCY_MAP = {"low": 1.0, "medium": 2.5, "high": 4.0, "critical": 5.0}
DELAY_RISK_MAP = {"low": 1.5, "medium": 3.0, "high": 4.5}

# Population reference for normalization (max expected population per project)
MAX_POPULATION_REF = 100_000
MAX_COST_REF = 500.0  # lakhs — highest expected project cost for normalization


def compute_priority_score(
    urgency: str,
    population_affected: int,
    estimated_cost_lakhs: float,
    delay_risk: str,
    scheme_cofunding_pct: float,  # 0.0 to 1.0
    complaint_count: int = 1,
    weights: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """
    Compute a deterministic, explainable priority score for a project.

    Returns a dict with:
        - total_score: float (0–100)
        - breakdown: {factor -> {raw_value, normalized_value, weight, weighted_score, description}}
        - weights_used: the weight vector applied
    """
    w = weights or DEFAULT_WEIGHTS

    # ── Factor 1: Urgency (from complaints) ────────────────────────────────
    urgency_raw = URGENCY_MAP.get(urgency.lower(), 2.5)
    # Boost for complaint volume
    volume_boost = min(1.0, complaint_count / 10.0) * 0.5
    urgency_norm = min(5.0, urgency_raw + volume_boost) / 5.0  # 0-1

    # ── Factor 2: Population affected ─────────────────────────────────────
    pop_norm = min(1.0, population_affected / MAX_POPULATION_REF)

    # ── Factor 3: Cost efficiency (inverse of cost per person) ────────────
    if population_affected > 0 and estimated_cost_lakhs > 0:
        cost_per_person = (estimated_cost_lakhs * 100_000) / population_affected  # in ₹
        # Lower cost per person = higher score (inverse, capped)
        cost_eff_norm = max(0.0, min(1.0, 1.0 - (cost_per_person / 50_000)))
    else:
        cost_eff_norm = 0.3

    # ── Factor 4: Delay risk ───────────────────────────────────────────────
    delay_raw = DELAY_RISK_MAP.get(delay_risk.lower(), 3.0)
    delay_norm = delay_raw / 5.0  # 0-1

    # ── Factor 5: Scheme fundability ──────────────────────────────────────
    scheme_norm = min(1.0, scheme_cofunding_pct)  # already 0-1

    # ── Weighted sum → 0-100 ───────────────────────────────────────────────
    total = (
        w["urgency"] * urgency_norm
        + w["population_affected"] * pop_norm
        + w["cost_efficiency"] * cost_eff_norm
        + w["delay_risk"] * delay_norm
        + w["scheme_fundability"] * scheme_norm
    ) * 100.0

    breakdown = {
        "urgency": {
            "raw_value": urgency_raw,
            "normalized_value": round(urgency_norm, 4),
            "weight": w["urgency"],
            "weighted_score": round(w["urgency"] * urgency_norm * 100, 2),
            "description": f"Urgency level: {urgency} (complaint volume boost: {round(volume_boost, 2)})",
        },
        "population_affected": {
            "raw_value": population_affected,
            "normalized_value": round(pop_norm, 4),
            "weight": w["population_affected"],
            "weighted_score": round(w["population_affected"] * pop_norm * 100, 2),
            "description": f"{population_affected:,} people affected (ref. max: {MAX_POPULATION_REF:,})",
        },
        "cost_efficiency": {
            "raw_value": round((estimated_cost_lakhs * 100_000) / max(1, population_affected)),
            "normalized_value": round(cost_eff_norm, 4),
            "weight": w["cost_efficiency"],
            "weighted_score": round(w["cost_efficiency"] * cost_eff_norm * 100, 2),
            "description": f"₹{round((estimated_cost_lakhs * 100_000) / max(1, population_affected)):,} per person served",
        },
        "delay_risk": {
            "raw_value": delay_raw,
            "normalized_value": round(delay_norm, 4),
            "weight": w["delay_risk"],
            "weighted_score": round(w["delay_risk"] * delay_norm * 100, 2),
            "description": f"Delay risk: {delay_risk} — higher risk boosts urgency of action",
        },
        "scheme_fundability": {
            "raw_value": scheme_cofunding_pct,
            "normalized_value": round(scheme_norm, 4),
            "weight": w["scheme_fundability"],
            "weighted_score": round(w["scheme_fundability"] * scheme_norm * 100, 2),
            "description": f"{int(scheme_cofunding_pct * 100)}% co-funded by matched scheme",
        },
    }

    return {
        "total_score": round(total, 2),
        "breakdown": breakdown,
        "weights_used": w,
        "formula": "score = Σ(weight_i × normalized_factor_i) × 100",
    }


def recalculate_project_scores(projects: list, weights: Optional[Dict[str, float]] = None) -> list:
    """Re-score a list of project dicts with new weights. Returns sorted list."""
    results = []
    for p in projects:
        scheme_cofunding_pct = p.get("scheme_cofunding_lakhs", 0) / max(p.get("estimated_cost_lakhs", 1), 0.01)
        result = compute_priority_score(
            urgency=p.get("urgency", "medium"),
            population_affected=p.get("population_affected", 0),
            estimated_cost_lakhs=p.get("estimated_cost_lakhs", 10),
            delay_risk=p.get("delay_risk", "medium"),
            scheme_cofunding_pct=scheme_cofunding_pct,
            complaint_count=p.get("complaint_count", 1),
            weights=weights,
        )
        results.append({**p, "priority_score": result["total_score"], "score_breakdown": result["breakdown"]})
    return sorted(results, key=lambda x: x["priority_score"], reverse=True)
