import { RepositoryFactory } from "../repositories/RepositoryFactory";
import { EntryStrategyProfile, EntryMetadata, StrategyType } from "../../src/types";

export class EntryStrategyService {
  private profileRepo = RepositoryFactory.getEntryStrategyProfileRepo();
  private metadataRepo = RepositoryFactory.getEntryMetadataRepo();
  private entryRepo = RepositoryFactory.getEntryRepo();

  async getProfiles(): Promise<EntryStrategyProfile[]> {
    return this.profileRepo.getAll();
  }

  async getMetadata(): Promise<EntryMetadata[]> {
    return this.metadataRepo.getAll();
  }

  async getEntryStrategyDetails(entryId: string): Promise<{
    entryId: string;
    name: string;
    profile: EntryStrategyProfile | null;
    metadata: EntryMetadata | null;
  } | null> {
    const entry = (await this.entryRepo.getAll()).find(e => e.id === entryId);
    if (!entry) return null;

    const profile = await this.profileRepo.getByEntryId(entryId);
    const metadata = await this.metadataRepo.getByEntryId(entryId);

    return {
      entryId,
      name: entry.name,
      profile,
      metadata
    };
  }

  async saveProfile(profile: EntryStrategyProfile): Promise<EntryStrategyProfile> {
    // Check if entry exists
    const entries = await this.entryRepo.getAll();
    const entryExists = entries.some(e => e.id === profile.entry_id);
    if (!entryExists) {
      throw new Error(`Cannot save strategy profile: Survivor Entry ${profile.entry_id} does not exist.`);
    }

    // Ensure we have a metadata record too
    let metadata = await this.metadataRepo.getByEntryId(profile.entry_id);
    if (!metadata) {
      metadata = {
        entry_id: profile.entry_id,
        owner_name: "Unassigned",
        primary_goal: profile.objective,
        active_flag: true
      };
      await this.metadataRepo.save(metadata);
    }

    return this.profileRepo.save(profile);
  }

  async saveMetadata(metadata: EntryMetadata): Promise<EntryMetadata> {
    // Check if entry exists
    const entries = await this.entryRepo.getAll();
    const entryExists = entries.some(e => e.id === metadata.entry_id);
    if (!entryExists) {
      throw new Error(`Cannot save metadata: Survivor Entry ${metadata.entry_id} does not exist.`);
    }

    return this.metadataRepo.save(metadata);
  }

  async getAllStrategicEntries() {
    const entries = await this.entryRepo.getAll();
    const profiles = await this.profileRepo.getAll();
    const metadataList = await this.metadataRepo.getAll();

    return entries.map(entry => {
      const profile = profiles.find(p => p.entry_id === entry.id) || null;
      const metadata = metadataList.find(m => m.entry_id === entry.id) || null;
      return {
        ...entry,
        profile,
        metadata
      };
    });
  }

  /**
   * Evaluates diversification group joint status.
   * Scans all survivor entries in the group to verify whether duplication exists in active pick lists,
   * providing helpful warnings and calculating a Portfolio Diversification Index.
   */
  async analyzeDiversificationGroup(groupName: string): Promise<{
    groupName: string;
    memberEntryIds: string[];
    memberNames: string[];
    objectives: Record<string, string>;
    pickDuplicationsByLeg: Record<string, { teamId: string; entryIds: string[] }[]>;
    diversificationIndex: number;
    warnings: string[];
  }> {
    const profiles = await this.profileRepo.getAll();
    const groupProfiles = profiles.filter(p => p.diversification_group === groupName);
    const entryIds = groupProfiles.map(p => p.entry_id);

    const entries = await this.entryRepo.getAll();
    const groupEntries = entries.filter(e => entryIds.includes(e.id));
    
    // Fetch picks 
    const pickRepo = RepositoryFactory.getPickRepo();
    const allPicks = await pickRepo.getAll();

    const groupPicks = allPicks.filter(p => entryIds.includes(p.entry_id));

    // Group picks by leg
    const picksByLeg: Record<string, Record<string, string[]>> = {}; 
    groupPicks.forEach(pick => {
      const leg = pick.contest_leg_id;
      const team = pick.team_id;
      if (!picksByLeg[leg]) picksByLeg[leg] = {};
      if (!picksByLeg[leg][team]) picksByLeg[leg][team] = [];
      picksByLeg[leg][team].push(pick.entry_id);
    });

    const pickDuplicationsByLeg: Record<string, { teamId: string; entryIds: string[] }[]> = {};
    let totalPicksInGroup = groupPicks.length;
    let duplicatePicksCount = 0;

    Object.keys(picksByLeg).forEach(legId => {
      const teamMappings = picksByLeg[legId];
      const duplicates: { teamId: string; entryIds: string[] }[] = [];
      Object.keys(teamMappings).forEach(teamId => {
        const entryIdList = teamMappings[teamId];
        if (entryIdList.length > 1) {
          duplicates.push({ teamId, entryIds: entryIdList });
          duplicatePicksCount += (entryIdList.length - 1);
        }
      });
      if (duplicates.length > 0) {
        pickDuplicationsByLeg[legId] = duplicates;
      }
    });

    // Simple Index representing portion of picks that are unique
    const diversificationIndex = totalPicksInGroup > 0 
      ? Math.round(((totalPicksInGroup - duplicatePicksCount) / totalPicksInGroup) * 100) 
      : 100;

    const warnings: string[] = [];
    if (diversificationIndex < 70) {
      warnings.push(`Low portfolio diversification index of ${diversificationIndex}% in group ${groupName}. Consider aligning entry models jointly to maximize different expected value paths.`);
    }

    Object.keys(pickDuplicationsByLeg).forEach(legId => {
      pickDuplicationsByLeg[legId].forEach(dup => {
        const names = groupEntries.filter(e => dup.entryIds.includes(e.id)).map(e => e.name);
        warnings.push(`Duplicate Pick Warning on ${legId}: Team "${dup.teamId.toUpperCase()}" selected by multiple group entries (${names.join(", ")}).`);
      });
    });

    const objectives: Record<string, string> = {};
    groupProfiles.forEach(p => {
      objectives[p.entry_id] = p.objective;
    });

    return {
      groupName,
      memberEntryIds: entryIds,
      memberNames: groupEntries.map(e => e.name),
      objectives,
      pickDuplicationsByLeg,
      diversificationIndex,
      warnings
    };
  }
}
