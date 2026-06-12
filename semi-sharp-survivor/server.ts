import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { 
  Contest, 
  ContestLeg, 
  Team, 
  Game, 
  TeamWeekLine, 
  SurvivorEntry, 
  SurvivorPick, 
  SurvivorHistory 
} from "./src/types";

// Setup express app
const app = express();
app.use(express.json());
const PORT = 3000;

// ==========================================
// IN-MEMORY DATABASE & MOCK DATA GENERATOR
// ==========================================

// 1. 32 NFL Teams with colors
const teams: Team[] = [
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

// 2. Contests
const contests: Contest[] = [
  { id: "circa-2026", name: "Circa Survivor 2026", year: 2026, status: "active" }
];

// 3. 20 Circa Survivor Contest Legs (special holiday windows: Thanksgiving is Leg 13, Christmas is Leg 18)
const legs: ContestLeg[] = [
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

// In-Memory Entries state
let entries: SurvivorEntry[] = [
  { id: "entry-1", name: "Semi-Sharp #1", status: "alive", notes: "Aggressive visual asset path, conserving KC/SF for Christmas", created_at: new Date().toISOString() },
  { id: "entry-2", name: "Semi-Sharp #2", status: "alive", notes: "Conservative safety play, saving DET/DAL for Thanksgiving", created_at: new Date().toISOString() },
  { id: "entry-3", name: "High Leverage entry", status: "alive", notes: "Upset-heavy targeting, aiming to maximize early leverage", created_at: new Date().toISOString() },
  { id: "entry-4", name: "Faded Entry", status: "eliminated", notes: "Eliminated in Week 2 (selected ARI - tie occurred vs LAR, tie constitutes loss)", created_at: new Date().toISOString() },
];

// In-Memory Picks state
let picks: SurvivorPick[] = [
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

  // For Entry 4 (Eliminated on a tie in Week 2, ARI tied with LAR)
  { id: "p4-1", entry_id: "entry-4", contest_leg_id: "leg-1", team_id: "phi", pick_status: "won", created_at: new Date().toISOString() },
  { id: "p4-2", entry_id: "entry-4", contest_leg_id: "leg-2", team_id: "ari", pick_status: "lost", created_at: new Date().toISOString() },
];

const games: Game[] = [];
const lines: TeamWeekLine[] = [];

// Populate simulated weekly games & contest metadata/lines
const generateMockGamesAndLines = () => {
  legs.forEach((leg, idx) => {
    // Generate matches for each leg (arbitrary pairings)
    const legNum = idx + 1;
    for (let i = 0; i < 16; i++) {
      const homeIdx = (i * 2 + legNum) % 32;
      const awayIdx = (i * 2 + 1 + legNum) % 32;
      const homeTeam = teams[homeIdx];
      const awayTeam = teams[awayIdx];

      const gId = `g-${leg.id}-${i}`;
      
      // Determine score if past leg or current leg
      let homeScore: number | undefined;
      let awayScore: number | undefined;
      let status: 'scheduled' | 'final' = 'scheduled';

      if (legNum < 5) { // prior legs
        status = 'final';
        // In week 2, if LAR vs ARI, make it a tie to illustrate the tie = elimination rule
        if (legNum === 2 && homeTeam.id === 'ari' && awayTeam.id === 'lar') {
          homeScore = 20;
          awayScore = 20;
        } else {
          homeScore = 20 + Math.floor(Math.random() * 20);
          awayScore = 20 + Math.floor(Math.random() * 20);
          if (homeScore === awayScore) homeScore += 3; // avoid random ties except the explicit one
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

    // Generate lines for every team in this leg
    teams.forEach((team) => {
      // Simulate win probability
      let win_probability = 0.45 + (Math.sin(team.name.length + legNum) * 0.35);
      win_probability = Math.max(0.2, Math.min(0.93, win_probability));

      // Pick popularity
      let pick_popularity = 0.02 + (Math.cos(team.name.length * 2 + legNum) * 0.15);
      pick_popularity = Math.max(0.001, Math.min(0.35, pick_popularity));

      // Future value (some teams maintain high future value e.g. KC, SF, BAL)
      let future_value = 0.5 + (Math.sin(team.name.length * 3) * 0.4);
      if (['kc', 'sf', 'bal', 'phi', 'buf', 'det'].includes(team.id)) {
        future_value = Math.max(0.7, future_value);
      }
      future_value = Math.max(0.1, Math.min(0.98, future_value));

      // Calculate multipliers
      // Lower popularity -> higher leverage multiplier
      const leverage_multiplier = parseFloat((1.5 - pick_popularity).toFixed(2));
      
      // Higher future value -> lower current future value multiplier (saves them!)
      const future_value_multiplier = parseFloat((1.1 - future_value).toFixed(2));

      // Holiday safety multiplier
      let holiday_safety_multiplier = 1.0;
      if (leg.leg_type === "thanksgiving" && ['det', 'dal', 'chi'].includes(team.id)) {
        holiday_safety_multiplier = 1.25;
      } else if (leg.leg_type === "christmas" && ['kc', 'sf', 'bal', 'lar'].includes(team.id)) {
        holiday_safety_multiplier = 1.3;
      }

      // EquityScore = WP * Leverage * FV_mult * Holiday_safety
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
};

generateMockGamesAndLines();

// ==========================================
// REST API ROUTES
// ==========================================

// Get Contests
app.get("/api/contests", (req, res) => {
  res.json(contests);
});

// Get Legs
app.get("/api/legs", (req, res) => {
  res.json(legs);
});

// Get Teams
app.get("/api/teams", (req, res) => {
  res.json(teams);
});

// Get Entries
app.get("/api/entries", (req, res) => {
  res.json(entries);
});

// Create Entry
app.post("/api/entries", (req, res) => {
  const { name, notes } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  const newEntry: SurvivorEntry = {
    id: `entry-${Date.now()}`,
    name,
    status: "alive",
    notes: notes || "",
    created_at: new Date().toISOString()
  };
  entries.push(newEntry);
  res.json(newEntry);
});

// Delete Entry
app.delete("/api/entries/:id", (req, res) => {
  const { id } = req.params;
  entries = entries.filter(e => e.id !== id);
  picks = picks.filter(p => p.entry_id !== id);
  res.json({ success: true, message: `Entry ${id} deleted.` });
});

// Reset database / seed back to original
app.post("/api/admin/reset", (req, res) => {
  entries = [
    { id: "entry-1", name: "Semi-Sharp #1", status: "alive", notes: "Aggressive visual asset path, conserving KC/SF for Christmas", created_at: new Date().toISOString() },
    { id: "entry-2", name: "Semi-Sharp #2", status: "alive", notes: "Conservative safety play, saving DET/DAL for Thanksgiving", created_at: new Date().toISOString() },
    { id: "entry-3", name: "High Leverage entry", status: "alive", notes: "Upset-heavy targeting, aiming to maximize early leverage", created_at: new Date().toISOString() },
    { id: "entry-4", name: "Faded Entry", status: "eliminated", notes: "Eliminated in Week 2 (selected ARI - tie occurred vs LAR, tie constitutes loss)", created_at: new Date().toISOString() },
  ];

  picks = [
    { id: "p1-1", entry_id: "entry-1", contest_leg_id: "leg-1", team_id: "bal", pick_status: "won", created_at: new Date().toISOString() },
    { id: "p1-2", entry_id: "entry-1", contest_leg_id: "leg-2", team_id: "phi", pick_status: "won", created_at: new Date().toISOString() },
    { id: "p1-3", entry_id: "entry-1", contest_leg_id: "leg-3", team_id: "buf", pick_status: "won", created_at: new Date().toISOString() },
    { id: "p1-4", entry_id: "entry-1", contest_leg_id: "leg-4", team_id: "dal", pick_status: "won", created_at: new Date().toISOString() },
    { id: "p1-5", entry_id: "entry-1", contest_leg_id: "leg-5", team_id: "lac", pick_status: "pending", created_at: new Date().toISOString() },

    { id: "p2-1", entry_id: "entry-2", contest_leg_id: "leg-1", team_id: "buf", pick_status: "won", created_at: new Date().toISOString() },
    { id: "p2-2", entry_id: "entry-2", contest_leg_id: "leg-2", team_id: "kc",  pick_status: "won", created_at: new Date().toISOString() },
    { id: "p2-3", entry_id: "entry-2", contest_leg_id: "leg-3", team_id: "phi", pick_status: "won", created_at: new Date().toISOString() },
    { id: "p2-4", entry_id: "entry-2", contest_leg_id: "leg-4", team_id: "sf",  pick_status: "won", created_at: new Date().toISOString() },
    { id: "p2-5", entry_id: "entry-2", contest_leg_id: "leg-5", team_id: "det", pick_status: "pending", created_at: new Date().toISOString() },

    { id: "p3-1", entry_id: "entry-3", contest_leg_id: "leg-1", team_id: "sea", pick_status: "won", created_at: new Date().toISOString() },
    { id: "p3-2", entry_id: "entry-3", contest_leg_id: "leg-2", team_id: "det", pick_status: "won", created_at: new Date().toISOString() },
    { id: "p3-3", entry_id: "entry-3", contest_leg_id: "leg-3", team_id: "cin", pick_status: "won", created_at: new Date().toISOString() },
    { id: "p3-4", entry_id: "entry-3", contest_leg_id: "leg-4", team_id: "nyj", pick_status: "won", created_at: new Date().toISOString() },
    { id: "p3-5", entry_id: "entry-3", contest_leg_id: "leg-5", team_id: "bal", pick_status: "pending", created_at: new Date().toISOString() },

    { id: "p4-1", entry_id: "entry-4", contest_leg_id: "leg-1", team_id: "phi", pick_status: "won", created_at: new Date().toISOString() },
    { id: "p4-2", entry_id: "entry-4", contest_leg_id: "leg-2", team_id: "ari", pick_status: "lost", created_at: new Date().toISOString() },
  ];

  res.json({ success: true, message: "Database reseeded to defaults." });
});

// Update Entry Notes/Details
app.patch("/api/entries/:id", (req, res) => {
  const { id } = req.params;
  const { name, notes, status } = req.body;
  const entryIdx = entries.findIndex(e => e.id === id);
  if (entryIdx === -1) {
    return res.status(404).json({ error: "Entry not found" });
  }
  if (name !== undefined) entries[entryIdx].name = name;
  if (notes !== undefined) entries[entryIdx].notes = notes;
  if (status !== undefined) entries[entryIdx].status = status;
  res.json(entries[entryIdx]);
});

// Get Picks for ALL or Single Entry
app.get("/api/picks", (req, res) => {
  const { entry_id } = req.query;
  if (entry_id) {
    const entryPicks = picks.filter(p => p.entry_id === entry_id);
    return res.json(entryPicks);
  }
  res.json(picks);
});

// Submit / Edit Survivor Pick
app.post("/api/picks/make", (req, res) => {
  const { entry_id, contest_leg_id, team_id } = req.body;

  if (!entry_id || !contest_leg_id || !team_id) {
    return res.status(400).json({ error: "Missing entry_id, contest_leg_id, or team_id" });
  }

  // Find the entry
  const entry = entries.find(e => e.id === entry_id);
  if (!entry) {
    return res.status(404).json({ error: "Survivor Entry not found" });
  }

  // Contest logic: Entry can't make picks if they are already eliminated
  if (entry.status === "eliminated") {
    return res.status(400).json({ error: "This entry is eliminated and cannot place matches" });
  }

  // Contest logic: Team can only be used once per entry
  const holdsPriorPickOfTeam = picks.some(p => 
    p.entry_id === entry_id && 
    p.team_id === team_id && 
    p.contest_leg_id !== contest_leg_id
  );

  if (holdsPriorPickOfTeam) {
    const priorPick = picks.find(p => p.entry_id === entry_id && p.team_id === team_id);
    return res.status(400).json({ 
      error: `Rule Violation: Team ${team_id.toUpperCase()} has already been used by this entry in ${legs.find(l => l.id === priorPick?.contest_leg_id)?.name || priorPick?.contest_leg_id}` 
    });
  }

  // Look for existing pick in this leg
  const existingPickIdx = picks.findIndex(p => p.entry_id === entry_id && p.contest_leg_id === contest_leg_id);

  // Check if team is valid / has a game in this leg
  const teamGame = games.find(g => 
    g.contest_leg_id === contest_leg_id && 
    (g.home_team_id === team_id || g.away_team_id === team_id)
  );

  if (!teamGame) {
    return res.status(400).json({ error: `Selected team is not playing in the matches for this leg.` });
  }

  // Determine status of pick
  let pick_status: 'pending' | 'won' | 'lost' = 'pending';
  if (teamGame.status === 'final') {
    const isHome = teamGame.home_team_id === team_id;
    const homeScore = teamGame.home_score || 0;
    const awayScore = teamGame.away_score || 0;

    if (homeScore === awayScore) {
      // Tie equals loss
      pick_status = 'lost';
    } else if (isHome && homeScore > awayScore) {
      pick_status = 'won';
    } else if (!isHome && awayScore > homeScore) {
      pick_status = 'won';
    } else {
      pick_status = 'lost';
    }
  }

  let finalPick: SurvivorPick;
  if (existingPickIdx !== -1) {
    // Edit existing pick
    picks[existingPickIdx].team_id = team_id;
    picks[existingPickIdx].pick_status = pick_status;
    picks[existingPickIdx].created_at = new Date().toISOString();
    finalPick = picks[existingPickIdx];
  } else {
    // Make completely new pick
    finalPick = {
      id: `pick-${Date.now()}`,
      entry_id,
      contest_leg_id,
      team_id,
      pick_status,
      created_at: new Date().toISOString()
    };
    picks.push(finalPick);
  }

  // If the pick is lost, update the entry's alive status to eliminated
  if (pick_status === 'lost') {
    entry.status = 'eliminated';
  }

  res.json({ 
    success: true, 
    pick: finalPick, 
    entry_status: entry.status 
  });
});

// Delete Pick
app.delete("/api/picks/:id", (req, res) => {
  const { id } = req.params;
  picks = picks.filter(p => p.id !== id);
  res.json({ success: true });
});

// Get Games for leg
app.get("/api/games", (req, res) => {
  const { leg_id } = req.query;
  if (leg_id) {
    return res.json(games.filter(g => g.contest_leg_id === leg_id));
  }
  res.json(games);
});

// Get Lines for leg
app.get("/api/lines", (req, res) => {
  const { leg_id } = req.query;
  if (leg_id) {
    return res.json(lines.filter(l => l.contest_leg_id === leg_id));
  }
  res.json(lines);
});

// recommendation placeholder engine
app.get("/api/recommendations", (req, res) => {
  const { entry_id, leg_id } = req.query;

  if (!entry_id || !leg_id) {
    return res.status(400).json({ error: "Missing entry_id or leg_id parameter" });
  }

  const entry = entries.find(e => e.id === entry_id);
  if (!entry) {
    return res.status(404).json({ error: "Entry not found" });
  }

  const currentLeg = legs.find(l => l.id === leg_id);
  if (!currentLeg) {
    return res.status(404).json({ error: "Leg not found" });
  }

  // Calculate used teams
  const pickedTeams = picks
    .filter(p => p.entry_id === entry_id && p.contest_leg_id !== leg_id)
    .map(p => p.team_id);

  // Find all team week lines for this leg
  const legLines = lines.filter(l => l.contest_leg_id === leg_id);

  // Filter out teams that have already been picked
  const availableLines = legLines.filter(l => !pickedTeams.includes(l.team_id));

  // Sort by Contest Equity Score descending
  const recommended = availableLines.map(line => {
    const teamObj = teams.find(t => t.id === line.team_id)!;
    
    // Create detailed recommendation message
    let insight = "Strong pick with balanced risk and equity profile.";
    if (line.win_probability > 0.8 && line.future_value > 0.8) {
      insight = "Extremely high safety but high future value penalty. Suggest conserving unless critical.";
    } else if (line.win_probability > 0.85 && line.future_value < 0.6) {
      insight = "Absolute Golden Matchup: Safe win probability with almost zero sacrificed future value!";
    } else if (line.pick_popularity < 0.03 && line.win_probability > 0.7) {
      insight = "High Leverage Play: Low popularity gives massive tournament equity bump if successful.";
    }

    if (currentLeg.leg_type === "thanksgiving") {
      insight += " Thanksgiving game shielding: This pick takes advantage of special Thursday holiday scheduling.";
    } else if (currentLeg.leg_type === "christmas") {
      insight += " Christmas day shielding: Utilizes teams playing in special holiday schedule.";
    }

    return {
      team: teamObj,
      line,
      insight
    };
  }).sort((a, b) => b.line.contest_equity_score - a.line.contest_equity_score);

  res.json({
    entry,
    leg: currentLeg,
    used_teams: pickedTeams,
    recommendations: recommended.slice(0, 5) // Return top 5
  });
});

// ==========================================
// VITE DEV SERVER / STATIC ASSETS PIPELINE
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Semi-Sharp V2 Server] Access the app at http://localhost:${PORT}`);
  });
}

startServer();
