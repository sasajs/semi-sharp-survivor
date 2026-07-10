from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, teams, schedule, projections, risk, strategies, market, injuries, context, strategy_registry, auth


app = FastAPI(
    title="SemiSharp API",
    version="1.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(teams.router)
app.include_router(schedule.router)
app.include_router(projections.router)
app.include_router(risk.router)
app.include_router(strategies.router)
app.include_router(market.router)
app.include_router(injuries.router)
app.include_router(context.router)
app.include_router(strategy_registry.router)
app.include_router(auth.router)
