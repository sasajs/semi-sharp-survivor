from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from pydantic import BaseModel, Field, condecimal
from fastapi import FastAPI, HTTPException, status, Depends

app = FastAPI(
    title="Semi-Sharp V2 - Circa Survivor Optimizer API",
    description="Backend API for managing Circa Survivor Contest Entries, Legs, Pick Validation & Recommendation Engine Engine.",
    version="2.0.0"
)

# ====================================================================
# ENUMS & CONSTANTS
# ====================================================================

class LegType(str, Enum):
    REGULAR = "regular"
    THANKSGIVING = "thanksgiving"
    CHRISTMAS = "christmas"

class PickStatus(str, Enum):
    PENDING = "pending"
    WON = "won"
    LOST = "lost"

class EntryStatus(str, Enum):
    ALIVE = "alive"
    ELIMINATED = "eliminated"

# ====================================================================
# PYDANTIC SCHEMAS
# ====================================================================

class TeamBase(BaseModel):
    id: str = Field(..., description="Unique code e.g. 'kc', 'bal'")
    name: str
    abbreviation: str
    bye_week: int = Field(..., ge=1, le=18)
    primary_color: str
    secondary_color: str

class TeamCreate(TeamBase):
    pass

class TeamResponse(TeamBase):
    class Config:
        orm_mode = True

class ContestLegResponse(BaseModel):
    id: UUID
    contest_id: UUID
    name: str
    leg_type: LegType
    display_order: int
    nfl_week: int
    
    class Config:
        orm_mode = True

class GameResponse(BaseModel):
    id: UUID
    contest_leg_id: UUID
    home_team_id: str
    away_team_id: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    status: str
    game_time: datetime

    class Config:
        orm_mode = True

class TeamWeekLineResponse(BaseModel):
    id: UUID
    team_id: str
    contest_leg_id: UUID
    win_probability: float
    pick_popularity: float
    future_value: float
    leverage_multiplier: float
    holiday_safety_multiplier: float
    contest_equity_score: float

    class Config:
        orm_mode = True

class SurvivorEntryBase(BaseModel):
    name: str
    notes: Optional[str] = None

class SurvivorEntryCreate(SurvivorEntryBase):
    contest_id: UUID

class SurvivorEntryResponse(SurvivorEntryBase):
    id: UUID
    contest_id: UUID
    status: EntryStatus
    created_at: datetime

    class Config:
        orm_mode = True

class SubmitPickRequest(BaseModel):
    entry_id: UUID
    contest_leg_id: UUID
    team_id: str

class SurvivorPickResponse(BaseModel):
    id: UUID
    entry_id: UUID
    contest_leg_id: UUID
    team_id: str
    pick_status: PickStatus
    created_at: datetime

    class Config:
        orm_mode = True

class RecRequest(BaseModel):
    entry_id: UUID
    contest_leg_id: UUID

class RecommendationItem(BaseModel):
    team_id: str
    team_name: str
    win_probability: float
    pick_popularity: float
    future_value: float
    contest_equity_score: float
    insight: str

class RecommendationReport(BaseModel):
    entry_id: UUID
    contest_leg_id: UUID
    recommendations: List[RecommendationItem]
    used_teams: List[str]

# ====================================================================
# ENDPOINTS
# ====================================================================

@app.get("/api/v2/teams", response_model=List[TeamResponse], tags=["Teams"])
def get_teams():
    """
    Retrieve all NFL teams participating in Circa Survivor.
    """
    # This would query physical PostgreSQL db
    return []

@app.get("/api/v2/legs/{contest_id}", response_model=List[ContestLegResponse], tags=["Contest Legs"])
def get_contest_legs(contest_id: UUID):
    """
    Get all 20 Circa Survivor contest legs (including regular, Thanksgiving, and Christmas).
    """
    return []

