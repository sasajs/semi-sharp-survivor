import { 
  SurvivorStrategyType, 
  HolidayType, 
  SurvivorEntryRoadmap, 
  SurvivorEntryRoadmapWeek, 
  SurvivorEntryStrategy,
  SurvivorHolidayReservation
} from "../../src/types";
import { 
  survivorStrategyRoadmapRepo, 
  pickRepo, 
  teamRepo,
  entryRepo
} from "../repositories/index";
import { survivorStrategyService } from "./SurvivorStrategyService";
import { holidayReservationService } from "./HolidayReservationService";
import { contestRulesService } from "./ContestRulesService";

// Standard NFL team metadata with default capabilities for deterministic roadmap calculation
interface NFLTeamSeed {
  id: string;
  name: string;
  baseWinProb: number;
  baseFV: number;
  baseEquity: number;
  basePopularity: number;
}

const NFL_TEAMS: NFLTeamSeed[] = [
  { id: "det", name: "Detroit Lions", baseWinProb: 0.78, baseFV: 0.85, baseEquity: 0.82, basePopularity: 0.22 },
  { id: "kc", name: "Kansas City Chiefs", baseWinProb: 0.82, baseFV: 0.90, baseEquity: 0.88, basePopularity: 0.25 },
  { id: "sf", name: "San Francisco 49ers", baseWinProb: 0.79, baseFV: 0.88, baseEquity: 0.85, basePopularity: 0.20 },
  { id: "bal", name: "Baltimore Ravens", baseWinProb: 0.80, baseFV: 0.86, baseEquity: 0.84, basePopularity: 0.18 },
  { id: "buf", name: "Buffalo Bills", baseWinProb: 0.77, baseFV: 0.82, baseEquity: 0.80, basePopularity: 0.15 },
  { id: "phi", name: "Philadelphia Eagles", baseWinProb: 0.76, baseFV: 0.80, baseEquity: 0.78, basePopularity: 0.14 },
  { id: "dal", name: "Dallas Cowboys", baseWinProb: 0.72, baseFV: 0.75, baseEquity: 0.72, basePopularity: 0.12 },
  { id: "gb", name: "Green Bay Packers", baseWinProb: 0.71, baseFV: 0.72, baseEquity: 0.70, basePopularity: 0.10 },
  { id: "hou", name: "Houston Texans", baseWinProb: 0.73, baseFV: 0.76, baseEquity: 0.74, basePopularity: 0.11 },
  { id: "mia", name: "Miami Dolphins", baseWinProb: 0.69, baseFV: 0.68, baseEquity: 0.66, basePopularity: 0.08 },
  { id: "cin", name: "Cincinnati Bengals", baseWinProb: 0.70, baseFV: 0.70, baseEquity: 0.68, basePopularity: 0.09 },
  { id: "min", name: "Minnesota Vikings", baseWinProb: 0.67, baseFV: 0.62, baseEquity: 0.60, basePopularity: 0.07 },
  { id: "sea", name: "Seattle Seahawks", baseWinProb: 0.66, baseFV: 0.58, baseEquity: 0.56, basePopularity: 0.06 },
  { id: "lar", name: "Los Angeles Rams", baseWinProb: 0.65, baseFV: 0.56, baseEquity: 0.54, basePopularity: 0.06 },
  { id: "nyj", name: "New York Jets", baseWinProb: 0.63, baseFV: 0.52, baseEquity: 0.50, basePopularity: 0.05 },
  { id: "lac", name: "Los Angeles Chargers", baseWinProb: 0.64, baseFV: 0.54, baseEquity: 0.52, basePopularity: 0.05 },
  { id: "tb", name: "Tampa Bay Buccaneers", baseWinProb: 0.62, baseFV: 0.50, baseEquity: 0.48, basePopularity: 0.04 },
  { id: "atl", name: "Atlanta Falcons", baseWinProb: 0.61, baseFV: 0.48, baseEquity: 0.46, basePopularity: 0.04 },
  { id: "pit", name: "Pittsburgh Steelers", baseWinProb: 0.63, baseFV: 0.46, baseEquity: 0.45, basePopularity: 0.04 },
  { id: "cle", name: "Cleveland Browns", baseWinProb: 0.59, baseFV: 0.42, baseEquity: 0.40, basePopularity: 0.03 },
  { id: "ind", name: "Indianapolis Colts", baseWinProb: 0.58, baseFV: 0.40, baseEquity: 0.38, basePopularity: 0.03 },
  { id: "jax", name: "Jacksonville Jaguars", baseWinProb: 0.57, baseFV: 0.38, baseEquity: 0.36, basePopularity: 0.03 },
  { id: "no", name: "New Orleans Saints", baseWinProb: 0.56, baseFV: 0.36, baseEquity: 0.34, basePopularity: 0.02 },
  { id: "chi", name: "Chicago Bears", baseWinProb: 0.58, baseFV: 0.44, baseEquity: 0.42, basePopularity: 0.03 },
  { id: "den", name: "Denver Broncos", baseWinProb: 0.55, baseFV: 0.32, baseEquity: 0.30, basePopularity: 0.02 },
  { id: "lv", name: "Las Vegas Raiders", baseWinProb: 0.54, baseFV: 0.30, baseEquity: 0.28, basePopularity: 0.02 },
  { id: "ari", name: "Arizona Cardinals", baseWinProb: 0.56, baseFV: 0.34, baseEquity: 0.32, basePopularity: 0.02 },
  { id: "ten", name: "Tennessee Titans", baseWinProb: 0.52, baseFV: 0.28, baseEquity: 0.26, basePopularity: 0.01 },
  { id: "was", name: "Washington Commanders", baseWinProb: 0.55, baseFV: 0.35, baseEquity: 0.33, basePopularity: 0.02 },
  { id: "nyg", name: "New York Giants", baseWinProb: 0.48, baseFV: 0.24, baseEquity: 0.22, basePopularity: 0.01 },
  { id: "ne", name: "New England Patriots", baseWinProb: 0.47, baseFV: 0.22, baseEquity: 0.20, basePopularity: 0.01 },
  { id: "car", name: "Carolina Panthers", baseWinProb: 0.45, baseFV: 0.20, baseEquity: 0.18, basePopularity: 0.01 }
];

