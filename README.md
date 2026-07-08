# People's Priorities (மக்களின் முன்னுரிமைகள்)
AI-Powered Constituency Decision Intelligence Platform

## Architecture Overview
This project uses a unified container architecture, serving both the React frontend and FastAPI backend from a single port (8000).

- **Frontend:** React, Vite, Tailwind CSS (Mobile-First)
- **Backend:** FastAPI, Python, SQLAlchemy, SQLite
- **Data Science:** Integer Linear Programming (PuLP), DBSCAN clustering
- **AI Integration:** Google Gemini 1.5 Flash (NLP, Classification, Translation)

## Local Development (Separated)

If you are developing locally, you can run the frontend and backend servers separately:

### Backend
```bash
cd backend
python -m venv venv
# On Windows: .\venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Production Deployment (Single Docker Container)

The platform is designed to be deployed as a single, optimized Docker container to services like **Google Cloud Run**, **Render**, or **Railway**.

### Docker Build
```bash
# Build the unified container
docker build -t constituency-pulse .

# Run locally
docker run -p 8000:8000 -e GEMINI_API_KEY=your_key -e CORS_ORIGINS="*" constituency-pulse
```

### Google Cloud Run Deployment

1. Ensure you have the `gcloud` CLI installed.
2. Build and submit your image to Google Container Registry (or Artifact Registry):
```bash
gcloud builds submit --tag gcr.io/[PROJECT-ID]/constituency-pulse
```
3. Deploy to Cloud Run:
```bash
gcloud run deploy constituency-pulse \
  --image gcr.io/[PROJECT-ID]/constituency-pulse \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=your_key,CORS_ORIGINS=*"
```

### Environment Variables
- `GEMINI_API_KEY`: Required for NLP summarization and classification.
- `CORS_ORIGINS`: Comma-separated list of allowed origins (e.g. `http://localhost:5173,https://my-app.com`). Defaults to `http://localhost:5173,http://localhost:3000`.
- `PORT`: Automatically set by Cloud Run, defaults to `8000`.
- `DATABASE_URL`: (Optional) Provide a PostgreSQL connection string. Defaults to a local SQLite database that resets on container restart.

## Troubleshooting
- **Frontend not loading on `/`:** Ensure the Docker multi-stage build successfully ran `npm run build` and copied the `dist` folder to `/app/static` in the backend.
- **Routing Issues (404 on refresh):** FastAPI acts as a SPA router. All routes not prefixed with `/api` return `index.html`.
- **API CORS Errors:** Ensure the `CORS_ORIGINS` environment variable includes your frontend domain.

