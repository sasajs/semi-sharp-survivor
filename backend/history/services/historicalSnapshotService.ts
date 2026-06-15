import { 
  WeeklySnapshot, 
  FeatureSnapshot, 
  InventorySnapshotRecord, 
  RiskSnapshot 
} from "../models";
import { 
  snapshotRepo, 
  weeklyInputRepo, 
  teamFeatureRepo, 
  gameFeatureRepo, 
  inventoryRepo, 
  reservationRepo, 
  futureValueRepo, 
  riskRepo, 
  teamRepo, 
  legRepo 
} from "../../repositories";
import { VersionTrackingService } from "./versionTrackingService";

export class HistoricalSnapshotService {
  /**
   * Generates and writes immutable snapshots for a specific contest leg and entry.
   * Captured values are immutable once written to the snapshot tables.
   */
  static async captureSnapshots(inputs: {
    contestId: string;
    contestLegId: string;
    weekNumber: number;
    entryId: string;
    createdBy: string;
    scheduleData?: any;
    importedValues?: any;
    sicInputs?: any;
    restDisparityInputs?: any;
    weatherInputs?: any;
    manualResearchInputs?: any;
  }): Promise<{
    weeklySnapshot: WeeklySnapshot;
    featureSnapshot: FeatureSnapshot;
    inventorySnapshot: InventorySnapshotRecord;
    riskSnapshot: RiskSnapshot;
  }> {
    const {
      contestId,
      contestLegId,
      weekNumber,
      entryId,
      createdBy,
      scheduleData = {},
      importedValues = {},
      sicInputs = {},
      restDisparityInputs = {},
      weatherInputs = {},
      manualResearchInputs = {}
    } = inputs;

    const versions = VersionTrackingService.getVersionsForLeg(contestLegId);

    // 1. Weekly Inputs Snapshot Creation
    const weeklySnapshot: WeeklySnapshot = {
      id: `ws-${contestLegId}-${Date.now()}`,
      contest_id: contestId,
      contest_leg_id: contestLegId,
      week_number: weekNumber,
      schedule_data: scheduleData,
      imported_values: importedValues,
      sic_inputs: sicInputs,
      rest_disparity_inputs: restDisparityInputs,
      weather_inputs: weatherInputs,
      manual_research_inputs: manualResearchInputs,
      data_version: versions.data_version,
      created_at: new Date().toISOString(),
      created_by: createdBy
    };
    await snapshotRepo.saveWeeklySnapshot(weeklySnapshot);

    // 2. Feature Store Snapshot Creation
    const teamFeatures = await teamFeatureRepo.getAll();
    const gameFeatures = await gameFeatureRepo.getAll();
    
    // Derived features: combine or enrich features
    const derivedFeatures = teamFeatures.map(tf => {
      const gf = gameFeatures.find(f => f.home_team_id === tf.team_id || f.away_team_id === tf.team_id);
      return {
        team_id: tf.team_id,
        aggregate_metric: ((tf.off_efficiency ?? 0) - (tf.def_efficiency ?? 0)) * 100,
        game_context_id: gf?.id ?? null
      };
    });

    const featureSnapshot: FeatureSnapshot = {
      id: `fs-${contestLegId}-${Date.now()}`,
      contest_id: contestId,
      contest_leg_id: contestLegId,
      week_number: weekNumber,
      team_features: teamFeatures,
      game_features: gameFeatures,
      derived_features: derivedFeatures,
      feature_version: versions.feature_version,
      created_at: new Date().toISOString(),
      created_by: createdBy
    };
    await snapshotRepo.saveFeatureSnapshot(featureSnapshot);

    // 3. Inventory Snapshot Creation
    const invReport = await inventoryRepo.getByEntryIdAndLeg(entryId, contestLegId);
    const reservations = await reservationRepo.getHolidayReservations(entryId);
    const reservedTeams = await reservationRepo.getReservedTeams(entryId);
    const fvProfiles = await futureValueRepo.getProfilesByLeg(contestLegId);
    
    const used_teams = invReport?.used_teams ?? [];
    const allTeams = await teamRepo.getAll();
    const available_teams = allTeams.map(t => t.id).filter(id => !used_teams.includes(id));

    const fvMap: Record<string, number> = {};
    for (const p of fvProfiles) {
      fvMap[p.team_id] = p.future_value_score;
    }

    const inventorySnapshot: InventorySnapshotRecord = {
      id: `is-${entryId}-${contestLegId}-${Date.now()}`,
      entry_id: entryId,
      contest_id: contestId,
      contest_leg_id: contestLegId,
      week_number: weekNumber,
      used_teams,
      available_teams,
      reserved_teams: reservedTeams,
      future_value_scores: fvMap,
      holiday_protection_values: {
        thanksgiving_protection: reservations.some(r => r.entry_id === entryId),
        christmas_protection: reservations.some(r => r.entry_id === entryId)
      },
      inventory_version: versions.inventory_version,
      created_at: new Date().toISOString(),
      created_by: createdBy
    };
    await snapshotRepo.saveInventorySnapshot(inventorySnapshot);

    // 4. Risk Snapshot Creation
    const riskProfiles = await riskRepo.getAllForEntry(entryId);
    
    const riskSnapshot: RiskSnapshot = {
      id: `rs-${contestLegId}-${Date.now()}`,
      contest_id: contestId,
      contest_leg_id: contestLegId,
      week_number: weekNumber,
      team_risks: riskProfiles,
      game_risks: [], // Optional advanced logs
      risk_version: versions.risk_version,
      created_at: new Date().toISOString(),
      created_by: createdBy
    };
    await snapshotRepo.saveRiskSnapshot(riskSnapshot);

    return {
      weeklySnapshot,
      featureSnapshot,
      inventorySnapshot,
      riskSnapshot
    };
  }