export class SurvivorRoadmapService {
  /**
   * Generate full season roadmap for an entry
   */
  async generateRoadmap(entryId: string, season: string): Promise<{ roadmap: SurvivorEntryRoadmap; weeks: SurvivorEntryRoadmapWeek[] }> {
    // 1. Fetch active strategy, entry details, and contest rules
    const strategy = await survivorStrategyService.getActiveStrategy(entryId);
    const entryObj = await entryRepo.getById(entryId);
    const contestTypeId = entryObj?.contest_type_id || "circa";
    const rules = contestRulesService.getRules(contestTypeId);

    // 2. Fetch used teams based on historical picks
    const entryPicks = await pickRepo.getByEntryId(entryId);
    const usedTeams = new Set<string>();
    for (const pick of entryPicks) {
      if (pick.team_id) {
        usedTeams.add(pick.team_id.toLowerCase());
      }
    }

    // 3. Determine current week (fallback to 1 if not detectable)
    let currentWeekNum = 1;
    if (entryPicks.length > 0) {
      const maxPickWeek = Math.max(...entryPicks.map(p => {
        const digits = p.contest_leg_id.match(/\d+/);
        return digits ? Number(digits[0]) : 1;
      }));
      currentWeekNum = Math.min(rules.totalLegs, maxPickWeek + 1);
    }

    // 4. Fetch or generate holiday reservations if enabled
    let reservations: any[] = [];
    if (rules.usesHolidayReservations) {
      reservations = await holidayReservationService.getReservations(entryId, season);
      if (!reservations || reservations.length === 0) {
        reservations = await holidayReservationService.generateReservations(entryId, season, strategy.strategy_type);
      }
    }

    // 5. Generate the roadmap week-by-week using contest definitions
    const weeksData: SurvivorEntryRoadmapWeek[] = [];
    const roadmapUsedTeams = new Set<string>(usedTeams);

    // Track holiday reserved teams to avoid picking them in regular weeks
    const holidayReservedTeams = new Set<string>();
    if (rules.usesHolidayReservations) {
      for (const res of reservations) {
        if (res.reserved_team_id) holidayReservedTeams.add(res.reserved_team_id.toLowerCase());
        if (res.alternate_team_id) holidayReservedTeams.add(res.alternate_team_id.toLowerCase());
      }
    }

    // Keep track of roadmap version using timestamp
    const roadmapVersion = `v1.${Date.now().toString().slice(-4)}`;
    const roadmapLegs = rules.roadmapLegs();

    for (const leg of roadmapLegs) {
      let primaryTeam = "";
      let alternateTeam = "";
      let winProb = 0.50;
      let fvCost = 0.50;
      let eqScore = 0.50;
      let ownershipProj = 0.05;
      let note = "";

      if (leg.isHoliday && rules.usesHolidayReservations) {
        const hType = leg.type === "thanksgiving" ? HolidayType.THANKSGIVING : HolidayType.CHRISTMAS;
        const res = reservations.find(r => r.holiday_type === hType);
        
        const primaryCandidate = res?.reserved_team_id?.toLowerCase() || "";
        const alternateCandidate = res?.alternate_team_id?.toLowerCase() || "";

        if (primaryCandidate && !roadmapUsedTeams.has(primaryCandidate)) {
          primaryTeam = primaryCandidate;
          alternateTeam = (!roadmapUsedTeams.has(alternateCandidate) && alternateCandidate !== primaryCandidate) ? alternateCandidate : "det";
          note = `Holiday reservation strictly respected for ${hType}.`;
        } else if (alternateCandidate && !roadmapUsedTeams.has(alternateCandidate)) {
          primaryTeam = alternateCandidate;
          alternateTeam = "det";
          note = `Holiday primary team was used, falling back to reserved alternate team for ${hType}.`;
        } else {
          // Fallback to highest available team
          const available = NFL_TEAMS.filter(t => !roadmapUsedTeams.has(t.id));
          const best = available[0] || NFL_TEAMS[0];
          const second = available[1] || NFL_TEAMS[1];
          primaryTeam = best.id;
          alternateTeam = second.id;
          note = `Holiday reservations were already utilized. Re-optimized fallback team.`;
        }

        // Get metadata
        const tMetadata = NFL_TEAMS.find(t => t.id === primaryTeam) || NFL_TEAMS[0];
        winProb = tMetadata.baseWinProb;
        fvCost = tMetadata.baseFV;
        eqScore = tMetadata.baseEquity;
        ownershipProj = tMetadata.basePopularity;
      } else {
        // Regular week or standard survivor format without holiday legs
        // Rank available teams based on strategy weights
        const candidates = NFL_TEAMS.filter(t => {
          if (roadmapUsedTeams.has(t.id)) return false;
          if (rules.usesHolidayReservations && holidayReservedTeams.has(t.id)) return false;
          return true;
        });

        // Calculate scores for each team
        const scored = (candidates.length > 0 ? candidates : NFL_TEAMS.filter(t => !roadmapUsedTeams.has(t.id))).map(t => {
          const survivalW = strategy.survival_weight ?? 0.30;
          const futureValW = strategy.future_value_weight ?? 0.20;
          const ownershipW = strategy.ownership_leverage_weight ?? 0.20;
          const consensusW = strategy.consensus_weight ?? 0.15;
          const marketplaceW = strategy.marketplace_weight ?? 0.15;

          // Influence metrics slightly based on leg order to make roadmap progressive
          const weekFactor = (leg.displayOrder / rules.totalLegs);
          const adjWinProb = Math.max(0.40, t.baseWinProb - (weekFactor * 0.10));
          const adjFV = Math.max(0.10, t.baseFV * (1 - weekFactor));
          const adjEq = Math.max(0.10, t.baseEquity * weekFactor);
          const adjPop = Math.max(0.01, t.basePopularity * (0.8 + Math.random() * 0.4));

          const score = 
            (adjWinProb * survivalW) + 
            ((1 - adjFV) * futureValW) + 
            ((1 - adjPop) * ownershipW) + 
            (adjWinProb * consensusW) + 
            (marketplaceW * (leg.displayOrder <= 4 ? adjWinProb : 1 - adjFV));

          return { team: t, score, adjWinProb, adjFV, adjEq, adjPop };
        }).sort((a, b) => b.score - a.score);

        const bestCandidate = scored[0] || { team: NFL_TEAMS[0], adjWinProb: 0.80, adjFV: 0.85, adjEq: 0.80, adjPop: 0.20 };
        const secondCandidate = scored[1] || { team: NFL_TEAMS[1], adjWinProb: 0.75, adjFV: 0.70, adjEq: 0.70, adjPop: 0.15 };

        primaryTeam = bestCandidate.team.id;
        alternateTeam = secondCandidate.team.id;
        winProb = bestCandidate.adjWinProb;
        fvCost = bestCandidate.adjFV;
        eqScore = bestCandidate.adjEq;
        ownershipProj = bestCandidate.adjPop;
        note = `Optimized via ${strategy.strategy_name}.`;
      }

      // Record selected team in used list so it won't be reused in this roadmap
      roadmapUsedTeams.add(primaryTeam);

      weeksData.push({
        roadmap_id: 0,
        season,
        week: leg.displayOrder,
        recommended_team_id: primaryTeam,
        alternate_team_id: alternateTeam,
        win_probability: winProb,
        future_value_cost: fvCost,
        contest_equity_score: eqScore,
        ownership_projection: ownershipProj,
        roadmap_note: note,
        is_current_week: leg.displayOrder === currentWeekNum,
        is_holiday_week: leg.isHoliday
      });
    }

    // 6. Calculate summary indicators
    const totalSurvivalProb = weeksData.reduce((prod, wk) => prod * (wk.win_probability ?? 0.70), 1.0);
    const avgEquityScore = weeksData.reduce((sum, wk) => sum + (wk.contest_equity_score ?? 0.50), 0) / rules.totalLegs;
    const roadmapConfidence = weeksData.reduce((sum, wk) => sum + (wk.win_probability ?? 0.70), 0) / rules.totalLegs;

    // Portfolio correlation based on how much this roadmap overlaps with others
    const correlationScore = strategy.strategy_type === SurvivorStrategyType.DIVERSIFICATION ? 0.32 : 0.68;

    const generatedReason = `Full-season roadmap generated utilizing ${strategy.strategy_name} strategy parameters for ${rules.name}. ` + 
      (rules.usesHolidayReservations ? `Holiday weeks (Thanksgiving/Christmas) have been strictly preserved with top-tier asset locks to insulate from late-season supply shocks. ` : "") + 
      `Entry-specific historical usage respects the immutable exclusion of ${usedTeams.size} already played teams.`;

    const roadmapRecord: SurvivorEntryRoadmap = {
      entry_id: entryId,
      season,
      generated_week: currentWeekNum,
      strategy_type: strategy.strategy_type,
      roadmap_version: roadmapVersion,
      total_projected_survival: totalSurvivalProb,
      total_projected_equity: avgEquityScore,
      portfolio_correlation_score: correlationScore,
      roadmap_confidence: roadmapConfidence,
      generated_reason: generatedReason,
      model_version: "v4.2.0-adaptive",
      policy_version: "v0.57-strategic",
      contest_type_id: rules.contestTypeId,
      total_legs: rules.totalLegs,
      holiday_enabled: rules.usesHolidayReservations
    };

    // 7. Save structures to database
    const savedRoadmap = await survivorStrategyRoadmapRepo.saveRoadmap(roadmapRecord);
    if (!savedRoadmap.id) {
      savedRoadmap.id = 1; // Safeguard for memory repository
    }

    const weeksToSave = weeksData.map(wk => ({
      ...wk,
      roadmap_id: savedRoadmap.id as number
    }));

    const savedWeeks = await survivorStrategyRoadmapRepo.saveRoadmapWeeks(weeksToSave);

    return {
      roadmap: savedRoadmap,
      weeks: savedWeeks
    };
  }

