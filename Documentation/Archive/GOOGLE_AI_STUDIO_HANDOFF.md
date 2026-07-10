# SemiSharp Google AI Studio Handoff

## Purpose

This document defines the starting point for Google AI Studio frontend development.

The SemiSharp frontend is a presentation layer only.

The frontend:
- consumes backend APIs
- displays JSON responses
- manages user interaction

The frontend does NOT:
- calculate predictions
- calculate probabilities
- generate strategies
- apply business rules

All intelligence remains in the backend.

---

# Backend Status

Current validation:

RESULT: 34/34 PASSED

Validated:

- Database
- Data imports
- Projection Engine V2
- Strategy engines
- FastAPI APIs
- Authentication

---

# Start Backend

From:

~/Projects/SemiSharp/BackEnd

Run:

source .venv/bin/activate

uvicorn app.main:app --reload


Backend:

http://localhost:8000


Swagger:

http://localhost:8000/docs


OpenAPI:

http://localhost:8000/openapi.json

---

# Validation

Run:

python -m scripts.tests.regression_test

Expected:

RESULT: 34/34 PASSED

---

# Authentication

The application starts with authentication.

Endpoint:

POST /auth/login


Inputs:

- username
- password


Response includes:

- user_id
- username
- display_name
- role
- available survivor entries


User flow:

Login

↓

User Profile

↓

Entry Selection

↓

Dashboard


---

# User Entries

Users may have multiple survivor entries.

Example:

SAS:
- UWOSH-1
- UWOSH-2

CNS:
- UWOSH-3

UWO:
- UWOSH-4


The selected entry controls survivor-specific views.

---

# Primary Frontend APIs

Dashboard:

GET /context/current


Teams:

GET /teams


Weekly Matchups:

GET /schedule/{season}/{week}


Projections:

GET /projections/{season}/{week}


Risk:

GET /risk/{season}/{week}


Market:

GET /market/consensus/{season}/{week}

GET /market/projection-edge/{season}/{week}


Strategies:

GET /strategies/*


Authentication:

POST /auth/login

---

# Frontend Rules

1. No business logic in the GUI.
2. No prediction calculations in the GUI.
3. No strategy calculations in the GUI.
4. No hardcoded backend URLs.
5. Use backend JSON responses only.

---

# Next Phase

Google AI Studio frontend development.

Initial screens:

1. Login
2. Entry Selection
3. Dashboard
4. Weekly Matchups
5. Projections
6. Risk
7. Strategies

After user testing, backend improvements will be driven by actual application usage.
