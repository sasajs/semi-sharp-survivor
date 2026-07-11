from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import (
    health, teams, schedule, projections, risk, 
    strategies, market, injuries, context, 
    strategy_registry, auth
)

app = FastAPI(title="SemiSharp API", version="1.0")

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"]
)

# Explicit route registration
app.include_router(health.router)
app.include_router(teams.router)
app.include_router(schedule.router)
app.include_router(projections.router)
app.include_router(risk.router)
app.include_router(strategies.router, prefix="/strategies")
app.include_router(market.router)
app.include_router(injuries.router)
app.include_router(context.router)
app.include_router(strategy_registry.router)
# auth.router already has prefix="/auth", so we include it without additional prefixing
app.include_router(auth.router)

@app.on_event("startup")
async def startup_event():
    """Prints registered routes on startup for verification."""
    for route in app.routes:
        path = getattr(route, 'path', 'N/A')
        methods = getattr(route, 'methods', '')
        print(f"Registered route: {path} {methods}")

@app.get("/")
def read_root():
    return {"message": "SemiSharp Backend Running"}
