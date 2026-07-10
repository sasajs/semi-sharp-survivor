# SemiSharp Google AI Studio Handoff

## Purpose

This document defines the starting point for Google AI Studio frontend development.

The SemiSharp backend is complete for MVP frontend integration.

The frontend is a presentation layer only.

The frontend does NOT:
- calculate predictions
- calculate probabilities
- rank teams
- generate strategies
- apply business rules

All intelligence remains in backend services.

---

# Backend Status

Regression Validation:

RESULT: 31/31 PASSED

Validated:

- Database connection
- Team reference data
- Schedule data
- PFF ratings
- SIC scores
- Market data
- Projection Engine V2
- Strategy engines
- FastAPI endpoints

---

# Starting the Backend

From:

~/Projects/SemiSharp/BackEnd

Run:

source .venv/bin/activate

uvicorn app.main:app --reload

Backend URL:

http://localhost:8000

---

# Validation Command

Run:

python -m scripts.tests.regression_test

Expected:

RESULT: 31/31 PASSED

---

# API Documentation

Swagger:

http://localhost:8000/docs

OpenAPI:

http://localhost:8000/openapi.json

---

# Primary Frontend APIs

## Dashboard Context

GET /context/current


## Teams

GET /teams


## Weekly Schedule

GET /schedule/{season}/{week}


## Projections

GET /projections/{season}/{week}


## Risk

GET /risk/{season}/{week}


## Market

GET /market/consensus/{season}/{week}

GET /market/projection-edge/{season}/{week}


## Strategies

GET /strategies/*

Available strategies:

- Highest Win Probability
- Future Value
- Multiple Entry Portfolio
- Circa Holiday Reserve
- Projection Edge
- Monte Carlo Survivor
- Dynamic Programming

---

# Frontend Development Rules

1. The GUI consumes JSON APIs only.
2. Do not hardcode backend URLs.
3. Use environment configuration.
4. Keep business logic in backend services.
5. Request backend changes only when UI requirements expose missing functionality.

---

# Recommended First GUI Screens

1. Dashboard
   - Context
   - Season/week status

2. Weekly Matchups
   - Schedule
   - Teams

3. Projection Dashboard
   - Model outputs

4. Risk Dashboard
   - Risk factors

5. Strategy Dashboard
   - Survivor strategies

---

# Current Development Phase

Backend MVP complete.

Next phase:

Google AI Studio frontend development.

After user testing:
- collect feedback
- identify missing workflows
- build Backend Version 2 improvements
