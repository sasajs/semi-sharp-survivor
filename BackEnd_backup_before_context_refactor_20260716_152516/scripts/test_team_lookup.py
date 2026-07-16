from pprint import pprint
from app.repositories.team_repository import get_team_lookup

lookup = get_team_lookup()

for team in ["LA", "LAR", "LAC", "NE", "ARI"]:
    print(f"{team} -> {lookup.get(team)}")
