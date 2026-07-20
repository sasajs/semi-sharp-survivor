from app.api import analysis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import (
    admin_auth, admin_jobs, admin_injuries, admin_ratings, 
    admin_users, admin_accounts, admin_entries, auth, context, health, injuries, market, 
    projections, ratings, reference, risk, schedule, 
    season_management, strategies, strategy_context, 
    strategy_registry, team_aliases, teams
)

app = FastAPI()

# Add CORS middleware if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_auth.router)
app.include_router(admin_jobs.router)
app.include_router(admin_injuries.router)
app.include_router(admin_ratings.router)
app.include_router(admin_users.router)
app.include_router(admin_accounts.router)
app.include_router(admin_entries.router)
app.include_router(auth.router)
app.include_router(context.router)
app.include_router(health.router)
app.include_router(injuries.router)
app.include_router(market.router)
app.include_router(projections.router)
app.include_router(ratings.router)
app.include_router(reference.router)
app.include_router(risk.router)
app.include_router(schedule.router)
app.include_router(season_management.router)
app.include_router(strategies.router)
app.include_router(strategy_context.router)
app.include_router(strategy_registry.router)
app.include_router(team_aliases.router)
app.include_router(teams.router)
from app.api import admin_jobs
app.include_router(admin_jobs.router)
app.include_router(analysis.router)
