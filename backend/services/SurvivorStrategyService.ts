import { SurvivorStrategyType, SurvivorEntryStrategy } from "../../src/types";
import { survivorStrategyRoadmapRepo } from "../repositories/index";

export const DEFAULT_STRATEGIES: Record<SurvivorStrategyType, Omit<SurvivorEntryStrategy, "entry_id">> = {
  [SurvivorStrategyType.CHAMPIONSHIP]: {
    strategy_type: SurvivorStrategyType.CHAMPIONSHIP,
    strategy_name: "Championship Optimization",
    strategy_description: "Maximize long-term contest equity and prize expected value.",
    risk_tolerance: "MEDIUM_HIGH",
    diversification_weight: 0.15,
    future_value_weight: 0.30,
    survival_weight: 0.25,
    ownership_leverage_weight: 0.20,
    marketplace_weight: 0.05,
    consensus_weight: 0.05,
  },
  [SurvivorStrategyType.DIVERSIFICATION]: {
    strategy_type: SurvivorStrategyType.DIVERSIFICATION,
    strategy_name: "Portfolio Diversification",
    strategy_description: "Avoid unnecessary overlap with other portfolio entries to maximize combined survival probability.",
    risk_tolerance: "MEDIUM",
    diversification_weight: 0.40,
    future_value_weight: 0.15,
    survival_weight: 0.25,
    ownership_leverage_weight: 0.10,
    marketplace_weight: 0.05,
    consensus_weight: 0.05,
  },
  [SurvivorStrategyType.MARKETPLACE]: {
    strategy_type: SurvivorStrategyType.MARKETPLACE,
    strategy_name: "Marketplace Resale",
    strategy_description: "Prioritize early-week survival and resale value through approximately Week 4 or Week 5.",
    risk_tolerance: "LOW",
    diversification_weight: 0.10,
    future_value_weight: 0.05,
    survival_weight: 0.45,
    ownership_leverage_weight: 0.05,
    marketplace_weight: 0.30,
    consensus_weight: 0.05,
  },
  [SurvivorStrategyType.GROUP_CONSENSUS]: {
    strategy_type: SurvivorStrategyType.GROUP_CONSENSUS,
    strategy_name: "Group Consensus",
    strategy_description: "Favor high-confidence, easy-to-explain selections with consensus across multiple models.",
    risk_tolerance: "LOW",
    diversification_weight: 0.05,
    future_value_weight: 0.10,
    survival_weight: 0.35,
    ownership_leverage_weight: 0.05,
    marketplace_weight: 0.05,
    consensus_weight: 0.40,
  },
  [SurvivorStrategyType.CONSERVATIVE]: {
    strategy_type: SurvivorStrategyType.CONSERVATIVE,
    strategy_name: "Conservative Survival",
    strategy_description: "Maximize current survival probability while preserving obvious future value.",
    risk_tolerance: "VERY_LOW",
    diversification_weight: 0.05,
    future_value_weight: 0.10,
    survival_weight: 0.70,
    ownership_leverage_weight: 0.05,
    marketplace_weight: 0.05,
    consensus_weight: 0.05,
  },
  [SurvivorStrategyType.CONTRARIAN]: {
    strategy_type: SurvivorStrategyType.CONTRARIAN,
    strategy_name: "Contrarian Leverage",
    strategy_description: "Increase ownership leverage when risk remains acceptable to jump field size.",
    risk_tolerance: "HIGH",
    diversification_weight: 0.10,
    future_value_weight: 0.15,
    survival_weight: 0.20,
    ownership_leverage_weight: 0.45,
    marketplace_weight: 0.05,
    consensus_weight: 0.05,
  },
  [SurvivorStrategyType.CUSTOM]: {
    strategy_type: SurvivorStrategyType.CUSTOM,
    strategy_name: "Custom Rules",
    strategy_description: "Custom weighting parameters for specific entry conditions.",
    risk_tolerance: "MEDIUM",
    diversification_weight: 0.20,
    future_value_weight: 0.20,
    survival_weight: 0.20,
    ownership_leverage_weight: 0.20,
    marketplace_weight: 0.10,
    consensus_weight: 0.10,
  }
};

export class SurvivorStrategyService {
  /**
   * Assign strategy to entry
   */
  async assignStrategy(entryId: string, strategyType: SurvivorStrategyType): Promise<SurvivorEntryStrategy> {
    const defaults = DEFAULT_STRATEGIES[strategyType];
    const strategy: SurvivorEntryStrategy = {
      entry_id: entryId,
      strategy_type: strategyType,
      strategy_name: defaults.strategy_name,
      strategy_description: defaults.strategy_description,
      risk_tolerance: defaults.risk_tolerance,
      diversification_weight: defaults.diversification_weight,
      future_value_weight: defaults.future_value_weight,
      survival_weight: defaults.survival_weight,
      ownership_leverage_weight: defaults.ownership_leverage_weight,
      marketplace_weight: defaults.marketplace_weight,
      consensus_weight: defaults.consensus_weight,
      is_active: true
    };
    return await survivorStrategyRoadmapRepo.saveStrategy(strategy);
  }

  /**
   * Retrieve active strategy
   */
  async getActiveStrategy(entryId: string): Promise<SurvivorEntryStrategy> {
    const existing = await survivorStrategyRoadmapRepo.getStrategyByEntryId(entryId);
    if (existing) {
      return existing;
    }
    
    // Assign default based on entry ID name to keep realistic mappings
    let defaultType = SurvivorStrategyType.CHAMPIONSHIP;
    if (entryId.includes("UWOSH-2") || entryId.includes("102")) {
      defaultType = SurvivorStrategyType.DIVERSIFICATION;
    } else if (entryId.includes("UWOSH-3") || entryId.includes("103")) {
      defaultType = SurvivorStrategyType.MARKETPLACE;
    } else if (entryId.includes("UWOSH-4") || entryId.includes("104")) {
      defaultType = SurvivorStrategyType.GROUP_CONSENSUS;
    }
    
    return await this.assignStrategy(entryId, defaultType);
  }

  /**
   * Update strategy weights
   */
  async updateStrategy(strategy: SurvivorEntryStrategy): Promise<SurvivorEntryStrategy> {
    return await survivorStrategyRoadmapRepo.saveStrategy(strategy);
  }

  /**
   * Provide default strategy settings
   */
  getDefaultSettings(strategyType: SurvivorStrategyType): Omit<SurvivorEntryStrategy, "entry_id"> {
    return DEFAULT_STRATEGIES[strategyType];
  }

  /**
   * Get all active strategies in DB
   */
  async getAllStrategies(): Promise<SurvivorEntryStrategy[]> {
    return await survivorStrategyRoadmapRepo.getAllStrategies();
  }
}

export const survivorStrategyService = new SurvivorStrategyService();
