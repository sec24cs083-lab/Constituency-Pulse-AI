# People's Priorities
### AI-Powered Constituency Decision Intelligence Platform
> Submitted to **Google Cloud Build with AI: Code for Communities**

**People's Priorities** transforms scattered citizen feedback into evidence-based, budget-aware, explainable development project recommendations for Members of Parliament (India).

---

## Live Demo

| Service | URL |
|---|---|
| MP Dashboard | `http://localhost:5173` |
| Citizen Transparency View | `http://localhost:5173/citizen` |
| API Docs (Swagger) | `http://localhost:8000/docs` |
| API Root | `http://localhost:8000/` |

---

## Architecture — Where AI vs. Classical Models are Used

This is the **core differentiator**: every decision is traceable. We use the right tool for each layer.

| Layer | Tool | Why NOT an LLM |
|---|---|---|
| **Priority scoring** | Deterministic weighted formula | Auditable, explainable, no hallucination |
| **Budget allocation** | PuLP Integer Linear Programming (0/1 knapsack) | Optimal, reproducible, verifiable |
| **Hotspot detection** | scikit-learn DBSCAN clustering | Transparent algorithm, configurable params |
| **Delay simulation** | Rule-based formula (cost escalation + urgency compounding) | Interpretable coefficients |
| **Scheme matching** | Rule-based eligibility checker | Exact criteria matching |
| **Complaint classification** | Claude (structured JSON output) | Language understanding required |
| **Translation** | Claude | Multilingual NLP (Hindi/Marathi/English) |
| **Entity extraction** | Claude | Named-entity recognition |
| **Executive summary** | Claude (grounded on score_breakdown JSON) | Natural language generation from data |

### Priority Score Formula

```
score = w1*urgency + w2*population_affected + w3*cost_efficiency + w4*delay_risk + w5*scheme_fundability
```

Default weights (visible in API response, configurable):

| Factor | Weight | Normalization |
|---|---|---|
| urgency | 25% | complaint urgency level + volume boost |
| population_affected | 20% | per 100,000 reference population |
| cost_efficiency | 20% | inverse cost-per-person (lower = better) |
| delay_risk | 20% | high/medium/low mapped to 0.9/0.6/0.3 |
| scheme_fundability | 15% | scheme co-funding % |

**Claude NEVER computes the score.** It only explains a score produced by this formula.

---

## Tech Stack

### Backend (Python FastAPI)
- **FastAPI** + **SQLAlchemy** + **PostgreSQL** — API and persistence
- **PuLP** — budget optimization (ILP solver)
- **scikit-learn** — DBSCAN hotspot detection
- **Anthropic Claude** — NLP (classification, translation, summarization) only
- **Alembic** — DB migrations

### Frontend (React + TypeScript + Vite + Tailwind CSS)
- **React Router** — SPA routing
- **Leaflet** / **react-leaflet** — interactive map with ward boundaries
- **Recharts** — explainable score breakdown charts
- **Lucide React** — icons
- **Axios** — typed API client

### Infrastructure
- **Docker Compose** — orchestrates PostgreSQL, FastAPI, and Vite dev server
- **PostgreSQL 15** — primary data store

---

## Data Sources

> **All government data is SYNTHETIC** — structured to mirror real datasets for demonstration. No real citizen PII is used.

| Data | Source Mirrored | Status |
|---|---|---|
| Ward demographics (population, literacy, SC/ST%) | Census 2011 ward-level | **Synthetic** |
| Road coverage | PMGSY road connectivity data | **Synthetic** |
| Water access | Jal Jeevan Mission household data | **Synthetic** |
| MPLADS budget | MPLADS guidelines (₹5 Cr/MP/year) | **Synthetic** |
| Government schemes | JJM, PMGSY, PMAY, SBM-U, RSBY, SSA, DDUGJY | **Synthetic structure** |
| Complaints | Demo complaints for Pune Urban constituency | **Synthetic** |

---

## Setup & Running

### Prerequisites
- Docker Desktop
- (Optional) Anthropic Claude API key for AI summaries

### 1. Clone & configure

```bash
cp .env.example .env
# Edit .env — add ANTHROPIC_API_KEY if you have one
```

### 2. Start everything

```bash
docker-compose up --build
```

Wait ~30 seconds for PostgreSQL to initialize and the backend to seed the database.

### 3. Open the app

- **MP Dashboard**: http://localhost:5173
- **Citizen View**: http://localhost:5173/citizen
- **API Docs**: http://localhost:8000/docs

### Running without Docker (development)

**Backend:**
```bash
cd backend
python -m venv venv && venv\Scripts\activate  # Windows
pip install -r requirements.txt
# Set DATABASE_URL in .env pointing to a local PostgreSQL instance
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/projects/` | Ranked project list with score_breakdown |
| GET | `/projects/{id}` | Full project detail + complaints |
| GET | `/projects/{id}/score-breakdown` | Explainable score with formula |
| POST | `/budget/optimize` | Run PuLP optimizer |
| POST | `/simulation/delay/{id}` | Delay impact projection |
| GET | `/wards/hotspots/all` | DBSCAN cluster results |
| GET | `/schemes/` | Government scheme catalog |
| POST | `/complaints/` | Submit + auto-classify complaint |
| POST | `/summary/{id}` | Generate Claude AI summary |

---

## Sample Constituency: Pune Urban

| Item | Detail |
|---|---|
| MP | Aditi Sharma (fictional) |
| Wards | 6 (Kasba Peth, Shivajinagar, Hadapsar, Kondhwa, Kothrud, Wanowrie) |
| Projects | 8 proposed, scored, and ranked |
| Complaints | 10 multi-lingual sample complaints |
| MPLADS Budget | ₹500L total, ₹380L available |
| Top Priority | Hadapsar Piped Water (score: 87.4/100) |

---

## AI Guardrails

1. **Claude never scores.** The priority formula runs first; Claude only explains the result.
2. **Grounded summaries.** Claude receives a structured JSON payload (score_breakdown, evidence, scheme match) and is instructed via system prompt to not invent any numbers not present.
3. **Input audit log.** Every Claude call stores the exact input payload in `ai_summary_input_log` for auditability.
4. **Graceful degradation.** If `ANTHROPIC_API_KEY` is not set, the app uses deterministic mock summaries — all other features (scoring, optimization, simulation, map) work fully.

---

## License

MIT
