"""
Delay Impact Simulation Service — Rule-Based Projection

Models how priority score and estimated cost change
if a project is delayed by N months.

Rules (transparent, configurable):
  - Cost escalation: 1.5% per month (construction material inflation proxy)
  - Score escalation: High-risk projects score +2pts/month delay (urgency compounds)
  - For high delay_risk projects: cost escalation is 2.5%/month (monsoon window missed → re-excavation etc.)

This is NOT an LLM — it's a deterministic rule-based projection.
"""
from typing import Dict, Any


COST_ESCALATION_RATE_BASE = 0.015       # 1.5% per month
COST_ESCALATION_HIGH_RISK = 0.025      # 2.5% per month for high-risk
SCORE_ESCALATION_HIGH_RISK = 2.0       # priority pts per month for high delay_risk
SCORE_ESCALATION_MEDIUM_RISK = 0.8     # priority pts per month for medium
SCORE_ESCALATION_LOW_RISK = 0.2        # priority pts per month for low


def simulate_delay(
    project_id: int,
    project_name: str,
    current_score: float,
    estimated_cost_lakhs: float,
    delay_risk: str,
    delay_months: int,
) -> Dict[str, Any]:
    """
    Project the impact of delaying a project by N months.

    Returns:
        {
            project_id, delay_months,
            projected_cost_lakhs, cost_increase_pct,
            projected_score, score_change,
            narrative (plain rule-based string, NOT LLM-generated)
        }
    """
    delay_risk_lower = delay_risk.lower()

    # Cost projection
    rate = COST_ESCALATION_HIGH_RISK if delay_risk_lower == "high" else COST_ESCALATION_RATE_BASE
    projected_cost = estimated_cost_lakhs * ((1 + rate) ** delay_months)
    cost_increase_pct = ((projected_cost - estimated_cost_lakhs) / estimated_cost_lakhs) * 100

    # Score escalation (urgency compounds over time)
    if delay_risk_lower == "high":
        score_delta = SCORE_ESCALATION_HIGH_RISK * delay_months
    elif delay_risk_lower == "medium":
        score_delta = SCORE_ESCALATION_MEDIUM_RISK * delay_months
    else:
        score_delta = SCORE_ESCALATION_LOW_RISK * delay_months

    projected_score = min(100.0, current_score + score_delta)

    # Rule-based narrative
    narrative_parts = [
        f"If '{project_name}' is delayed by {delay_months} month(s):",
        f"  • Estimated cost increases from ₹{estimated_cost_lakhs:.1f}L to ₹{projected_cost:.1f}L "
        f"(+{cost_increase_pct:.1f}% at {rate*100:.1f}%/month escalation rate).",
    ]
    if delay_risk_lower == "high":
        narrative_parts.append(
            f"  • Higher cost escalation rate ({rate*100:.1f}%/month) applies because monsoon-window or seasonal construction constraints mean delays force re-mobilization."
        )
    narrative_parts.append(
        f"  • Priority score rises from {current_score:.1f} to {projected_score:.1f} "
        f"(+{score_delta:.1f} pts) as unmet need accumulates."
    )
    narrative_parts.append(
        "  • NOTE: This projection uses deterministic rule-based modeling, not ML or LLM inference. "
        "Escalation rates are based on standard PWD/CPWD cost-index conventions (synthetic)."
    )

    return {
        "project_id": project_id,
        "project_name": project_name,
        "delay_months": delay_months,
        "current_cost_lakhs": round(estimated_cost_lakhs, 2),
        "projected_cost_lakhs": round(projected_cost, 2),
        "cost_increase_pct": round(cost_increase_pct, 2),
        "current_score": round(current_score, 2),
        "projected_score": round(projected_score, 2),
        "score_increase": round(score_delta, 2),
        "escalation_rate_pct_per_month": rate * 100,
        "delay_risk": delay_risk,
        "narrative": "\n".join(narrative_parts),
        "model_type": "Rule-based deterministic projection (not ML/LLM)",
    }


def simulate_portfolio_delay(
    projects: list,
    delay_months: int,
) -> Dict[str, Any]:
    """Simulate delay impact across a portfolio of projects."""
    results = []
    total_cost_now = 0
    total_cost_delayed = 0

    for p in projects:
        sim = simulate_delay(
            project_id=p["id"],
            project_name=p["name"],
            current_score=p.get("priority_score", 0),
            estimated_cost_lakhs=p.get("net_cost_lakhs", p.get("estimated_cost_lakhs", 0)),
            delay_risk=p.get("delay_risk", "medium"),
            delay_months=delay_months,
        )
        results.append(sim)
        total_cost_now += p.get("net_cost_lakhs", p.get("estimated_cost_lakhs", 0))
        total_cost_delayed += sim["projected_cost_lakhs"]

    return {
        "delay_months": delay_months,
        "projects": results,
        "portfolio_cost_now_lakhs": round(total_cost_now, 2),
        "portfolio_cost_delayed_lakhs": round(total_cost_delayed, 2),
        "total_cost_increase_lakhs": round(total_cost_delayed - total_cost_now, 2),
    }
