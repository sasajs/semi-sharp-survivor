# Semi-Sharp V2: Circa Survivor Contest MVP Developer Guide

This guide describes how to run and build the Semi-Sharp V2 application using **Next.js**, **FastAPI**, and **PostgreSQL**.

---

## 📂 Production Folder Structure Representation
```text
semi-sharp-v2/
├── backend/                  # FastAPI Application
│   ├── main.py               # API Entry Point
│   ├── models.py             # SQLAlchemy models mapping schema.sql
│   ├── database.py           # DB Pool, Session, engine config
│   ├── optimizer.py          # Survivor contest algorithms / formulas
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # Next.js Application (App Router structure)
│   ├── package.json
│   ├── tailwind.config.js
│   └── src/
│       └── app/
│           ├── layout.tsx    # App root shell
│           ├── page.tsx      # 1. Dashboard Page
│           ├── setup/        # 2. Contest Setup Page
│           │   └── page.tsx
│           ├── entries/      # 3. Entry Management Page
│           │   └── page.tsx
│           ├── picks/        # 4. Weekly Pick Dashboard Page
│           │   └── page.tsx
│           ├── inventory/    # Team and Holiday Inventory Dashboards
│           │   ├── page.tsx  # 5. Team Inventory Dashboard
│           │   ├── thanks/   # 6. Thanksgiving Inventory Dashboard
│           │   │   └── page.tsx
│           │   └── xmas/     # 7. Christmas Inventory Dashboard
│           │       └── page.tsx
│           └── reports/      # 8. Recommendation Report Page
│               └── page.tsx
│
├── schema.sql                # PostgreSQL DDL
├── Dockerfile                # Production Multi-Stage Deployment
└── docker-compose.yml        # Development Orchestrator Config
```

---

## 🚀 Local Development Setup

### Option A: Using Docker-Compose (Recommended)
This starts all three services (PostgreSQL, FastAPI, and Next.js) with live-reloads preconfigured:

```bash
# 1. Clone/Navigate into repository
cd semi-sharp-v2

# 2. Spin up containers
docker-compose up --build
```
PostgreSQL will automatically seed `schema.sql` on first boot.
- Next.js Web Console: `http://localhost:3000`
- FastAPI OpenAPI Docs: `http://localhost:8000/docs`

---

### Option B: Bare-Metal Setup

#### 💾 1. Database Setup
Ensure PostgreSQL is running locally and execute the relational schema:
```bash
psql -U postgres -d postgres -c "CREATE DATABASE circa_survivor;"
psql -U postgres -d circa_survivor -f schema.sql
```

#### 🐍 2. Backend FastAPI
```bash
cd backend

# Create Virtual Environment
python -m venv venv
source venv/bin/activate  # Or venv\Scripts\activate on Windows

# Install requirements
pip install -r requirements.txt

# Run server (with livereload)
uvicorn main:app --reload --port 8000
```

#### ⚛️ 3. Frontend Next.js
```bash
cd frontend

# Install dependencies
npm install

# Run Vite-driven Next.js Dev Server
npm run dev
```

---

## 📐 Circa Survivor Business Logic Constraints

1. **One-Use Rule**: Handled by SQL composite core unique index `unique_entry_team_pick`:
   `CONSTRAINT unique_entry_team_pick UNIQUE (entry_id, team_id)`
2. **Tie Equals Loss**: Realize outcomes through `survivor_history` with check:
   `result CHECK (result IN ('won', 'lost', 'tie_loss'))`. Any game ending in a drawing tie scores a default exclusion and flags the entry as `'eliminated'`.
3. **Separate Holiday Legs**: Thanksgiving (Leg 13) and Christmas (Leg 18) are processed precisely as separate legs.
