import { 
  SimulationConfig, 
  SimulationRun, 
  ChalkUpsetScenario, 
  StrategyComparison, 
  FutureInventoryProjection 
} from "../models";
import { 
  entryRepo, 
  lineRepo, 
  teamRepo, 
  legRepo, 
  inventoryRepo, 
  futureValueRepo, 
  reservationRepo, 
  simulationRunRepo 
} from "../../repositories";
import { SeasonPathSimulationService } from "./SeasonPathSimulationService";
import { PortfolioSimulationService } from "./PortfolioSimulationService";
import { VersionTrackingService } from "../../history/services/versionTrackingService";

export class SimulationResultService {
  /**
   * Executes the simulation for a single entry and stores the SimulationRun.
   */
  static async runEntrySimulation(
    entryId: string,
    legId: string,
    config: SimulationConfig
  ): Promise<SimulationRun> {
    const entry = await entryRepo.getById(entryId);
    if (!entry) throw new Error("Entry not found");

    const leg = await legRepo.getById(legId);
    if (!leg) throw new Error("Contest leg not found");

    const { projection, paths } = await SeasonPathSimulationService.simulateEntryPaths(
      entryId,
      entry.name,
      legId,
      config
    );

    const versions = VersionTrackingService.getVersionsForLeg(legId);

    const run: SimulationRun = {
      id: `simrun-${legId}-${Date.now()}`,
      contest_id: "default-contest-id",
      contest_leg_id: legId,
      week_number: leg.nfl_week,
      config,
      entry_projections: [projection],
      portfolio_projection: null,
      chalk_upset_scenario: null,
      strategy_comparison: null,
      future_inventory_projection: null,
      simulation_version: 1,
      data_version: versions.data_version,
      inventory_version: versions.inventory_version,
      risk_version: versions.risk_version,
      recommendation_version: versions.recommendation_version,
      created_at: new Date().toISOString()
    };

    return await simulationRunRepo.save(run);
  }

  /**
   * Runs joint portfolio simulations for all active entries.
   */
  static async runPortfolioSimulation(
    legId: string,
    config: SimulationConfig
  ): Promise<SimulationRun> {
    const leg = await legRepo.getById(legId);
    if (!leg) throw new Error("Contest leg not found");

    const allEntries = await entryRepo.getAll();
    const activeEntries = allEntries.filter(e => e.status !== "eliminated");

    if (activeEntries.length === 0) {
      throw new Error("No active entries found for portfolio simulation");
    }

    const portfolioProj = await PortfolioSimulationService.simulatePortfolio(
      activeEntries.map(e => ({ id: e.id, name: e.name })),
      legId,
      config
    );

    const versions = VersionTrackingService.getVersionsForLeg(legId);

    const run: SimulationRun = {
      id: `simrun-port-${legId}-${Date.now()}`,
      contest_id: "default-contest-id",
      contest_leg_id: legId,
      week_number: leg.nfl_week,
      config,
      entry_projections: portfolioProj.entry_projections,
      portfolio_projection: portfolioProj,
      chalk_upset_scenario: null,
      strategy_comparison: null,
      future_inventory_projection: null,
      simulation_version: 1,
      data_version: versions.data_version,
      inventory_version: versions.inventory_version,
      risk_version: versions.risk_version,
      recommendation_version: versions.recommendation_version,
      created_at: new Date().toISOString()
    };

    return await simulationRunRepo.save(run);
  }

  /**
   * Simulates a Chalk Upset Scenario in the current week/leg.
   */
  static async runChalkUpsetScenario(
    legId: string,
    config: SimulationConfig
  ): Promise<ChalkUpsetScenario> {
    const leg = await legRepo.getById(legId);
    if (!leg) throw new Error("Contest leg not found");

    // Fetch lines on this leg
    const lines = await lineRepo.getByLegId(legId);
    if (lines.length === 0) {
      throw new Error("No lines found for this contest leg");
    }

    // Find highest popularity team -> "The Chalk"
    const sortedLines = [...lines].sort((a, b) => b.pick_popularity - a.pick_popularity);
    const chalkLine = sortedLines[0];

    const team = await teamRepo.getById(chalkLine.team_id);
    const teamName = team?.name || "Chalk Team";

    // Public Field Elimination is proportional to popularity
    const fieldEliminationEstimate = chalkLine.pick_popularity * 100;

    // Check which user entries selected this team in the upcoming leg
    const allEntries = await entryRepo.getAll();
    const activeEntries = allEntries.filter(e => e.status !== "eliminated");
    
    let userEntryImpactCount = 0;
    for (const ent of activeEntries) {
      const inv = await inventoryRepo.getByEntryIdAndLeg(ent.id, legId);
      if (inv?.used_teams?.includes(chalkLine.team_id)) {
        userEntryImpactCount++;
      }
    }

    // Mathematical leverage benefit of fading a chalk team
    const leverageBenefitScore = chalkLine.pick_popularity > 0 
      ? parseFloat(((1 / (1 - chalkLine.pick_popularity)) - 1).toFixed(3)) * 100
      : 0;

    let riskWarning = "Low chalk risk. Safe to proceed with standard pick metrics.";
    if (chalkLine.pick_popularity > 0.35) {
      if (userEntryImpactCount > 0) {
        riskWarning = `CRITICAL EXPOSURE DETECTED: You have ${userEntryImpactCount} entries reliant on ${teamName} (${fieldEliminationEstimate.toFixed(0)}% popularity). A chalk upset will instantly eliminate these entries. Consider hedging/fading!`;
      } else {
        riskWarning = `HIGH CHALK DETECTED: ${teamName} has ${fieldEliminationEstimate.toFixed(0)}% public popularity. Fading them is a major contrarian opportunity, with a high leverage benefit potential of +${leverageBenefitScore.toFixed(0)}% equity.`;
      }
    }

    return {
      chalk_team_id: chalkLine.team_id,
      chalk_team_name: teamName,
      field_elimination_estimate: fieldEliminationEstimate,
      user_entry_impact_count: userEntryImpactCount,
      leverage_benefit_score: leverageBenefitScore,
      risk_warning: riskWarning
    };
  }

