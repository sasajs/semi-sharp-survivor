# HISTORICAL REPLAY & STRATEGY BACKTESTING ENGINE

Welcome to the **Semi-Sharp Historical Replay Engine** documentation. This framework acts as an offline intelligence layer used to replay prior NFL survivor seasons, backtest pick heuristics, validate strategy configurations, and evaluate decision-making quality over historical data benchmarks.

---

## 1. ARCHITECTURE & CONTEXT

The Historical Replay Engine is constructed as a decoupled diagnostic layer within the Node.js context. It interacts with the state space of previous seasons to simulate step-by-step progress, evaluating survivor results deterministically.

```
+-------------------------------------------------------------+
|               ADMIN STRATEGY CONTROL PANEL                  |
+-------------------------------------------------------------+
                              |
                    POST /api/replay/execute
                              |
                              v
+-------------------------------------------------------------+
|                  HISTORICAL REPLAY SERVICE                  |
|     (Simulation driver, loads seasons & saves runs)         |
+-------------------------------------------------------------+
       |                              |                  |
       v                              v                  v
+--------------+               +--------------+   +--------------+
|  Execution   |               |  Evaluation  |   |    Report    |
|   Service    |               |   Service    |   |   Service    |
+--------------+               +--------------+   +--------------+
| - Pick chooser               | - Survivorship|   | - Summary    |
| - Outcome map                | - Asset drain|   | - Markdown   |
| - Spent inv  |               | - Decisives  |   |   terminal   |
+--------------+               +--------------+   +--------------+
```

---

## 2. REPLAY LIFECYCLE & EXECUTION FLOW

Upon triggering a backtest:

1. **Instantiation**: The config structure specifies target season, strategy preference ("safe", "aggressive", "balanced"), and week span boundaries.
2. **Deterministic NFL Load**:
   - For seasons **2023**, **2024**, and **2025**, the system retrieves 18 weeks of full-fidelity team pairings. Match outcomes are resolved deterministically using a seed-based trigonometric simulation so ratings stay authentic, stable, and perfectly reproducible.
3. **Stepwise Simulation Loop**:
   - For each week from $Start$ to $End$:
     - **Constraint Check**: Filters out teams that are already present in the execution's `inventorySpent` array.
     - **Pick Selection**: Applies heuristics matching the requested `strategyPreference` (e.g., favoring absolute team rating differentials under `'safe'`, saving strength under `'aggressive'`, or checking secondary ranks under `'balanced'`).
     - **Resolution**: Looks up the winner of the resulting matchup. If the pick matches the winner, the simulation marks the week as `"SURVIVED"`, updates margin points scored, appends the team to consumed inventory, and continues.
     - **Exception Halt**: If the pick matches the loser of that historical game, the week is flagged as `"ELIMINATED"`. In accordance with Survivor rules, the simulation enters an immediate break status, halting next-week progression.
4. **Insight Synthesis**:
   - The completed week array is passed to `ReplayEvaluationService` to compute survival metrics and inventory optimization metrics.
   - The output is summarized into a `ReplaySummary` scorecard, while the full details compile into an analytical markdown report.
5. **In-Memory Registry Persistence**:
   - Saved with a unique timestamp identifier. History resides in the thread context for comparative strategy validation.

---

## 3. EVALUATION FRAMEWORK METRICS

To benchmark strategy proficiency, the engine calculates four composite metrics mapped to a `0-100` range:

### A. Survival Rate ($\%$)
Calculates direct survivorship:
$$\text{Survival Rate} = \left( \frac{\text{Weeks Survived}}{\text{Total Played}} \right) \times 100$$

### B. Inventory Efficiency ($\%$)
Measures conservation of valuable teams.
- **Formula**: Tracks the average strength of picked teams against an baseline average of 65.
- **Why it matters**: Surviving using mid-tier or low-powerhouse teams (e.g., preservation of elite squads like KC, SF, BAL for crucial late weeks) is heavily incentivized, yielding higher efficiency scores, while prematurely consuming top-ranked teams drops this score.
- **Penalty**: Cut by $20\%$ if the backtest results in an early season elimination.

### C. Decisive Yield Recommendation Score ($\%$)
Indicates the level of cushion of the chosen path.
- **Formula**: Derived from cumulative points-scored differential from winning picks. Safe picks with high margins rank high, whereas razor-thin field goal margins result in tighter cushions, pulling down safety scores.

### D. Statistical Model Confidence Score ($\%$)
Overall model assurance. Scales proportionally with survival rate, capping at a maximum of $95\%$ to reflect real-world NFL volatility.

---

## 4. FUTURE PRODUCTION ENHANCEMENTS

When preparing to expand from the simulated mock state to a production database integration, several paths are recommended:

1. **Persistent Execution Tables**:
   - Map execution schemas to PostgreSQL/Firestore models leveraging `Drizzle ORM` to preserve logs indefinitely across separate workspace sessions.
2. **Real-World NFL Feeds**:
   - Feed seasonal data dynamically via external sports data feeds (e.g. Sleeper API, SportsDataIO, or ESPN API) instead of deterministic local mocks.
3. **Advanced AI Optimization**:
   - Integrate the `Gemini API` (e.g. `gemini-3.5-flash`) stream queries to scan historical game weather conditions, roster changes, or injured reserve logs during backtesting to dynamically calculate predictive weights.
4. **Visual Analytics Curves**:
   - Draw dynamic SVG line charts or Recharts curves mapping inventory strength deterioration week-over-week.
