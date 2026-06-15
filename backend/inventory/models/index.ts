export interface EntryInventory {
  id: string;
  entry_id: string;
  contest_leg_id: string;
  inventory_version: number;
  used_teams: string[];
  available_teams: string[];
  reserved_teams: ReservedTeam[];
  holiday_reservations: HolidayReservation[];
  inventory_depth: number;
  future_inventory_strength: number;
  holiday_protection_score: number;
  remaining_elite_teams: number;
  remaining_playoff_teams: number;
  created_at: string;
  updated_at: string;
}

export interface TeamAvailability {
  team_id: string;
  is_available: boolean;
  is_used: boolean;
  is_reserved: boolean;
  reason?: string;
}

export interface ReservedTeam {
  id: string;
  entry_id: string;
  contest_leg_id: string;
  team_id: string;
  is_protected: boolean;
  created_at: string;
  updated_at: string;
}

export interface HolidayReservation {
  id: string;
  entry_id: string;
  contest_leg_id: string;
  team_id: string;
  status: 'suggested' | 'confirmed';
  created_at: string;
  updated_at: string;
}

export interface FutureValueProfile {
  id: string;
  team_id: string;
  contest_leg_id: string;
  future_value_score: number;
  scarcity_score: number;
  is_elite: boolean;
  is_playoff_caliber: boolean;
  holiday_usefulness: number;
  created_at: string;
  updated_at: string;
}
