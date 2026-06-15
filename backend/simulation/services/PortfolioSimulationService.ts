import { SimulationConfig, PortfolioSurvivalProjection, EntrySurvivalProjection } from "../models";
import { legRepo, lineRepo, teamRepo, inventoryRepo } from "../../repositories";
import { getSeededRandom } from "./SeasonPathSimulationService";

export class PortfolioSimulationService {
  /**
   * Simulates active survivor entries jointly to calculate portfolio correlation,
   * joint probability of having at least one entry survive, and risk concentrations.
   */
  static async simulatePortfolio(
    entries: { id: string; name: string }[],
    startLegId: string,
    config: SimulationConfig
  ): Promise<PortfolioSurvivalProjection> {
    const iterations = config.iterations || 10000;
    const maxRuntime = config.max_runtime_ms || 3000;
    const rand = config.seed ? getSeededRandom(config.seed + "portfolio") : Math.random;

    const startTime = Date.now();

    // 1. Fetch remaining legs
    const allLegs = await legRepo.getAll();
    allLegs.sort((a, b) => a.display_order - b.display_order);
    const startIndex = allLegs.findIndex(l => l.id === startLegId);
    const remainingLegs = startIndex !== -1 ? allLegs.slice(startIndex) : allLegs;

    // 2. Fetch inventory for each entry
    const inventories: Record<string, string[]> = {};
    for (const ent of entries) {
      const inv = await inventoryRepo.getByEntryIdAndLeg(ent.id, startLegId);
      inventories[ent.id] = inv?.used_teams || [];
    }

    // 3. Gather win probabilities & team popularities
    const winProbabilities: Record<string, Record<string, number>> = {};
    const teamNames: Record<string, string> = {};
    const teams = await teamRepo.getAll();
    for (const t of teams) {
      teamNames[t.id] = t.name;
    }

    for (const leg of remainingLegs) {
      const lines = await lineRepo.getByLegId(leg.id);
      winProbabilities[leg.id] = {};
      for (const line of lines) {
        winProbabilities[leg.id][line.team_id] = line.win_probability;
      }
    }

    const entrySurvivalCounts: Record<string, number> = {};
    const entryTotalWeeks: Record<string, number> = {};
    for (const ent of entries) {
      entrySurvivalCounts[ent.id] = 0;
      entryTotalWeeks[ent.id] = 0;
    }

    let jointSurvivalCount = 0; // Cumulative trials where AT LEAST ONE entry survives
    const teamExposureCounts: Record<string, number> = {}; // Tracks how many entries picked this team across all legs/trials
    let duplicatedPicksCount = 0; // Tracks instances where multiple entries picked the same team in the same leg in the same trial
    let totalPicksEvaluated = 0;

    // Run Joint Simulation Iterations
    let simIdx = 0;
    for (simIdx = 0; simIdx < iterations; simIdx++) {
      if (simIdx % 500 === 0 && Date.now() - startTime > maxRuntime) {
        break;
      }

      // Generate Joint NFL Game Outcomes for this iteration
      // For each leg and each team, did they win? (Consistent outcome per iteration)
      const simulationLegOutcomes: Record<string, Record<string, boolean>> = {};
      for (const leg of remainingLegs) {
        simulationLegOutcomes[leg.id] = {};
        const legProbs = winProbabilities[leg.id] || {};
        for (const teamId of Object.keys(legProbs)) {
          simulationLegOutcomes[leg.id][teamId] = rand() < (legProbs[teamId] || 0.5);
        }
      }

      const entryIsAlive = new Set<string>(entries.map(e => e.id));
      const entryUsedTeams: Record<string, Set<string>> = {};
      for (const ent of entries) {
        entryUsedTeams[ent.id] = new Set<string>(inventories[ent.id]);
      }

      // Track picks made in this iteration to calculate duplication metrics
      for (const leg of remainingLegs) {
        const legPicksInIteration: string[] = [];

        for (const ent of entries) {
          if (!entryIsAlive.has(ent.id)) continue;

          // Select team based on config strategy profile
          const legProbs = winProbabilities[leg.id] || {};
          const candidates = Object.keys(legProbs).filter(tId => !entryUsedTeams[ent.id].has(tId));
          if (candidates.length === 0) {
            entryIsAlive.delete(ent.id);
            continue;
          }

          // Pick model logic (Safe strategy default for portfolio correlation checks)
          candidates.sort((a, b) => (legProbs[b] || 0) - (legProbs[a] || 0));
          const selectedTeam = candidates[0];

          if (!selectedTeam) {
            entryIsAlive.delete(ent.id);
            continue;
          }

          legPicksInIteration.push(selectedTeam);
          entryUsedTeams[ent.id].add(selectedTeam);

          // Track exposure
          teamExposureCounts[selectedTeam] = (teamExposureCounts[selectedTeam] || 0) + 1;
          totalPicksEvaluated++;

          // Evaluate joint outcome
          const didWin = simulationLegOutcomes[leg.id][selectedTeam] ?? false;
          if (didWin) {
            entryTotalWeeks[ent.id]++;
          } else {
            entryIsAlive.delete(ent.id);
          }
        }

        // Count duplicated picking in the same leg
        const uniquePicks = new Set(legPicksInIteration);
        duplicatedPicksCount += (legPicksInIteration.length - uniquePicks.size);
      }

      // Check joint survival
      if (entryIsAlive.size > 0) {
        jointSurvivalCount++;
        for (const aliveId of entryIsAlive) {
          entrySurvivalCounts[aliveId]++;
        }
      }
    }

    const completedIterations = simIdx || iterations;

    // Convert metrics
    const entryProjections: EntrySurvivalProjection[] = entries.map(ent => ({
      entry_id: ent.id,
      entry_name: ent.name,
      survival_probability: completedIterations > 0 ? entrySurvivalCounts[ent.id] / completedIterations : 0,
      average_weeks_survived: completedIterations > 0 ? entryTotalWeeks[ent.id] / completedIterations : 0,
      path_count: completedIterations
    }));

    const jointProb = completedIterations > 0 ? jointSurvivalCount / completedIterations : 0;
    
    // Duplicated risk score (0 to 1 scale)
    const duplicatedRisk = totalPicksEvaluated > 0 ? duplicatedPicksCount / totalPicksEvaluated : 0;

    // Concentrated exposures (as percentages)
    const concentratedExposures: Record<string, number> = {};
    for (const tId of Object.keys(teamExposureCounts)) {
      if (totalPicksEvaluated > 0) {
        concentratedExposures[teamNames[tId] || tId] = teamExposureCounts[tId] / totalPicksEvaluated;
      }
    }

    return {
      entry_projections: entryProjections,
      duplicated_risk_score: Math.min(1.0, duplicatedRisk * 5), // Scale metric for visual representation
      portfolio_survival_probability: jointProb,
      concentrated_exposures: concentratedExposures
    };
  }
}
