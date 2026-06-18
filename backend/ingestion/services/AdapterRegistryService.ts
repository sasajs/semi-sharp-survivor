import { IAdapter } from "../adapters/BaseAdapter";
import { ScheduleAdapter } from "../adapters/ScheduleAdapter";
import { TeamAdapter } from "../adapters/TeamAdapter";
import { InjuryAdapter } from "../adapters/InjuryAdapter";
import { LineAdapter } from "../adapters/LineAdapter";
import { WeatherAdapter } from "../adapters/WeatherAdapter";

export class AdapterRegistryService {
  private static registry: Map<string, IAdapter> = new Map();

  static initializeDefaults(): void {
    if (this.registry.size === 0) {
      this.registerAdapter(new ScheduleAdapter());
      this.registerAdapter(new TeamAdapter());
      this.registerAdapter(new InjuryAdapter());
      this.registerAdapter(new LineAdapter());
      this.registerAdapter(new WeatherAdapter());
    }
  }

  static registerAdapter(adapter: IAdapter): void {
    if (!adapter || !adapter.type) {
      throw new Error("Invalid adapter registration request: adapter.type must be defined");
    }
    this.registry.set(adapter.type, adapter);
  }

  static getAdapter(type: string): IAdapter | null {
    this.initializeDefaults();
    return this.registry.get(type) || null;
  }

  static listAdapters(): IAdapter[] {
    this.initializeDefaults();
    return Array.from(this.registry.values());
  }

  static validateAdapter(type: string): boolean {
    this.initializeDefaults();
    const adapter = this.registry.get(type);
    if (!adapter) return false;
    return typeof adapter.validateConnection === "function" && typeof adapter.fetchData === "function";
  }
}
// Run default initialization immediately
AdapterRegistryService.initializeDefaults();
