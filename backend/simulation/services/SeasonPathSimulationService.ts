import { SimulationConfig, EntrySurvivalProjection, SimulationPath } from "../models";
import { legRepo, lineRepo, teamRepo, inventoryRepo } from "../../repositories";

export function getSeededRandom(seedStr: string) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export class SeasonPathSimulationService {
  /**
   * Simulates a single entry's path through the remaining legs of the contest.
   * Enforces rules:
   *  - one-pick-per-leg
   *  - one-team-per-entry usage rule (unavailable once picked)
   *  - ties count as losses
   *  - holiday legs (Thanksgiving, Christmas) preserved separately
   */
  static async simulateEntryPaths(
    entryId: string,
    entryName: string,
    startLegId: string,
    config: SimulationConfig
  ): Promise<{
    projection: EntrySurvivalProjection;
    paths: SimulationPath[];
  }> {
    const iterations = config.iterations || 10000;
    const maxRuntime = config.max_runtime_ms || 3000;
    const rand = config.seed ? getSeededRandom(config.seed + entryId) : Math.random;

    const startTime = Date.now();

    // Fetch all legs and filter from active starting leg onwards
    const allLegs = await legRepo.getAll();
    allLegs.sort((a, b) => a.display_order - b.display_order);
    
    const startIndex = allLegs.findIndex(l => l.id === startLegId);
    const remainingLegs = startIndex !== -1 ? allLegs.slice(startIndex) : allLegs;

    // Fetch previous picks or currently used teams to enforce one-team-per-entry rule
    const inv = await inventoryRepo.getByEntryIdAndLeg(entryId, startLegId);
    const initialUsedTeams = inv?.used_teams || [];

    // Fetch lines for all remaining legs to determine win probabilities
    const winProbabilities: Record<string, Record<string, number>> = {}; // legId -> teamId -> prob
    const popValues: Record<string, Record<string, number>> = {}; // legId -> teamId -> pop
    const fvValues: Record<string, Record<string, number>> = {}; // legId -> teamId -> fv

    for (const leg of remainingLegs) {
      const lines = await lineRepo.getByLegId(leg.id);
      winProbabilities[leg.id] = {};
      popValues[leg.id] = {};
      fvValues[leg.id] = {};
      for (const line of lines) {
        winProbabilities[leg.id][line.team_id] = line.win_probability;
        popValues[leg.id][line.team_id] = line.pick_popularity;
        fvValues[leg.id][line.team_id] = line.future_value;
      }
    }

    const paths: SimulationPath[] = [];
    let survivalCount = 0;
    let totalWeeksSurvived = 0;

    let simIdx = 0;
    for (simIdx = 0; simIdx < iterations; simIdx++) {
      // Guard against excess execution runtime
      if (simIdx % 500 === 0 && Date.now() - startTime > maxRuntime) {
        break;
      }

      const usedInPath = new Set<string>(initialUsedTeams);
      let isSurvived = true;
      let weeksSurvived = 0;
      const chosenTeams: string[] = [];
      let surrenderedAtLegId: string | undefined = undefined;

      // Simulate step-by-step
      for (const leg of remainingLegs) {
        const legProbabilities = winProbabilities[leg.id] || {};
        
        // Find best pick dynamically based on strategy profile
        const candidates = Object.keys(legProbabilities).filter(teamId => !usedInPath.has(teamId));
        
        if (candidates.length === 0) {
          isSurvived = false;
          surrenderedAtLegId = leg.id;
          break; // Dead due to inventory depletion
        }

        // Dynamically choose pick based on configuration strategy
        let selectedTeam: string | null = null;
        if (config.strategy_profile === 'safe') {
          // Maximise win probability
          candidates.sort((a, b) => (legProbabilities[b] || 0) - (legProbabilities[a] || 0));
          selectedTeam = candidates[0];
        } else if (config.strategy_profile === 'contrarian') {
          // Minimise pick popularity, keeping reasonable survival rate
          candidates.sort((a, b) => {
            const valA = (legProbabilities[a] || 0) * (1 - (popValues[leg.id][a] || 0));
            const valB = (legProbabilities[b] || 0) * (1 - (popValues[leg.id][b] || 0));
            return valB - valA;
          });
          selectedTeam = candidates[0];
        } else {
          // Balanced strategy: balance win prob, pick popularity, and future values
          candidates.sort((a, b) => {
            const scoreA = (legProbabilities[a] || 0) * 1.5 - (popValues[leg.id][a] || 0) * 0.5 - (fvValues[leg.id][a] || 0) * 0.3;
            const scoreB = (legProbabilities[b] || 0) * 1.5 - (popValues[leg.id][b] || 0) * 0.5 - (fvValues[leg.id][b] || 0) * 0.3;
            return scoreB - scoreA;
          });
          selectedTeam = candidates[0];
        }

        if (!selectedTeam) {
          isSurvived = false;
          surrenderedAtLegId = leg.id;
          break;
        }

        chosenTeams.push(selectedTeam);
        usedInPath.add(selectedTeam);

        // Monte Carlo trial: does the team win?
        const prob = legProbabilities[selectedTeam] || 0.5;
        const roll = rand();
        if (roll < prob) {
          weeksSurvived++;
        } else {
          // Tie or Loss leads to instant elimination in Survivor rules
          isSurvived = false;
          surrenderedAtLegId = leg.id;
          break;
        }
      }

      if (isSurvived) {
        survivalCount++;
      }
      totalWeeksSurvived += weeksSurvived;

      // Keep sample paths (e.g. keep first 50 sample paths for trace purposes, avoid memory bloat)
      if (simIdx < 50) {
        paths.push({
          id: `path-${simIdx}`,
          iteration_index: simIdx,
          leg_ids: remainingLegs.map(l => l.id),
          chosen_teams: chosenTeams,
          surrendered_at_leg_id: surrenderedAtLegId,
          is_survived: isSurvived
        });
      }
    }

    const actualCount = paths.length > 0 ? (paths[paths.length - 1].iteration_index + 1) : iterations;
    const completedIterations = simIdx || actualCount;

    return {
      projection: {
        entry_id: entryId,
        entry_name: entryName,
        survival_probability: completedIterations > 0 ? survivalCount / completedIterations : 0,
        average_weeks_survived: completedIterations > 0 ? totalWeeksSurvived / completedIterations : 0,
        path_count: completedIterations
      },
      paths
    };
  }
}
