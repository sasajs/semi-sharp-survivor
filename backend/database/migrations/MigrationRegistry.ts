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
  }
];
