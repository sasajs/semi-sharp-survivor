export interface Contest {
  id: string;
  name: string;
  year: number;
  status: 'active' | 'completed';
}

export interface ContestLeg {
  id: string;
  name: string;
  leg_type: 'regular' | 'thanksgiving' | 'christmas';
  display_order: number;
  nfl_week: number;
}

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  bye_week: number;
  primary_color: string;
  secondary_color: string;
}

export interface Game {
  id: string;
  contest_leg_id: string;
  home_team_id: string;
  away_team_id: string;
  home_score?: number;
  away_score?: number;
  status: 'scheduled' | 'final';
  game_time: string;
}

export interface TeamWeekLine {
  id: string;
  team_id: string;
  contest_leg_id: string;
  win_probability: number; // e.g. 0.72 (72%)
  pick_popularity: number; // e.g. 0.15 (15% picked)
  future_value: number; // e.g. 0.8 (high future value, like Chiefs)
  leverage_multiplier: number; // e.g. 1.2
  future_value_multiplier: number; // e.g. 0.3
  holiday_safety_multiplier: number; // e.g. 1.1
  contest_equity_score: number; // Calculated: WP * Leverage * FV_mult * Holiday_safety
}

export interface SurvivorEntry {
  id: string;
  name: string;
  status: 'alive' | 'eliminated';
  notes?: string;
  created_at: string;
}

export interface SurvivorPick {
  id: string;
  entry_id: string;
  contest_leg_id: string;
  team_id: string;
  pick_status: 'pending' | 'won' | 'lost';
  created_at: string;
}

export interface SurvivorHistory {
  id: string;
  entry_id: string;
  contest_leg_id: string;
  team_id: string;
  result: 'won' | 'lost' | 'tie_loss';
}
