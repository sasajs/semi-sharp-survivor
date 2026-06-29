import crypto from "crypto";
import { AppUser } from "../../src/types";
import { userAccessRepo } from "../repositories";

export class UserAccessService {
  private static tokenToUserId: Map<string, string> = new Map();

  /**
   * Associate an active session token with a user ID.
   */
  static setSessionUser(token: string, userId: string): void {
    this.tokenToUserId.set(token, userId);
  }

  /**
   * Retrieve the user ID associated with an active session token.
   */
  static getSessionUserId(token: string): string | null {
    return this.tokenToUserId.get(token) || null;
  }

  /**
   * Remove a session mapping.
   */
  static clearSession(token: string): void {
    this.tokenToUserId.delete(token);
  }

  /**
   * Hashes a plain password with SHA-256 for secure DB storage/comparison.
   */
  static hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  /**
   * Retrieves all registered application users.
   */
  static async getAllUsers(): Promise<AppUser[]> {
    return userAccessRepo.getAll();
  }

  /**
   * Retrieve a user by their unique ID.
   */
  static async getUserById(id: string): Promise<AppUser | null> {
    return userAccessRepo.getById(id);
  }

  /**
   * Retrieves a user by their unique username.
   */
  static async getUserByUsername(username: string): Promise<AppUser | null> {
    return userAccessRepo.getByUsername(username);
  }

  /**
   * Authenticates a user against stored password hash.
   */
  static async authenticate(username: string, passwordPlain: string): Promise<AppUser | null> {
    if (!username || !passwordPlain) return null;
    
    const user = await userAccessRepo.getByUsername(username);
    if (!user || !user.active) {
      return null;
    }

    const hash = this.hashPassword(passwordPlain);
    if (user.password_hash === hash) {
      return user;
    }
    return null;
  }
}
