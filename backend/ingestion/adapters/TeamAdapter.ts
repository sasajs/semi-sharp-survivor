import { BaseAdapter } from "./BaseAdapter";
import { ImportType } from "../models";

export class TeamAdapter extends BaseAdapter {
  type = "nfl_team_registry";
  name = "NFL Franchise Information Adapter";
  description = "Refreshes active NFL franchise metadata, organizational profiles, conference divisions, and logos.";
  supportedType = ImportType.TEAM;

  async fetchData(params?: Record<string, any>): Promise<any[]> {
    return [
      { code: "SF", city: "San Francisco", nick: "49ers", conf: "NFC", division: "West" },
      { code: "KC", city: "Kansas City", nick: "Chiefs", conf: "AFC", division: "West" },
      { code: "BAL", city: "Baltimore", nick: "Ravens", conf: "AFC", division: "North" }
    ];
  }

  async transform(rawItems: any[]): Promise<any[]> {
    return rawItems.map(item => ({
      shortCode: item.code,
      fullName: `${item.city} ${item.nick}`,
      conference: item.conf,
      division: item.division,
      active: true
    }));
  }
}