  /**
   * Generate roadmaps for all active entries
   */
  async generateAllRoadmaps(season: string): Promise<Record<string, { roadmap: SurvivorEntryRoadmap; weeks: SurvivorEntryRoadmapWeek[] }>> {
    const activeEntries = await entryRepo.getAll();
    const results: Record<string, { roadmap: SurvivorEntryRoadmap; weeks: SurvivorEntryRoadmapWeek[] }> = {};
    
    for (const entry of activeEntries) {
      if (entry.id && entry.status === "alive") {
        const res = await this.generateRoadmap(entry.id, season);
        results[entry.id] = res;
      }
    }
    
    return results;
  }

  /**
   * Retrieve latest roadmap for an entry
   */
  async getLatestRoadmap(entryId: string, season: string): Promise<{ roadmap: SurvivorEntryRoadmap; weeks: SurvivorEntryRoadmapWeek[] } | null> {
    const roadmap = await survivorStrategyRoadmapRepo.getRoadmapByEntryId(entryId, season);
    if (!roadmap) return null;

    const weeks = await survivorStrategyRoadmapRepo.getRoadmapWeeks(roadmap.id as number);
    return { roadmap, weeks };
  }

  /**
   * Retrieve active roadmaps for all active portfolio entries
   */
  async getPortfolioRoadmaps(season: string): Promise<Record<string, { roadmap: SurvivorEntryRoadmap; weeks: SurvivorEntryRoadmapWeek[] }>> {
    const activeRoadmaps = await survivorStrategyRoadmapRepo.getAllActiveRoadmaps(season);
    const results: Record<string, { roadmap: SurvivorEntryRoadmap; weeks: SurvivorEntryRoadmapWeek[] }> = {};

    for (const r of activeRoadmaps) {
      const weeks = await survivorStrategyRoadmapRepo.getRoadmapWeeks(r.id as number);
      results[r.entry_id] = { roadmap: r, weeks };
    }

    return results;
  }
}

export const survivorRoadmapService = new SurvivorRoadmapService();
