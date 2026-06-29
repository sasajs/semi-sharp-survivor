import { Team, Contest, ContestLeg, Game, TeamWeekLine, SurvivorEntry, SurvivorPick } from "../../src/types";
import { resetMockDatabase } from "../repositories/mockRepositories";
import { FutureTeamValueService } from "./FutureTeamValueService";
import { SurvivorEquityService } from "./SurvivorEquityService";
import { RecommendationCandidateService } from "./RecommendationCandidateService";
import { SurvivorRecommendationService } from "./SurvivorRecommendationService";
import { ModelDriftService } from "./ModelDriftService";
import { AdaptiveModelWeightService } from "./AdaptiveModelWeightService";
import { EnsemblePredictionService } from "./EnsemblePredictionService";
import { DecisionPolicyService } from "./DecisionPolicyService";
import { SurvivorDecisionAgentService } from "./SurvivorDecisionAgentService";
import { ChampionshipPlanningService } from "./ChampionshipPlanningService";

export const initialTeams: Team[] = [
  { id: "ari", name: "Arizona Cardinals", abbreviation: "ARI", bye_week: 11, primary_color: "#97233F", secondary_color: "#FFB612" },
  { id: "atl", name: "Atlanta Falcons", abbreviation: "ATL", bye_week: 12, primary_color: "#A71930", secondary_color: "#000000" },
  { id: "bal", name: "Baltimore Ravens", abbreviation: "BAL", bye_week: 14, primary_color: "#241773", secondary_color: "#9E7C0C" },
  { id: "buf", name: "Buffalo Bills", abbreviation: "BUF", bye_week: 12, primary_color: "#00338D", secondary_color: "#C60C30" },
  { id: "car", name: "Carolina Panthers", abbreviation: "CAR", bye_week: 11, primary_color: "#0085CA", secondary_color: "#101820" },
  { id: "chi", name: "Chicago Bears", abbreviation: "CHI", bye_week: 7, primary_color: "#0B162A", secondary_color: "#C83803" },
  { id: "cin", name: "Cincinnati Bengals", abbreviation: "CIN", bye_week: 12, primary_color: "#FB4F14", secondary_color: "#000000" },
  { id: "cle", name: "Cleveland Browns", abbreviation: "CLE", bye_week: 10, primary_color: "#311D00", secondary_color: "#FF3C00" },
  { id: "dal", name: "Dallas Cowboys", abbreviation: "DAL", bye_week: 7, primary_color: "#003594", secondary_color: "#869397" },
  { id: "den", name: "Denver Broncos", abbreviation: "DEN", bye_week: 14, primary_color: "#FB4F14", secondary_color: "#002244" },
  { id: "det", name: "Detroit Lions", abbreviation: "DET", bye_week: 9, primary_color: "#0076B6", secondary_color: "#B0B7BC" },
  { id: "gb",  name: "Green Bay Packers", abbreviation: "GB", bye_week: 10, primary_color: "#203731", secondary_color: "#FFB612" },
  { id: "hou", name: "Houston Texans", abbreviation: "HOU", bye_week: 14, primary_color: "#03202F", secondary_color: "#A71930" },
  { id: "ind", name: "Indianapolis Colts", abbreviation: "IND", bye_week: 14, primary_color: "#002C5F", secondary_color: "#A2AAAD" },
  { id: "jax", name: "Jacksonville Jaguars", abbreviation: "JAX", bye_week: 12, primary_color: "#006778", secondary_color: "#D7A22A" },
  { id: "kc",  name: "Kansas City Chiefs", abbreviation: "KC", bye_week: 6, primary_color: "#E31837", secondary_color: "#FFB612" },
  { id: "lac", name: "Los Angeles Chargers", abbreviation: "LAC", bye_week: 5, primary_color: "#0080C6", secondary_color: "#FFC20E" },
  { id: "lar", name: "Los Angeles Rams", abbreviation: "LAR", bye_week: 6, primary_color: "#003594", secondary_color: "#FFA300" },
  { id: "lv",  name: "Las Vegas Raiders", abbreviation: "LV", bye_week: 10, primary_color: "#000000", secondary_color: "#A5ACAF" },
  { id: "mia", name: "Miami Dolphins", abbreviation: "MIA", bye_week: 6, primary_color: "#008E97", secondary_color: "#FC4C02" },
  { id: "min", name: "Minnesota Vikings", abbreviation: "MIN", bye_week: 6, primary_color: "#4F2683", secondary_color: "#FFC62F" },
  { id: "ne",  name: "New England Patriots", abbreviation: "NE", bye_week: 14, primary_color: "#002244", secondary_color: "#C60C30" },
  { id: "no",  name: "New Orleans Saints", abbreviation: "NO", bye_week: 12, primary_color: "#D3BC8D", secondary_color: "#101820" },
  { id: "nyg", name: "New York Giants", abbreviation: "NYG", bye_week: 11, primary_color: "#0B2265", secondary_color: "#A71930" },
  { id: "nyj", name: "New York Jets", abbreviation: "NYJ", bye_week: 12, primary_color: "#125740", secondary_color: "#FFFFFF" },
  { id: "phi", name: "Philadelphia Eagles", abbreviation: "PHI", bye_week: 5, primary_color: "#004C54", secondary_color: "#A5ACAF" },
  { id: "pit", name: "Pittsburgh Steelers", abbreviation: "PIT", bye_week: 9, primary_color: "#FFB612", secondary_color: "#101820" },
  { id: "sea", name: "Seattle Seahawks", abbreviation: "SEA", bye_week: 10, primary_color: "#002244", secondary_color: "#69BE28" },
  { id: "sf",  name: "San Francisco 49ers", abbreviation: "SF", bye_week: 9, primary_color: "#AA0000", secondary_color: "#B3995D" },
  { id: "tb",  name: "Tampa Bay Buccaneers", abbreviation: "TB", bye_week: 11, primary_color: "#D50A0A", secondary_color: "#34302B" },
  { id: "ten", name: "Tennessee Titans", abbreviation: "TEN", bye_week: 5, primary_color: "#4B92DB", secondary_color: "#C60C30" },
  { id: "was", name: "Washington Commanders", abbreviation: "WAS", bye_week: 14, primary_color: "#5A1414", secondary_color: "#FFB612" },
];

