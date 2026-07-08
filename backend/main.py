"""
People's Priorities — FastAPI Backend
AI-Powered Constituency Decision Intelligence Platform

Architecture:
  - LLM (Claude): complaint classification, entity extraction, summary generation ONLY
  - Deterministic formula: priority scoring
  - PuLP ILP: budget optimization
  - scikit-learn DBSCAN: hotspot detection
  - Rule-based: delay simulation, scheme matching
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError

from config import settings
from database import engine, SessionLocal
from models import Complaint, Project, Ward, Scheme, Budget  # noqa: F401 — ensure all models registered

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables, optionally seed data."""
    logger.info("Starting up People's Priorities backend...")

    # Create all tables
    from database import Base
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified.")
    except OperationalError as e:
        logger.error(f"DB connection error: {e}")

    # Seed if requested
    if settings.seed_on_startup:
        try:
            from seed.seed_data import seed_database
            db = SessionLocal()
            seed_database(db)
            db.close()
        except Exception as e:
            logger.warning(f"Seed skipped: {e}")

    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="People's Priorities API",
    description=(
        "AI-Powered Constituency Decision Intelligence Platform for Indian Members of Parliament. "
        "Uses deterministic scoring, PuLP optimization, DBSCAN clustering, and Claude for NLP only."
    ),
    version=settings.app_version,
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
from routers import (
    complaints_router, projects_router, budget_router,
    simulation_router, wards_router, schemes_router, summary_router,
)

app.include_router(complaints_router)
app.include_router(projects_router)
app.include_router(budget_router)
app.include_router(simulation_router)
app.include_router(wards_router)
app.include_router(schemes_router)
app.include_router(summary_router)


@app.get("/")
def root():
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs",
        "description": "AI-Powered Constituency Decision Intelligence Platform",
        "ai_boundary": {
            "claude_used_for": ["complaint classification", "entity extraction", "translation", "summary generation"],
            "classical_models": ["priority scoring (weighted formula)", "budget allocation (PuLP ILP)", "hotspot detection (DBSCAN)", "delay simulation (rule-based)"],
        },
    }


@app.get("/health")
def health():
    return {"status": "healthy", "version": settings.app_version}
