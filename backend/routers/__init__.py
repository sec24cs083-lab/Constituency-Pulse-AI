from routers.complaints import router as complaints_router
from routers.projects import router as projects_router
from routers.budget import router as budget_router
from routers.simulation import router as simulation_router
from routers.wards import router as wards_router
from routers.schemes import router as schemes_router
from routers.summary import router as summary_router

__all__ = [
    "complaints_router", "projects_router", "budget_router",
    "simulation_router", "wards_router", "schemes_router", "summary_router",
]
