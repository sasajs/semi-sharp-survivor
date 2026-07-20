
---

# 2026-07 Backend Validation Milestone

## Weekly Analysis API

The `/analysis/week/{season}/{week}` endpoint is production-ready.

### Data Sources

- schedule.games
- projections.game_spreads
- market.consensus_spreads
- market.projection_edges
- market.events
- market.spreads
- risk.game_risk_scores

### Market Views

`market.consensus_spreads`

- Uses the most recent line from each sportsbook.
- Computes the median consensus spread.
- Counts distinct sportsbooks.
- Preserves historical snapshots.

`market.projection_edges`

- Uses the latest SemiSharp projection for each game.
- Produces edge calculations for both home and away teams.
- No hardcoded HFA source.
- No hardcoded rating week.

### Validation Status

Backend validation:

- Database validation: PASS
- FastAPI import: PASS
- OpenAPI: PASS
- Analysis endpoint: PASS

Known limitation:

- Game `2026_01_MIA_LV` has no imported market event and therefore has no consensus or edge values.

The backend is considered stable for GUI integration.