export const initialContests: Contest[] = [
  { id: "circa-2026", name: "Circa Survivor 2026", year: 2026, status: "active" },
  { id: "public-mega", name: "Public Mega Contest", year: 2026, status: "active" },
  { id: "private-highroller", name: "Private High-Roller Pool", year: 2026, status: "active" },
  { id: "group-office", name: "Office Group Pool", year: 2026, status: "active" },
  { id: "marketplace-champ", name: "Marketplace Championship", year: 2026, status: "active" }
];

export const initialLegs: ContestLeg[] = [
  { id: "leg-1", name: "Week 1", leg_type: "regular", display_order: 1, nfl_week: 1 },
  { id: "leg-2", name: "Week 2", leg_type: "regular", display_order: 2, nfl_week: 2 },
  { id: "leg-3", name: "Week 3", leg_type: "regular", display_order: 3, nfl_week: 3 },
  { id: "leg-4", name: "Week 4", leg_type: "regular", display_order: 4, nfl_week: 4 },
  { id: "leg-5", name: "Week 5", leg_type: "regular", display_order: 5, nfl_week: 5 },
  { id: "leg-6", name: "Week 6", leg_type: "regular", display_order: 6, nfl_week: 6 },
  { id: "leg-7", name: "Week 7", leg_type: "regular", display_order: 7, nfl_week: 7 },
  { id: "leg-8", name: "Week 8", leg_type: "regular", display_order: 8, nfl_week: 8 },
  { id: "leg-9", name: "Week 9", leg_type: "regular", display_order: 9, nfl_week: 9 },
  { id: "leg-10", name: "Week 10", leg_type: "regular", display_order: 10, nfl_week: 10 },
  { id: "leg-11", name: "Week 11", leg_type: "regular", display_order: 11, nfl_week: 11 },
  { id: "leg-12", name: "Week 12 (Sunday/Monday)", leg_type: "regular", display_order: 12, nfl_week: 12 },
  { id: "leg-13", name: "Thanksgiving / Black Friday", leg_type: "thanksgiving", display_order: 13, nfl_week: 12 },
  { id: "leg-14", name: "Week 13", leg_type: "regular", display_order: 14, nfl_week: 13 },
  { id: "leg-15", name: "Week 14", leg_type: "regular", display_order: 15, nfl_week: 14 },
  { id: "leg-16", name: "Week 15", leg_type: "regular", display_order: 16, nfl_week: 15 },
  { id: "leg-17", name: "Week 16 (Non-Christmas)", leg_type: "regular", display_order: 17, nfl_week: 16 },
  { id: "leg-18", name: "Christmas Holidayer", leg_type: "christmas", display_order: 18, nfl_week: 16 },
  { id: "leg-19", name: "Week 17", leg_type: "regular", display_order: 19, nfl_week: 17 },
  { id: "leg-20", name: "Week 18", leg_type: "regular", display_order: 20, nfl_week: 18 },
];

