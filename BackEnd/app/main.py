from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    admin_jobs,
    admin_injuries,
    admin_ratings,
    auth,
    context,
    health,
    injuries,
    market,
    projections,
    ratings,
    reference,
    risk,
    schedule,
    season_management,
    strategies,
    strategy_context,
    strategy_registry,
    teams,
    team_aliases,
)


app = FastAPI(
    title="SemiSharp API",
    version="1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


routers = [
    admin_jobs.router,
    admin_injuries.router,
    admin_ratings.router,
    health.router,
    teams.router,
    team_aliases.router,
    schedule.router,
    projections.router,
    ratings.router,
    reference.router,
    risk.router,
    market.router,
    injuries.router,
    context.router,
    strategy_context.router,
    season_management.router,
    strategy_registry.router,
    auth.router,
]


for router in routers:
    app.include_router(router)


app.include_router(
    strategies.router,
    prefix="/strategies",
)


@app.on_event("startup")
async def startup_event():
    """
    Print registered routes during service startup.
    """
    for route in app.routes:
        path = getattr(
            route,
            "path",
            "N/A",
        )
        methods = getattr(
            route,
            "methods",
            "",
        )

        print(
            f"Registered route: {path} {methods}"
        )


@app.get("/")
def read_root():
    return {
        "message": "SemiSharp Backend Running"
    }
