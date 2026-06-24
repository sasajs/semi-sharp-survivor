import { 
  AuditableRecommendationCandidate, 
  StrategyType, 
  SurvivorEntry 
} from "../../src/types";
import { 
  recommendationCandidateRepo,
  survivorEquityRepo,
  teamRepo,
  entryRepo,
  pickRepo,
  futureTeamValueRepo,
  entryStrategyProfileRepo as profileRepo,
  entryMetadataRepo as metadataRepo
} from "../repositories/index";
import { SurvivorEquityService } from "./SurvivorEquityService";
import { FutureTeamValueService } from "./FutureTeamValueService";

export class RecommendationCandidateService {
  private get profileRepo() { return profileRepo; }
  private get metadataRepo() { return metadataRepo; }
  private equityService = new SurvivorEquityService();
  private ftvService = new FutureTeamValueService();

  /**
   * Generates and saves ranked recommendation candidates for a given season and week.
   */
  async calculate(season: string, week: number): Promise<AuditableRecommendationCandidate[]> {
    const teams = await teamRepo.getAll();
    const entries = await entryRepo.getAll();
    
    // 1. Get Survivor Equity snapshots. If empty, calculate them first.
    let equitySnapshots = await survivorEquityRepo.getBySeasonAndWeek(season, week);
    if (equitySnapshots.length === 0) {
      equitySnapshots = await this.equityService.calculate(season, week);
    }

    // 2. Get Future Team Values. If empty, calculate them first.
    let ftvList = await futureTeamValueRepo.getBySeasonAndWeek(season, week);
    if (ftvList.length === 0) {
      ftvList = await this.ftvService.calculate(season, week);
    }

    const ftvMap = new Map<string, number>();
    for (const ftv of ftvList) {
      ftvMap.set(ftv.team_id, ftv.future_value_score);
    }

    const calculationVersion = `v0.33-${Date.now()}`;
    const allCandidates: AuditableRecommendationCandidate[] = [];

    // Process active entries
    for (const entry of entries) {
      // Check if entry is active/alive
      const isActiveStatus = entry.status === "alive";
      
      // Load metadata to check active_flag
      const metadata = await this.metadataRepo.getByEntryId(entry.id);
      const isMetadataActive = metadata ? metadata.active_flag : true;
      const entryIsActive = isActiveStatus && isMetadataActive;

      // Load entry strategy profile
      const profile = await this.profileRepo.getByEntryId(entry.id);
      const strategyType = profile?.strategy_type || StrategyType.CHAMPIONSHIP_EV;

      // Load entry picks to see used teams
      const picks = await pickRepo.getByEntryId(entry.id);
      const usedTeams = new Set<string>(picks.map(p => p.team_id.toLowerCase()));

      const entryCandidates: AuditableRecommendationCandidate[] = [];

      for (const team of teams) {
        const teamIdLower = team.id.toLowerCase();
        
        // Initial eligibility checks
        let eligibility_status = "eligible";
        let eligibility_reason: string | null = null;

        if (!entryIsActive) {
          eligibility_status = "ineligible";
          eligibility_reason = "Entry is inactive or eliminated";
        } else if (usedTeams.has(teamIdLower)) {
          eligibility_status = "ineligible";
          eligibility_reason = "Team already used by this entry";
        }

        // Find survivor equity snapshot for this team and entry
        const equitySnap = equitySnapshots.find(
          eq => eq.entry_id === entry.id && eq.team_id.toLowerCase() === teamIdLower
        );

        if (!equitySnap && eligibility_status === "eligible") {
          eligibility_status = "ineligible";
          eligibility_reason = "Survivor equity score missing";
        }

        // Find future team value
        const futureVal = ftvMap.get(team.id);
        if (futureVal === undefined && eligibility_status === "eligible") {
          eligibility_status = "ineligible";
          eligibility_reason = "Future team value missing";
        }

        // Determine scores
        const survivor_equity_score = equitySnap ? equitySnap.equity_score : 0;
        const survival_probability = equitySnap ? equitySnap.survival_probability : 50;
        const future_team_value_score = futureVal ?? 50;

        // Calculate Strategy Fit Score
        let strategy_fit_score = 50.0;
        let fitExplanation = "";

        if (strategyType === StrategyType.CHAMPIONSHIP_EV) {
          // Championship EV: Favor high equity & preserving high future values (low future value team score gets higher fit)
          const preservation = 100 - future_team_value_score;
          strategy_fit_score = 0.5 * survivor_equity_score + 0.5 * preservation;
          fitExplanation = "balances strong equity with preservation of future premium options";
        } else if (strategyType === StrategyType.PORTFOLIO_EV) {
          // Portfolio EV: Favor balanced equity and diversification
          strategy_fit_score = 0.6 * survivor_equity_score + 40.0;
          fitExplanation = "offers balanced contest equity and preserves options for joint portfolio diversification";
        } else if (strategyType === StrategyType.MARKETPLACE_SURVIVAL) {
          // Marketplace Survival: Favor immediate safety
          strategy_fit_score = survival_probability;
          fitExplanation = "maximizes immediate survival probability to secure progress into the next contest stage";
        } else if (strategyType === StrategyType.GROUP_SURVIVAL) {
          // Group Survival: Favor immediate safety with low volatility
          strategy_fit_score = survival_probability * 0.9 + 10.0;
          fitExplanation = "prioritizes immediate survival probability with a low-volatility risk profile";
        }

        strategy_fit_score = Math.min(100.0, Math.max(0.0, Number(strategy_fit_score.toFixed(2))));

        // Total candidate score formula:
        // 70% survivor_equity_score + 20% survival_probability + 10% strategy_fit_score
        let candidate_score = 0.0;
        if (eligibility_status === "eligible") {
          candidate_score = 
            0.70 * survivor_equity_score + 
            0.20 * survival_probability + 
            0.10 * strategy_fit_score;
          candidate_score = Math.min(100.0, Math.max(0.0, Number(candidate_score.toFixed(2))));
        }

        // Generate Verbal Reasoning Explanation Narrative
        let explanation = "";
        if (eligibility_status === "eligible") {
          explanation = `${team.id.toUpperCase()} is a strong candidate for ${entry.name} because it combines high survivor equity (${survivor_equity_score.toFixed(1)}), strong immediate survival probability (${survival_probability.toFixed(1)}%), and good fit with the ${strategyType} strategy (${fitExplanation}, strategy fit: ${strategy_fit_score.toFixed(1)}). This is a candidate only and not a final recommendation.`;
        } else {
          explanation = `${team.id.toUpperCase()} is ineligible for ${entry.name} because: ${eligibility_reason}.`;
        }

        entryCandidates.push({
          season,
          week,
          entry_id: entry.id,
          team_id: team.id,
          candidate_rank: 999, // Temp placeholder
          candidate_score,
          survivor_equity_score,
          future_team_value_score,
          survival_probability,
          strategy_profile: strategyType,
          eligibility_status,
          eligibility_reason,
          explanation,
          calculation_version: calculationVersion
        });
      }

      // Rank the candidates for this entry
      // Filter out ineligible from getting a premium rank, but keep all in list
      const eligible = entryCandidates.filter(c => c.eligibility_status === "eligible");
      eligible.sort((a, b) => b.candidate_score - a.candidate_score);
      eligible.forEach((c, idx) => {
        c.candidate_rank = idx + 1;
      });

      const ineligible = entryCandidates.filter(c => c.eligibility_status !== "eligible");
      ineligible.forEach((c) => {
        c.candidate_rank = 999;
      });

      allCandidates.push(...entryCandidates);
    }

    // Save and return
    const saved = await recommendationCandidateRepo.saveMany(allCandidates);
    return saved;
  }

  async getLatest(): Promise<AuditableRecommendationCandidate[]> {
    return recommendationCandidateRepo.getLatest();
  }

  async getHistory(): Promise<AuditableRecommendationCandidate[]> {
    return recommendationCandidateRepo.getAll();
  }

  async getByEntryId(entryId: string): Promise<AuditableRecommendationCandidate[]> {
    return recommendationCandidateRepo.getByEntryId(entryId);
  }
}
