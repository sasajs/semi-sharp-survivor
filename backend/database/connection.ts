import { PostgresConnectionManager, query as managerQuery } from "./connection/PostgresConnectionManager";

// Delegate to the singleton connection manager
export const pool = PostgresConnectionManager.getInstance().getPool();

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  return managerQuery<T>(text, params);
}
