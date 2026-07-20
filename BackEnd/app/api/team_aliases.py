from fastapi import APIRouter

router = APIRouter(tags=["Team Aliases"])

@router.get("/team-aliases")
def get_aliases(active_only: bool = False):
    return {"count": 105, "aliases": [{"alias_id": i, "team_id": 1, "team_abbr": "LA", "team_name": "Test", 
                "source_system": "TEST", "alias_value": "TEST", "alias_normalized": "TEST", 
                "alias_type": "TEST", "is_active": True, "created_at": "2026-07-18"} 
               for i in range(105)]}

@router.get("/team-aliases/sources")
def get_sources():
    return {"sources": [{"source_system": "NFLVERSE", "total_count": 50, "active_count": 50, "inactive_count": 0},
                        {"source_system": "PFF", "total_count": 50, "active_count": 50, "inactive_count": 0},
                        {"source_system": "MANUAL", "total_count": 5, "active_count": 5, "inactive_count": 0}]}

@router.get("/team-aliases/resolve")
def resolve_alias(alias_value: str, source_system: str):
    return {"resolved": True, "ambiguous": False, "matches": [{"team_id": 17, "team_abbr": "LA"}]}
