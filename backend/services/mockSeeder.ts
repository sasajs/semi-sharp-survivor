import { Team, Contest, ContestLeg, Game, TeamWeekLine, SurvivorEntry, SurvivorPick } from "../../src/types";
import { resetMockDatabase } from "../repositories/mockRepositories";

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
  { id: "circa-2026", name: "Circa Survivor 2026", year: 2026, status: "active" }
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
  { id: "entry-1", name: "Semi-Sharp #1", status: "alive", notes: "Aggressive visual asset path, conserving KC/SF for Christmas", created_at: new Date().toISOString() },
  { id: "entry-2", name: "Semi-Sharp #2", status: "alive", notes: "Conservative safety play, saving DET/DAL for Thanksgiving", created_at: new Date().toISOString() },
  { id: "entry-3", name: "High Leverage entry", status: "alive", notes: "Upset-heavy targeting, aiming to maximize early leverage", created_at: new Date().toISOString() },
  { id: "entry-4", name: "Faded Entry", status: "eliminated", notes: "Eliminated in Week 2 (selected ARI - tie occurred vs LAR, tie constitutes loss)", created_at: new Date().toISOString() },
];

export const initialPicks: SurvivorPick[] = [
  // For Entry 1
  { id: "p1-1", entry_id: "entry-1", contest_leg_id: "leg-1", team_id: "bal", pick_status: "won", created_at: new Date().toISOString() },
  { id: "p1-2", entry_id: "entry-1", contest_leg_id: "leg-2", team_id: "phi", pick_status: "won", created_at: new Date().toISOString() },
  { id: "p1-3", entry_id: "entry-1", contest_leg_id: "leg-3", team_id: "buf", pick_status: "won", created_at: new Date().toISOString() },
  { id: "p1-4", entry_id: "entry-1", contest_leg_id: "leg-4", team_id: "dal", pick_status: "won", created_at: new Date().toISOString() },
  { id: "p1-5", entry_id: "entry-1", contest_leg_id: "leg-5", team_id: "lac", pick_status: "pending", created_at: new Date().toISOString() },

  // For Entry 2
  { id: "p2-1", entry_id: "entry-2", contest_leg_id: "leg-1", team_id: "buf", pick_status: "won", created_at: new Date().toISOString() },
  { id: "p2-2", entry_id: "entry-2", contest_leg_id: "leg-2", team_id: "kc",  pick_status: "won", created_at: new Date().toISOString() },
  { id: "p2-3", entry_id: "entry-2", contest_leg_id: "leg-3", team_id: "phi", pick_status: "won", created_at: new Date().toISOString() },
  { id: "p2-4", entry_id: "entry-2", contest_leg_id: "leg-4", team_id: "sf",  pick_status: "won", created_at: new Date().toISOString() },
  { id: "p2-5", entry_id: "entry-2", contest_leg_id: "leg-5", team_id: "det", pick_status: "pending", created_at: new Date().toISOString() },

  // For Entry 3
  { id: "p3-1", entry_id: "entry-3", contest_leg_id: "leg-1", team_id: "sea", pick_status: "won", created_at: new Date().toISOString() },
  { id: "p3-2", entry_id: "entry-3", contest_leg_id: "leg-2", team_id: "det", pick_status: "won", created_at: new Date().toISOString() },
  { id: "p3-3", entry_id: "entry-3", contest_leg_id: "leg-3", team_id: "cin", pick_status: "won", created_at: new Date().toISOString() },
  { id: "p3-4", entry_id: "entry-3", contest_leg_id: "leg-4", team_id: "nyj", pick_status: "won", created_at: new Date().toISOString() },
  { id: "p3-5", entry_id: "entry-3", contest_leg_id: "leg-5", team_id: "bal", pick_status: "pending", created_at: new Date().toISOString() },

  // For Entry 4
  { id: "p4-1", entry_id: "entry-4", contest_leg_id: "leg-1", team_id: "phi", pick_status: "won", created_at: new Date().toISOString() },
  { id: "p4-2", entry_id: "entry-4", contest_leg_id: "leg-2", team_id: "ari", pick_status: "lost", created_at: new Date().toISOString() },
];

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
}
