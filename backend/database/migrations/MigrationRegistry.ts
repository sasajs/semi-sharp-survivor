import path from "path";

export interface Migration {
  version: string;
  description: string;
  filePath: string;
}

export const migrationRegistry: Migration[] = [
  {
    version: "V001",
    description: "Initial schema for teams, contests, picks, workflow execution traces, and historical snapshots.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "V001_InitialSchema.sql")
  },
  {
    version: "V027",
    description: "Project memory, system metadata, application versions, project decisions, and operations events audit tables.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "027_project_memory_foundation.sql")
  },
  {
    version: "V028",
    description: "Feature Store Foundation: feature_definitions, feature_snapshots, and feature_build_runs tables.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "028_feature_store_foundation.sql")
  },
  {
    version: "V029",
    description: "Entry Strategy Profiles Foundation: entry_metadata and entry_strategy_profiles audit records and tables.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "029_entry_strategy_profiles.sql")
  },
  {
    version: "V030",
    description: "Entry Metadata and Explainability Refinement.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "030_entry_metadata_and_explainability.sql")
  },
  {
    version: "V031",
    description: "Future Team Value Engine: future_team_values calculations schema.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "031_future_team_values.sql")
  },
  {
    version: "V032",
    description: "Survivor Equity Engine: survivor_equity_snapshots schema.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "032_survivor_equity_snapshots.sql")
  },
  {
    version: "V033",
    description: "Recommendation Candidate Engine: recommendation_candidates schema.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "033_recommendation_candidates.sql")
  },
  {
    version: "V034",
    description: "Ownership & Contest Dynamics Foundation: ownership_projections and contest_dynamics_snapshots tables.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "034_ownership_and_contest_dynamics.sql")
  },
  {
    version: "V035",
    description: "Survivor Recommendation Engine: survivor_recommendations table.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "035_survivor_recommendations.sql")
  },
  {
    version: "V036",
    description: "Recommendation Audit Engine: recommendation_audits table.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "036_recommendation_audits.sql")
  },
  {
    version: "V037",
    description: "Confidence & Recommendation Stability Engine: recommendation_confidence_snapshots table.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "037_recommendation_confidence.sql")
  },
  {
    version: "V038",
    description: "Recommendation Consensus Engine: recommendation_consensus table.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "038_recommendation_consensus.sql")
  },
  {
    version: "V039",
    description: "Recommendation Portfolio Optimizer Engine: recommendation_portfolios table.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "039_recommendation_portfolios.sql")
  },
  {
    version: "V040",
    description: "Contest Expected Value Engine: contest_ev table.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "040_contest_ev.sql")
  },
  {
    version: "V041",
    description: "Ownership Calibration Engine: ownership_calibration table.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "041_ownership_calibration.sql")
  },
  {
    version: "V042",
    description: "Market Calibration & Closing Line Value (CLV) Engine: market_calibration table.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "042_market_calibration.sql")
  },
  {
    version: "V043",
    description: "Adaptive Model Performance & Dynamic Weighting Engine: model_performance table.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "043_model_performance.sql")
  },
  {
    version: "V044",
    description: "Rolling Validation & Backtesting Engine: rolling_validation table.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "044_rolling_validation.sql")
  },
  {
    version: "V045",
    description: "Model Drift Detection & Recalibration Recommendation Engine: model_drift table.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "045_model_drift.sql")
  },
  {
    version: "V046",
    description: "Adaptive Ensemble Weighting Engine: adaptive_model_weights table.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "046_adaptive_model_weights.sql")
  },
  {
    version: "V047",
    description: "Adaptive Ensemble Prediction Engine: ensemble_predictions table.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "047_ensemble_predictions.sql")
  },
  {
    version: "V048",
    description: "Decision Policy Engine: decision_policies table.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "048_decision_policies.sql")
  },
  {
    version: "V049",
    description: "Survivor Decision Agent V1: survivor_decisions table.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "049_survivor_decisions.sql")
  },
  {
    version: "V050",
    description: "Survivor Planning Engine: survivor_plans table.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "050_survivor_plans.sql")
  },
  {
    version: "V051",
    description: "Championship Optimization Engine: championship_plans table.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "051_championship_plans.sql")
  },
  {
    version: "V052",
    description: "Decision Analytics & Continuous Learning Foundation.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "052_decision_analytics.sql")
  },
  {
    version: "V053",
    description: "Model Performance Analytics Engine.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "053_model_performance_analytics.sql")
  },
  {
    version: "V054",
    description: "Weekly Learning Loop and Feedback Subsystem.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "054_weekly_learning_loop.sql")
  },
  {
    version: "V055",
    description: "Automatic Model Reweighting.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "V055__AutomaticModelReweighting.sql")
  },
  {
    version: "V056",
    description: "Recommendation Evolution Tracking.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "V056__RecommendationEvolutionTracking.sql")
  },
  {
    version: "V057",
    description: "Survivor Strategy & Roadmap Framework.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "V057__SurvivorStrategyRoadmapFramework.sql")
  },
  {
    version: "V058",
    description: "Owner Entry Workspace.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "V058__OwnerEntryWorkspace.sql")
  },
  {
    version: "V059",
    description: "Role-Based Owner Access.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "V059__RoleBasedOwnerAccess.sql")
  },
  {
    version: "V060",
    description: "Contest Type Foundation.",
    filePath: path.join(process.cwd(), "backend", "database", "schema", "V060__ContestTypeFoundation.sql")
  }
];
