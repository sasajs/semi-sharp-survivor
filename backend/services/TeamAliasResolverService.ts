import { teamRepo, teamAliasRepo } from "../repositories/index";
import { Team, TeamAlias } from "../../src/types";

export class TeamAliasResolverService {
  /**
   * Normalizes an alias string by converting it to lowercase,
   * stripping non-alphanumeric characters, and collapsing spaces/whitespace.
   */
  normalizeTeamAlias(value: string): string {
    if (!value) return "";
    return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  /**
   * Resolves a team ID using the team_aliases table.
   * Prioritizes provider-specific aliases over global aliases.
   * Returns the team ID (lowercase, e.g. 'kc') or null if unresolved.
   */
  async resolveTeamId(value: string, providerName?: string): Promise<string | null> {
    const normalized = this.normalizeTeamAlias(value);
    if (!normalized) return null;

    const matchedAlias = await teamAliasRepo.findByNormalizedAlias(normalized, providerName);
    return matchedAlias ? matchedAlias.team_id : null;
  }

  /**
   * Resolves a full Team object using the resolved team ID.
   * Returns the Team object or null if unresolved.
   */
  async resolveTeam(value: string, providerName?: string): Promise<Team | null> {
    const teamId = await this.resolveTeamId(value, providerName);
    if (!teamId) return null;

    return await teamRepo.getById(teamId);
  }

  /**
   * Lists all aliases.
   */
  async listAliases(): Promise<TeamAlias[]> {
    return await teamAliasRepo.listAll();
  }

  /**
   * Lists all aliases for a specific team.
   */
  async listAliasesForTeam(teamId: string): Promise<TeamAlias[]> {
    return await teamAliasRepo.findByTeamId(teamId);
  }

  /**
   * Creates a new team alias.
   */
  async createAlias(alias: Omit<TeamAlias, "id" | "normalized_alias" | "created_at" | "updated_at">): Promise<TeamAlias> {
    const normalized = this.normalizeTeamAlias(alias.alias);
    return await teamAliasRepo.createAlias({
      ...alias,
      normalized_alias: normalized
    });
  }

  /**
   * Upserts a team alias.
   */
  async upsertAlias(alias: Omit<TeamAlias, "id" | "normalized_alias" | "created_at" | "updated_at">): Promise<TeamAlias> {
    const normalized = this.normalizeTeamAlias(alias.alias);
    return await teamAliasRepo.upsertAlias({
      ...alias,
      normalized_alias: normalized
    });
  }

  /**
   * Deactivates a team alias.
   */
  async deactivateAlias(id: string): Promise<boolean> {
    return await teamAliasRepo.deactivateAlias(id);
  }
}

export const teamAliasResolverService = new TeamAliasResolverService();
