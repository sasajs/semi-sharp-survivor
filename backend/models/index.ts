import { 
  Team, 
  Contest, 
  ContestLeg, 
  Game, 
  TeamWeekLine, 
  SurvivorEntry, 
  SurvivorPick, 
  SurvivorHistory 
} from "../../src/types";

// Explicitly re-export Domain Entities as backend Models as specified by standard patterns
export type TeamModel = Team;
export type ContestModel = Contest;
export type ContestLegModel = ContestLeg;
export type GameModel = Game;
export type TeamWeekLineModel = TeamWeekLine;
export type SurvivorEntryModel = SurvivorEntry;
export type SurvivorPickModel = SurvivorPick;
export type SurvivorHistoryModel = SurvivorHistory;

export * from "../repositories/postgres/postgresRepositories";
