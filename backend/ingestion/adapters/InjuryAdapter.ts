import { BaseAdapter } from "./BaseAdapter";
import { ImportType } from "../models";

export class InjuryAdapter extends BaseAdapter {
  type = "injury_report_adapter";
  name = "NFL Daily Injury Report Adapter";
  description = "Extracts injury reports, active reservation lists, recovery outlooks, and game statuses.";
  supportedType = ImportType.INJURY;

  async fetchData(params?: Record<string, any>): Promise<any[]> {
    return [
      { name: "Christian McCaffrey", squad: "SF", is_injured: true, details: "Achilles", probability: "Questionable" },
      { name: "Patrick Mahomes", squad: "KC", is_injured: false, details: "Ankle", probability: "Full Go" }
    ];
  }

  async transform(rawItems: any[]): Promise<any[]> {
    return rawItems.map(item => ({
      player: item.name,
      teamCode: item.squad,
      injuryReason: item.details,
      gameStatus: item.probability,
      reportedAt: new Date().toISOString()
    }));
  }
}
