"""
Budget Optimization Service — PuLP Knapsack Solver

Given a list of proposed projects and an available MPLADS budget,
selects the project mix that MAXIMIZES total priority score
subject to:
  - Total net cost ≤ available budget
  - Each project is either fully funded (1) or not (0) — 0/1 knapsack

This is a classical integer linear program — NOT an LLM.
"""
from typing import List, Dict, Any, Optional

try:
    import pulp
    PULP_AVAILABLE = True
except ImportError:
    PULP_AVAILABLE = False


def optimize_budget(
    projects: List[Dict[str, Any]],
    available_budget_lakhs: float,
) -> Dict[str, Any]:
    """
    Solve the 0/1 knapsack budget allocation problem.

    Args:
        projects: list of project dicts with keys:
                  id, name, net_cost_lakhs, priority_score
        available_budget_lakhs: the MPLADS balance to allocate

    Returns:
        {
            funded_project_ids: [int],
            total_cost_lakhs: float,
            total_score: float,
            budget_utilization_pct: float,
            solver_status: str,
            unfunded_project_ids: [int],
        }
    """
    if not projects:
        return _empty_result("No projects to optimize")

    if not PULP_AVAILABLE:
        return _greedy_fallback(projects, available_budget_lakhs)

    n = len(projects)
    ids = [p["id"] for p in projects]
    costs = [p.get("net_cost_lakhs", p.get("estimated_cost_lakhs", 0)) for p in projects]
    scores = [p.get("priority_score", 0) for p in projects]

    # Define the ILP problem
    prob = pulp.LpProblem("MPLADS_Budget_Allocation", pulp.LpMaximize)

    # Binary decision variables
    x = [pulp.LpVariable(f"x_{i}", cat="Binary") for i in range(n)]

    # Objective: maximize total priority score
    prob += pulp.lpSum(scores[i] * x[i] for i in range(n))

    # Constraint: total cost ≤ budget
    prob += pulp.lpSum(costs[i] * x[i] for i in range(n)) <= available_budget_lakhs

    # Solve
    solver = pulp.PULP_CBC_CMD(msg=False)
    status = prob.solve(solver)
    status_str = pulp.LpStatus[prob.status]

    funded_ids = []
    total_cost = 0.0
    total_score = 0.0

    if status_str in ("Optimal", "Feasible"):
        for i in range(n):
            if pulp.value(x[i]) and pulp.value(x[i]) > 0.5:
                funded_ids.append(ids[i])
                total_cost += costs[i]
                total_score += scores[i]

    unfunded_ids = [p["id"] for p in projects if p["id"] not in funded_ids]

    return {
        "funded_project_ids": funded_ids,
        "total_cost_lakhs": round(total_cost, 2),
        "total_score": round(total_score, 2),
        "budget_remaining_lakhs": round(available_budget_lakhs - total_cost, 2),
        "budget_utilization_pct": round((total_cost / available_budget_lakhs) * 100, 1) if available_budget_lakhs > 0 else 0,
        "solver_status": status_str,
        "solver_method": "PuLP CBC integer linear programming (0/1 knapsack)",
        "unfunded_project_ids": unfunded_ids,
    }


def _greedy_fallback(projects: List[Dict[str, Any]], budget: float) -> Dict[str, Any]:
    """Greedy fallback if PuLP is unavailable — sort by score/cost ratio."""
    sorted_projects = sorted(
        projects,
        key=lambda p: p.get("priority_score", 0) / max(p.get("net_cost_lakhs", 1), 0.01),
        reverse=True,
    )
    funded_ids, total_cost, total_score = [], 0.0, 0.0
    for p in sorted_projects:
        cost = p.get("net_cost_lakhs", 0)
        if total_cost + cost <= budget:
            funded_ids.append(p["id"])
            total_cost += cost
            total_score += p.get("priority_score", 0)

    return {
        "funded_project_ids": funded_ids,
        "total_cost_lakhs": round(total_cost, 2),
        "total_score": round(total_score, 2),
        "budget_remaining_lakhs": round(budget - total_cost, 2),
        "budget_utilization_pct": round((total_cost / budget) * 100, 1) if budget > 0 else 0,
        "solver_status": "Greedy (PuLP unavailable)",
        "solver_method": "Greedy score/cost ratio sort",
        "unfunded_project_ids": [p["id"] for p in projects if p["id"] not in funded_ids],
    }


def _empty_result(msg: str) -> Dict[str, Any]:
    return {
        "funded_project_ids": [], "total_cost_lakhs": 0, "total_score": 0,
        "budget_remaining_lakhs": 0, "budget_utilization_pct": 0,
        "solver_status": msg, "solver_method": "N/A", "unfunded_project_ids": [],
    }
