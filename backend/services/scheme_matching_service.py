"""
Scheme Matching Service — Rule-Based Eligibility Matcher

Matches a project to government schemes based on:
  - Category match (water, roads, health, education, etc.)
  - Ward demographic thresholds (population, literacy, SC/ST %, infra coverage)

This is a deterministic rule-based matcher — NOT an LLM.
"""
from typing import List, Dict, Any, Optional


def match_scheme(
    project_category: str,
    ward_demographics: Dict[str, Any],
    schemes: List[Dict[str, Any]],
) -> Optional[Dict[str, Any]]:
    """
    Find the best matching scheme for a project.

    Args:
        project_category: e.g. 'water', 'roads', 'health', 'education'
        ward_demographics: dict with ward infra/demographic fields
        schemes: list of scheme dicts (from DB)

    Returns:
        Best matching scheme dict, or None.
    """
    candidates = []

    for scheme in schemes:
        criteria = scheme.get("eligibility_criteria", {})
        cat_list = criteria.get("categories", [])

        # Must match category
        if project_category not in cat_list:
            continue

        # Check demographic/infra thresholds
        score = 10  # base match score
        matches = True

        if "water_access_pct_below" in criteria:
            threshold = criteria["water_access_pct_below"]
            actual = ward_demographics.get("water_access_pct", 100)
            if actual < threshold:
                score += 20
            else:
                matches = False

        if "road_coverage_pct_below" in criteria:
            threshold = criteria["road_coverage_pct_below"]
            actual = ward_demographics.get("road_coverage_pct", 100)
            if actual < threshold:
                score += 20
            else:
                matches = False

        if "drainage_coverage_pct_below" in criteria:
            threshold = criteria["drainage_coverage_pct_below"]
            actual = ward_demographics.get("drainage_coverage_pct", 100)
            if actual < threshold:
                score += 20
            else:
                matches = False

        if "electricity_pct_below" in criteria:
            threshold = criteria["electricity_pct_below"]
            actual = ward_demographics.get("electricity_pct", 100)
            if actual < threshold:
                score += 20
            else:
                matches = False

        if "literacy_rate_below" in criteria:
            threshold = criteria["literacy_rate_below"]
            actual = ward_demographics.get("literacy_rate", 100)
            if actual < threshold:
                score += 15
            else:
                matches = False

        if "sc_st_percentage_above" in criteria:
            threshold = criteria["sc_st_percentage_above"]
            actual = ward_demographics.get("sc_st_percentage", 0)
            if actual >= threshold:
                score += 15
            else:
                matches = False

        if "min_population" in criteria:
            if ward_demographics.get("population", 0) < criteria["min_population"]:
                matches = False

        if matches:
            candidates.append({**scheme, "_match_score": score})

    if not candidates:
        return None

    # Return best matching scheme (highest match score, then highest cofunding_pct)
    best = sorted(candidates, key=lambda x: (x["_match_score"], x.get("cofunding_pct", 0)), reverse=True)[0]
    best.pop("_match_score", None)
    return best


def match_all_projects(
    projects: List[Dict[str, Any]],
    wards: List[Dict[str, Any]],
    schemes: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Match schemes for all projects. Returns projects with scheme_match field added.
    """
    ward_map = {w["id"]: w for w in wards}
    results = []

    for project in projects:
        ward = ward_map.get(project.get("ward_id"), {})
        matched = match_scheme(
            project_category=project.get("category", ""),
            ward_demographics=ward,
            schemes=schemes,
        )
        cofunding_pct = matched.get("cofunding_pct", 0) / 100.0 if matched else 0
        cofunding_lakhs = project.get("estimated_cost_lakhs", 0) * cofunding_pct

        results.append({
            **project,
            "scheme_match": matched,
            "scheme_cofunding_pct": cofunding_pct,
            "scheme_cofunding_lakhs": round(cofunding_lakhs, 2),
            "net_cost_lakhs": round(project.get("estimated_cost_lakhs", 0) - cofunding_lakhs, 2),
        })

    return results
