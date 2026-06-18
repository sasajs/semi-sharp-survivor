import { BaseAdapter } from "./BaseAdapter";
import { ImportType } from "../models";

export class LineAdapter extends BaseAdapter {
  type = "consensus_odds_provider";
  name = "Consensus Market Betting Line Adapter";
  description = "Pulls opening or closing bookmaker betting odds (points spreads, moneyline, over-under).";
  supportedType = ImportType.LINE;

  async fetchData(params?: Record<string, any>): Promise<any[]> {
    return [
      { tracking_id: "2026_01_SF_NYJ", consensus_spread: -4.5, consensus_total: 42.5, spread_price: -110 },
      { tracking_id: "2026_01_KC_BAL", consensus_spread: -3.0, consensus_total: 47.0, spread_price: -105 }
    ];
  }

  async transform(rawItems: any[]): Promise<any[]> {
    return rawItems.map(item => ({
      gameId: item.tracking_id,
      pointSpread: item.consensus_spread,
      overUnder: item.consensus_total,
      price: item.spread_price,
      retrievedAt: new Date().toISOString()
    }));
  }
}
