"""
People's Priorities — FastAPI Backend
AI-Powered Constituency Decision Intelligence Platform
"""
import logging
import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.exc import OperationalError

from config import settings
from database import engine, SessionLocal
from models import Complaint, Project, Ward, Scheme, Budget  # noqa: F401

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
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
    description="Unified API & Static File Server",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

# Compression Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS Middleware (read from env)
origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Router
api_router = APIRouter(prefix="/api")

from routers import (
    complaints_router, projects_router, budget_router,
    simulation_router, wards_router, schemes_router, summary_router,
)

api_router.include_router(complaints_router)
api_router.include_router(projects_router)
api_router.include_router(budget_router)
api_router.include_router(simulation_router)
api_router.include_router(wards_router)
api_router.include_router(schemes_router)
api_router.include_router(summary_router)

# Mount API router
app.include_router(api_router)


# Root & Health check
@app.get("/health")
def health():
    return {"status": "healthy", "version": settings.app_version}


@app.get("/api")
def api_root():
    return {"status": "api running", "version": settings.app_version}


# Static Files (React Frontend)
static_dir = Path(__file__).parent / "static"

if static_dir.exists() and static_dir.is_dir():
    # Mount static assets specifically (css, js, images)
    app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")
    
    # Optional: other top-level static items if they exist
    for item in ["vite.svg", "favicon.ico", "manifest.json"]:
        item_path = static_dir / item
        if item_path.exists():
            @app.get(f"/{item}")
            async def serve_file(item_name=item):
                return FileResponse(static_dir / item_name)

    # Catch-all for React Router (Single Page Application fallback)
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str, request: Request):
        # Prevent intercepting /api calls
        if full_path.startswith("api/"):
            return {"error": "Not found"}
        
        index_file = static_dir / "index.html"
        if index_file.exists():
            response = FileResponse(index_file)
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            return response
        return {"error": "Frontend build not found."}
else:
    logger.warning("Static directory not found. Frontend will not be served.")
