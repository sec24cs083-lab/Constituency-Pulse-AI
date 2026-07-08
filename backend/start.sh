#!/bin/bash
set -e

echo "Starting People's Priorities Unified Container..."

# Fallback for PORT if not set by Cloud Run
export PORT="${PORT:-8000}"

# Run database migrations or setup if needed
# (FastAPI lifespan event currently handles table creation, but this is here for future Alembic use)
# echo "Running migrations..."
# alembic upgrade head

# Start Uvicorn
echo "Starting Uvicorn on port $PORT..."
exec uvicorn main:app --host 0.0.0.0 --port $PORT
