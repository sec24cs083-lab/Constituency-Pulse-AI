# ── Stage 1: Build Frontend ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install dependencies first (caching layer)
COPY frontend/package*.json ./
RUN npm ci

# Copy source and build
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Build Backend & Runner ──────────────────────────────────────────
FROM python:3.11-slim AS runner

# Set non-interactive env vars
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Install system dependencies (required for some Python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./

# Copy built frontend assets from Stage 1 into the backend's static directory
COPY --from=frontend-builder /app/frontend/dist ./static

# Ensure the startup script is executable
RUN chmod +x start.sh

# Create a non-root user and switch to it for security
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

# Healthcheck for Docker
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:${PORT}/health || exit 1

EXPOSE ${PORT}

# Run the startup script
CMD ["./start.sh"]
