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
  }
];
