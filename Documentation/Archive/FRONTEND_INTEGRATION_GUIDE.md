# SemiSharp Frontend Integration Guide

## Purpose

The SemiSharp frontend is a presentation layer only.

The frontend:
- Calls backend APIs
- Displays JSON responses
- Manages user interaction

The frontend does NOT:
- Calculate predictions
- Calculate probabilities
- Rank teams
- Generate strategy recommendations
- Apply betting logic

All intelligence resides in the backend.

---

# Backend Connection

Development URL:

http://localhost:8000

API Documentation:

http://localhost:8000/docs

OpenAPI Schema:

http://localhost:8000/openapi.json

---

# Environment Configuration

Frontend should use configuration variables.

Example:

BACKEND_URL=http://localhost:8000
API_VERSION=1.0
ENVIRONMENT=development

No URLs should be hardcoded in components.

---

# Core Screens and APIs

## Dashboard

Purpose:
Application overview.

Endpoint:

GET /context


## Teams

Purpose:
Team reference data.

Endpoint:

GET /teams


## Weekly Matchups

Purpose:
Display NFL schedule.

Endpoint:

GET /schedule/{season}/{week}


## Projection Dashboard

Purpose:
Display model predictions.

Endpoint:

GET /projections/{season}/{week}


## Risk Dashboard

Purpose:
Display uncertainty factors.

Endpoint:

GET /risk/{season}/{week}


## Market Dashboard

Purpose:
Compare market and SemiSharp projections.

Endpoints:

GET /market/consensus/{season}/{week}

GET /market/projection-edge/{season}/{week}


## Strategy Dashboard

Purpose:
Display survivor strategy recommendations.

Endpoints:

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

# Development Rule

Backend is the product.

Frontend is a client.

If a calculation or decision is required, add it to the backend service layer, not the GUI.

---

# Current Backend Validation

Regression status:

31/31 PASSED

Validation command:

python -m scripts.tests.regression_test

---

# Authentication Flow

The application starts with authentication.

## Login Screen

Endpoint:

POST /auth/login

Inputs:

- username
- password

Successful login returns:

- user_id
- username
- display_name
- role
- available survivor entries

---

# Entry Selection

Users may have multiple survivor entries.

Example:

SAS:

- UWOSH-1
- UWOSH-2

The frontend should allow the user to select an entry after login.

The selected entry controls survivor-specific views.

---

# User Interface Flow

Login

↓

User Profile

↓

Entry Selection

↓

Dashboard

↓

Application Features:

- Weekly Matchups
- Projections
- Risk
- Strategies

---

# Authentication Rules

The frontend should not:

- store passwords
- calculate permissions
- create mock users
- determine roles

Authentication and user management remain backend responsibilities.

---
