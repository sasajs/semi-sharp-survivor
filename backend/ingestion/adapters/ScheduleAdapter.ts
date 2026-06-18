import { BaseAdapter } from "./BaseAdapter";
import { ImportType } from "../models";

export class ScheduleAdapter extends BaseAdapter {
  type = "nfl_schedule_provider";
  name = "NFL Schedule Feed Adapter";
  description = "Synchronizes NFL stadium locations, kick-off dates, times, and weekly match timelines.";
  supportedType = ImportType.SCHEDULE;

  async fetchData(params?: Record<string, any>): Promise<any[]> {
    return [
      { raw_game_id: "2026_01_SF_NYJ", raw_home: "SF", raw_away: "NYJ", kickoff: "2026-09-10T20:20:00Z", target_week: 1 },
      { raw_game_id: "2026_01_KC_BAL", raw_home: "KC", raw_away: "BAL", kickoff: "2026-09-13T16:25:00Z", target_week: 1 },
      { raw_game_id: "2026_01_PHI_GB", raw_home: "PHI", raw_away: "GB", kickoff: "2026-09-13T20:15:00Z", target_week: 1 }
    ];
  }

  async transform(rawItems: any[]): Promise<any[]> {
    return rawItems.map(item => ({
      gameId: item.raw_game_id,
      homeTeam: item.raw_home,
      awayTeam: item.raw_away,
      time: item.kickoff,
      week: item.target_week,
      season: "2026",
      status: "scheduled"
    }));
  }
}
