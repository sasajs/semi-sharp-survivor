import { SimulationConfig, SimulationRun, ChalkUpsetScenario, StrategyComparison, FutureInventoryProjection } from "../models";
import { SimulationResultService } from "./SimulationResultService";

export class MonteCarloSurvivorService {
  /**
   * Run entry level Monte Carlo simulation.
   */
  static async runEntrySimulation(
    entryId: string,
    legId: string,
    config: SimulationConfig
  ): Promise<SimulationRun> {
    return await SimulationResultService.runEntrySimulation(entryId, legId, config);
  }

  /**
   * Run portfolio joint Monte Carlo simulation across active entries.
   */
  static async runPortfolioSimulation(
    legId: string,
    config: SimulationConfig
  ): Promise<SimulationRun> {
    return await SimulationResultService.runPortfolioSimulation(legId, config);
  }

  /**
   * Simulates a chalk team upset and quantifies path survival leverage.
   */
  static async runChalkUpsetScenario(
    legId: string,
    config: SimulationConfig
  ): Promise<ChalkUpsetScenario> {
    return await SimulationResultService.runChalkUpsetScenario(legId, config);
  }

  /**
   * Performs side-by-side strategy evaluations across remaining legs on an entry.
   */
  static async compareStrategies(
    entryId: string,
    legId: string
  ): Promise<StrategyComparison> {
    return await SimulationResultService.compareStrategies(entryId, legId);
  }

  /**
   * Evaluates inventory limits, Thanksgiving/Christmas, and elite-team preservation constraints.
   */
  static async projectFutureInventory(
    entryId: string,
    legId: string
  ): Promise<FutureInventoryProjection> {
    return await SimulationResultService.projectFutureInventory(entryId, legId);
  }
}
