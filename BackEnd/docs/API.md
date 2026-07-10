# SemiSharp API Specification

## Purpose
This document defines the contract between the backend services and the future Google AI Studio frontend. The frontend will never contain business logic. It will call backend APIs and render returned JSON.

## Status Legend
- Planned
- In Development
- Implemented
- Deprecated

---

## Health

### GET /health
Status: Planned

Returns backend service status.

Expected response:
{
  "status": "ok",
  "service": "semisharp-backend"
}

---

## Authentication

### POST /auth/login
Status: Planned

Authenticates a user.

Expected request:
{
  "username": "SAS",
  "password": "********"
}

Expected response:
{
  "authenticated": true,
  "user_id": 2,
  "username": "SAS",
  "role": "USER"
}

---

## Users

### GET /users/entries
Status: Planned

Returns users and their Survivor Sweat entries.

---

## Reference Data

### GET /reference/teams
Status: Planned

Returns canonical NFL teams.

### GET /reference/team-aliases
Status: Planned

Returns all team aliases.

### GET /reference/team-aliases/{alias}
Status: Planned

Resolves an alias to the canonical team.

Example:
GET /reference/team-aliases/LAR

Expected response:
{
  "team_id": 17,
  "team_abbr": "LA",
  "team_name": "Los Angeles Rams"
}

---

## Schedule

### GET /schedule/{season}
Status: Planned

Returns all games for a season.

Example:
GET /schedule/2026

### GET /schedule/{season}/week/{week}
Status: Planned

Returns games for a specific NFL week.

Example:
GET /schedule/2026/week/1

### GET /schedule/{season}/holidays
Status: Planned

Returns Thanksgiving and Christmas games for a season.

Example:
GET /schedule/2026/holidays

Expected response:
[
  {
    "gameday": "2026-11-26",
    "holiday": "THANKSGIVING",
    "away_team_abbr": "CHI",
    "home_team_abbr": "DET",
    "stadium": "Ford Field"
  }
]

---

## Contest

### GET /contest/formats
Status: Planned

Returns available contest formats.

Expected response:
[
  {
    "format_code": "STANDARD",
    "format_name": "Standard Survivor",
    "includes_thanksgiving": false,
    "includes_christmas": false
  },
  {
    "format_code": "CIRCA",
    "format_name": "Circa Survivor",
    "includes_thanksgiving": true,
    "includes_christmas": true
  }
]

### GET /contest/{format_code}/legs/{season}
Status: Planned

Returns contest legs for a selected format and season.

Example:
GET /contest/CIRCA/legs/2026

Expected response:
[
  {
    "leg_number": 1,
    "leg_code": "WEEK_1",
    "leg_name": "Week 1",
    "nfl_week": 1,
    "is_special_leg": false,
    "special_leg_type": null
  },
  {
    "leg_number": 13,
    "leg_code": "THANKSGIVING",
    "leg_name": "Thanksgiving",
    "nfl_week": 13,
    "is_special_leg": true,
    "special_leg_type": "THANKSGIVING"
  }
]

---

## Power Ratings

### GET /power-ratings/{season}/{week}
Status: Planned

Returns weekly PFF power ratings.