  /**
   * Compares the performance of three classic strategy choices on a selected entry.
   */
  static async compareStrategies(
    entryId: string,
    legId: string
  ): Promise<StrategyComparison> {
    // We execute three fast runs with different profiles
    const safeRes = await SeasonPathSimulationService.simulateEntryPaths(entryId, "Comp", legId, {
      iterations: 2000,
      strategy_profile: 'safe'
    });

    const balancedRes = await SeasonPathSimulationService.simulateEntryPaths(entryId, "Comp", legId, {
      iterations: 2000,
      strategy_profile: 'balanced'
    });

    const contrarianRes = await SeasonPathSimulationService.simulateEntryPaths(entryId, "Comp", legId, {
      iterations: 2000,
      strategy_profile: 'contrarian'
    });

    return {
      safe_strategy: {
        survival_probability: safeRes.projection.survival_probability,
        projected_contest_equity: safeRes.projection.survival_probability * 150.0, // Scaled index metric
        inventory_preservation_score: 85, // Preservation index
        risk_exposure_score: 35
      },
      balanced_strategy: {
        survival_probability: balancedRes.projection.survival_probability,
        projected_contest_equity: balancedRes.projection.survival_probability * 250.0,
        inventory_preservation_score: 70,
        risk_exposure_score: 55
      },
      contrarian_strategy: {
        survival_probability: contrarianRes.projection.survival_probability,
        projected_contest_equity: contrarianRes.projection.survival_probability * 450.0,
        inventory_preservation_score: 50,
        risk_exposure_score: 80
      }
    };
  }

  /**
   * Generates projected inventory constraints, danger weeks, and holiday shortages.
   */
  static async projectFutureInventory(
    entryId: string,
    startLegId: string
  ): Promise<FutureInventoryProjection> {
    const allLegs = await legRepo.getAll();
    allLegs.sort((a, b) => a.display_order - b.display_order);
    const startIndex = allLegs.findIndex(l => l.id === startLegId);
    const remainingLegs = startIndex !== -1 ? allLegs.slice(startIndex) : allLegs;

    const inv = await inventoryRepo.getByEntryIdAndLeg(entryId, startLegId);
    const used_teams = inv?.used_teams || [];

    const fvProfiles = await futureValueRepo.getProfilesByLeg(startLegId);
    const fvScoresMap = new Map(fvProfiles.map(p => [p.team_id, p.future_value_score]));

    const dangerous_weeks: { week_number: number; leg_id: string; danger_score: number; reason: string }[] = [];
    const weak_inventory_points: { team_id: string; available_count: number; reason: string }[] = [];
    const holiday_inventory_shortages: { holiday_type: 'thanksgiving' | 'christmas'; available_teams_count: number; warning: boolean }[] = [];
    const elite_team_preservation_problems: string[] = [];

    // Check holiday constraints
    const thanksgivingLeg = remainingLegs.find(l => l.leg_type === "thanksgiving");
    if (thanksgivingLeg) {
      const thanksgivingRes = await reservationRepo.getHolidayReservations(entryId);
      const isReserved = thanksgivingRes.length > 0;
      holiday_inventory_shortages.push({
        holiday_type: 'thanksgiving',
        available_teams_count: isReserved ? 2 : 0,
        warning: !isReserved
      });
    }

    const christmasLeg = remainingLegs.find(l => l.leg_type === "christmas");
    if (christmasLeg) {
      const christmasRes = await reservationRepo.getHolidayReservations(entryId);
      const isReserved = christmasRes.length > 0;
      holiday_inventory_shortages.push({
        holiday_type: 'christmas',
        available_teams_count: isReserved ? 2 : 0,
        warning: !isReserved
      });
    }

    const eliteTeams = fvProfiles.filter(p => p.future_value_score >= 80).map(p => p.team_id);
    const usedEliteTeams = eliteTeams.filter(tId => used_teams.includes(tId));
    if (usedEliteTeams.length > eliteTeams.length * 0.6) {
      elite_team_preservation_problems.push(
        `Alert: You have depleted ${usedEliteTeams.length} out of ${eliteTeams.length} elite teams too early. Safe options for late-season multi-split legs are highly constrained.`
      );
    }

    // Identify weak weeks and dangerous weeks
    for (const leg of remainingLegs) {
      const lines = await lineRepo.getByLegId(leg.id);
      const availableLines = lines.filter(line => !used_teams.includes(line.team_id));

      if (availableLines.length <= 3) {
        dangerous_weeks.push({
          week_number: leg.nfl_week,
          leg_id: leg.id,
          danger_score: 90,
          reason: `High risk: Only ${availableLines.length} available picking alternatives on this leg. Depleting them early creates path termination risk.`
        });
      } else {
        const sortedLines = [...availableLines].sort((a,b) => b.win_probability - a.win_probability);
        const maxWinProb = sortedLines[0]?.win_probability || 0;
        if (maxWinProb < 0.65) {
          dangerous_weeks.push({
            week_number: leg.nfl_week,
            leg_id: leg.id,
            danger_score: 75,
            reason: `Restricted options: No highly-favored option remains. Maximum available safety is ${(maxWinProb * 100).toFixed(0)}%.`
          });
        }
      }
    }

    return {
      dangerous_weeks,
      weak_inventory_points,
      holiday_inventory_shortages,
      elite_team_preservation_problems
    };
  }
}