  /**
   * Retrieves snapshots by week number
   */
  static async getSnapshotByWeek(weekNumber: number) {
    const list = await snapshotRepo.getAllWeeklySnapshots();
    const weekly = list.filter(w => w.week_number === weekNumber);
    return weekly;
  }

  /**
   * Retrieves complete snapshots by contest leg ID
   */
  static async getSnapshotByContestLeg(legId: string) {
    const weekly = await snapshotRepo.getWeeklySnapshot(legId);
    const feature = await snapshotRepo.getFeatureSnapshot(legId);
    const inventory = await snapshotRepo.getAllInventorySnapshotsByLeg(legId);
    const risk = await snapshotRepo.getRiskSnapshot(legId);

    return {
      weekly,
      feature,
      inventory_list: inventory,
      risk
    };
  }

  /**
   * Retrieves complete historical version metadata across all snapshots
   */
  static async getVersionHistory() {
    const weeklySnapshots = await snapshotRepo.getAllWeeklySnapshots();
    const featureSnapshots = await snapshotRepo.getAllFeatureSnapshots();
    
    return weeklySnapshots.map(ws => {
      const fs = featureSnapshots.find(f => f.contest_leg_id === ws.contest_leg_id);
      return {
        contest_leg_id: ws.contest_leg_id,
        week_number: ws.week_number,
        data_version: ws.data_version,
        feature_version: fs?.feature_version ?? 1,
        created_at: ws.created_at
      };
    });
  }

  /**
   * Exports full reproducible history datasets for scientific validation & research.
   */
  static async exportFullHistoryDataset(): Promise<any[]> {
    const weeklySnapshots = await snapshotRepo.getAllWeeklySnapshots();
    const featureSnapshots = await snapshotRepo.getAllFeatureSnapshots();
    const riskSnapshots = await snapshotRepo.getAllRiskSnapshots();

    const legs = await legRepo.getAll();

    return weeklySnapshots.map(ws => {
      const leg = legs.find(l => l.id === ws.contest_leg_id);
      const fs = featureSnapshots.find(p => p.contest_leg_id === ws.contest_leg_id);
      const rs = riskSnapshots.find(r => r.contest_leg_id === ws.contest_leg_id);

      return {
        contest_leg_id: ws.contest_leg_id,
        leg_name: leg?.name || `Leg ${ws.week_number}`,
        week_number: ws.week_number,
        weekly_inputs: {
          schedule_count: Object.keys(ws.schedule_data || {}).length,
          imported_keys: Object.keys(ws.imported_values || {}),
          sic: ws.sic_inputs
        },
        feature_count: (fs?.team_features?.length ?? 0) + (fs?.game_features?.length ?? 0),
        registered_risks: rs?.team_risks?.length ?? 0,
        versions: {
          data_version: ws.data_version,
          feature_version: fs?.feature_version ?? 1,
          risk_version: rs?.risk_version ?? 1
        },
        captured_at: ws.created_at
      };
    });
  }
}