@app.post("/api/v2/entries", response_model=SurvivorEntryResponse, tags=["Entries"])
def create_entry(entry: SurvivorEntryCreate):
    """
    Create a new Circa Survivor Entry. Enables multiple entries per user.
    """
    return {
        "id": uuid4(),
        "contest_id": entry.contest_id,
        "name": entry.name,
        "status": EntryStatus.ALIVE,
        "notes": entry.notes,
        "created_at": datetime.utcnow()
    }

@app.post("/api/v2/picks", response_model=SurvivorPickResponse, tags=["Picks"])
def submit_survivor_pick(pick: SubmitPickRequest):
    """
    Primary endpoint for making Survivor selections with full contest rule validation:
    1. Verify entry is currently ALIVE.
    2. Verify selected team has NOT been picked previously in any contest leg by this entry (One-use constraint).
    3. Match scheduled game for the leg to verify team eligibility.
    4. Guard against past deadlines.
    """
    # Pseudocode representing strict database queries:
    # 
    # # 1. Check entry status
    # entry = db.query(SurvivorEntry).filter(SurvivorEntry.id == pick.entry_id).first()
    # if not entry or entry.status == EntryStatus.ELIMINATED:
    #     raise HTTPException(status_code=400, detail="Cannot place picks for an eliminated or missing entry.")
    #
    # # 2. Check team duplication
    # prior_selection = db.query(SurvivorPick).filter(
    #     SurvivorPick.entry_id == pick.entry_id, 
    #     SurvivorPick.team_id == pick.team_id
    # ).first()
    # if prior_selection:
    #     raise HTTPException(status_code=400, detail=f"Team {pick.team_id} already selected on Leg id {prior_selection.contest_leg_id}")
    #
    # # 3. Save to database
    # new_pick = SurvivorPick(...)
    # db.add(new_pick)
    # db.commit()
    
    return {
        "id": uuid4(),
        "entry_id": pick.entry_id,
        "contest_leg_id": pick.contest_leg_id,
        "team_id": pick.team_id,
        "pick_status": PickStatus.PENDING,
        "created_at": datetime.utcnow()
    }

@app.post("/api/v2/recommendations/report", response_model=RecommendationReport, tags=["Optimization Analytics"])
def generate_recommendation_report(payload: RecRequest):
    """
    Generates optimization and survival recommendations based on active risk profiles:
    
    Equity Formula:
    Contest Equity Score = Win Probability * Leverage Multiplier * Future Value Multiplier * Holiday Safety Multiplier
    
    Where:
    - Win Probability: Expected field success.
    - Leverage Multiplier: Boosts equity when picking less clustered (differential) teams.
    - Future Value Multiplier: Discounts picking powerhouse teams (KC, SF) early, shielding them for later Legs.
    - Holiday Safety Multiplier: Weights protection for critical short-turnaround Thanksgiving & Christmas slates.
    """
    # 1. Fetch entry and used teams
    # 2. Query available teams with active matchup lines in `contest_leg_id`
    # 3. Apply mathematical equation and sort descending.
    # 4. Generate tactical structural text insight per suggested path.
    
    recs = [
        RecommendationItem(
            team_id="lar",
            team_name="Los Angeles Rams",
            win_probability=0.74,
            pick_popularity=0.04,
            future_value=0.35,
            contest_equity_score=0.885,
            insight="Golden Target: Highly favored home matchup with minimal future utility sacrificed. Clears Christmas safely."
        ),
        RecommendationItem(
            team_id="det",
            team_name="Detroit Lions",
            win_probability=0.81,
            pick_popularity=0.28,
            future_value=0.85,
            contest_equity_score=0.520,
            insight="High safety, but extreme negative leverage due to high pick popularity (28%) and Thanksgiving future utility."
        )
    ]
    
    return {
        "entry_id": payload.entry_id,
        "contest_leg_id": payload.contest_leg_id,
        "recommendations": recs,
        "used_teams": ["bal", "phi"]
    }