export const initialEntries: SurvivorEntry[] = [
  { id: "UWOSH-1", name: "UWOSH-1", status: "alive", notes: "Steve's Entry 1 (Championship EV maximized)", created_at: new Date().toISOString(), owner_id: "owner-steve", contest_type_id: "circa" },
  { id: "UWOSH-2", name: "UWOSH-2", status: "alive", notes: "Steve's Entry 2 (Joint portfolio optimization)", created_at: new Date().toISOString(), owner_id: "owner-steve", contest_type_id: "circa" },
  { id: "UWOSH-3", name: "UWOSH-3", status: "alive", notes: "Cameron's Entry (Marketplace survival to mid-season)", created_at: new Date().toISOString(), owner_id: "owner-cameron", contest_type_id: "circa" },
  { id: "UWOSH-4", name: "UWOSH-4", status: "alive", notes: "UW Oshkosh Group Entry (Group consensus survival model)", created_at: new Date().toISOString(), owner_id: "owner-uw-oshkosh", contest_type_id: "circa" },
];

export const initialPicks: SurvivorPick[] = [];

export function buildAndSeedMockState() {
  const games: Game[] = [];
  const lines: TeamWeekLine[] = [];

  initialLegs.forEach((leg, idx) => {
    const legNum = idx + 1;
    for (let i = 0; i < 16; i++) {
      const homeIdx = (i * 2 + legNum) % 32;
      const awayIdx = (i * 2 + 1 + legNum) % 32;
      const homeTeam = initialTeams[homeIdx];
      const awayTeam = initialTeams[awayIdx];

      const gId = `g-${leg.id}-${i}`;
      
      let homeScore: number | undefined;
      let awayScore: number | undefined;
      let status: 'scheduled' | 'final' = 'scheduled';

      if (legNum < 5) {
        status = 'final';
        if (legNum === 2 && homeTeam.id === 'ari' && awayTeam.id === 'lar') {
          homeScore = 20;
          awayScore = 20;
        } else {
          homeScore = 20 + Math.floor(Math.random() * 20);
          awayScore = 20 + Math.floor(Math.random() * 20);
          if (homeScore === awayScore) homeScore += 3;
        }
      }
      
      games.push({
        id: gId,
        contest_leg_id: leg.id,
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        home_score: homeScore,
        away_score: awayScore,
        status,
        game_time: `Sunday 1:00 PM`
      });
    }

    initialTeams.forEach((team) => {
      let win_probability = 0.45 + (Math.sin(team.name.length + legNum) * 0.35);
      win_probability = Math.max(0.2, Math.min(0.93, win_probability));

      let pick_popularity = 0.02 + (Math.cos(team.name.length * 2 + legNum) * 0.15);
      pick_popularity = Math.max(0.001, Math.min(0.35, pick_popularity));

      let future_value = 0.5 + (Math.sin(team.name.length * 3) * 0.4);
      if (['kc', 'sf', 'bal', 'phi', 'buf', 'det'].includes(team.id)) {
        future_value = Math.max(0.7, future_value);
      }
      future_value = Math.max(0.1, Math.min(0.98, future_value));

      const leverage_multiplier = parseFloat((1.5 - pick_popularity).toFixed(2));
      const future_value_multiplier = parseFloat((1.1 - future_value).toFixed(2));

      let holiday_safety_multiplier = 1.0;
      if (leg.leg_type === "thanksgiving" && ['det', 'dal', 'chi'].includes(team.id)) {
        holiday_safety_multiplier = 1.25;
      } else if (leg.leg_type === "christmas" && ['kc', 'sf', 'bal', 'lar'].includes(team.id)) {
        holiday_safety_multiplier = 1.3;
      }

      const rawEquity = win_probability * leverage_multiplier * future_value_multiplier * holiday_safety_multiplier;
      const contest_equity_score = parseFloat(rawEquity.toFixed(3));

      lines.push({
        id: `line-${leg.id}-${team.id}`,
        team_id: team.id,
        contest_leg_id: leg.id,
        win_probability: parseFloat(win_probability.toFixed(3)),
        pick_popularity: parseFloat(pick_popularity.toFixed(3)),
        future_value: parseFloat(future_value.toFixed(3)),
        leverage_multiplier,
        future_value_multiplier,
        holiday_safety_multiplier,
        contest_equity_score
      });
    });
  });

  resetMockDatabase(initialTeams, initialContests, initialLegs, initialEntries, initialPicks, games, lines);

  // Pre-calculate baseline values for the mock dashboard out-of-the-box
  (async () => {
    try {
      const ftvService = new FutureTeamValueService();
      await ftvService.calculate("2026", 1);
      const eqService = new SurvivorEquityService();
      await eqService.calculate("2026", 1);
      const recService = new RecommendationCandidateService();
      await recService.calculate("2026", 1);
      
      const survRecService = new SurvivorRecommendationService();
      // Calculate first time to create the "previous" snapshot
      await survRecService.calculate("2026", 1);
      
      // Calculate second time to trigger comparison & create recommendation audits
      await survRecService.calculate("2026", 1);

      // Pre-calculate model drift & recalibration recommendations
      await ModelDriftService.calculate("2026", 1, "1.0.0");

      // Pre-calculate adaptive model weights
      await AdaptiveModelWeightService.calculateWeights("2026", 1, "1.0.0");

      // Pre-calculate ensemble predictions (v0.47)
      await EnsemblePredictionService.calculate("2026", 1, "1.0.0");

      // Pre-calculate decision policies (v0.48)
      await DecisionPolicyService.calculate("2026", 1, "1.0.0");

      // Pre-calculate survivor decisions (v0.49)
      await SurvivorDecisionAgentService.calculate("2026", 1, "v0.49");

      // Pre-calculate championship plans (v0.51)
      await ChampionshipPlanningService.calculate("2026", 1, "v0.51");

      // Pre-calculate decision analytics (v0.52)
      const { DecisionAnalyticsService } = await import("./DecisionAnalyticsService");
      await DecisionAnalyticsService.recordDecision({
        season: "2026",
        week: 1,
        contest_id: "circa-2026",
        recommendation_id: "rec-leg-1-UWOSH-1",
        engine_version: "v0.52",
        model_hash: "sha256-dec-analytics-v052",
        policy_version: "v0.48",
        data_version: "v0.47",
        workflow_version: "v1.0.0",
        recommendation_type: "survivor_primary",
        selected_team: "kc",
        projected_survival_probability: 0.88,
        projected_championship_probability: 0.1245,
        projected_expected_value: 1.35,
        projected_future_value: 85,
        recommendation_rank: 1,
        confidence_score: 95
      });
      await DecisionAnalyticsService.recordDecision({
        season: "2026",
        week: 1,
        contest_id: "circa-2026",
        recommendation_id: "rec-leg-1-UWOSH-2",
        engine_version: "v0.52",
        model_hash: "sha256-dec-analytics-v052",
        policy_version: "v0.48",
        data_version: "v0.47",
        workflow_version: "v1.0.0",
        recommendation_type: "survivor_primary",
        selected_team: "sf",
        projected_survival_probability: 0.82,
        projected_championship_probability: 0.1015,
        projected_expected_value: 1.25,
        projected_future_value: 75,
        recommendation_rank: 1,
        confidence_score: 85
      });
      await DecisionAnalyticsService.evaluateWeek("2026", 1);

      console.log("[Mock Seeder] Pre-calculated Future Team Value, Survivor Equity, Recommendation Candidates, comparative Recommendation Audits, Recommendation Confidence, Model Drift, Adaptive Model Weights, Ensemble Predictions, Decision Policies, Survivor Decisions, Championship Plans, and Decision Analytics snapshot states successfully.");
    } catch (err) {
      console.warn("Failed to pre-calculate mock dashboard metrics:", err);
    }
  })();
}
