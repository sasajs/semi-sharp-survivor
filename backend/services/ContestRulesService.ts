import { HolidayType } from "../../src/types";

export interface ContestLegDefinition {
  displayOrder: number;
  name: string;
  isHoliday: boolean;
  nflWeek: number;
  type: "regular" | "thanksgiving" | "christmas";
}

export interface ContestRules {
  contestTypeId: string;
  name: string;
  totalLegs: number;
  usesThanksgivingLeg: boolean;
  usesChristmasLeg: boolean;
  usesHolidayReservations: boolean;
  holidayLegs(): { name: string; type: "thanksgiving" | "christmas"; nflWeek: number; displayOrder: number }[];
  roadmapLegs(): ContestLegDefinition[];
}

export class CircaSurvivorRules implements ContestRules {
  contestTypeId = "circa";
  name = "Circa Survivor";
  totalLegs = 20;
  usesThanksgivingLeg = true;
  usesChristmasLeg = true;
  usesHolidayReservations = true;

  holidayLegs() {
    return [
      { name: "Thanksgiving / Black Friday", type: "thanksgiving" as const, nflWeek: 12, displayOrder: 13 },
      { name: "Christmas Day", type: "christmas" as const, nflWeek: 16, displayOrder: 18 }
    ];
  }

  roadmapLegs(): ContestLegDefinition[] {
    const legs: ContestLegDefinition[] = [];
    let currentLeg = 1;
    for (let w = 1; w <= 18; w++) {
      legs.push({
        displayOrder: currentLeg++,
        name: `Week ${w}`,
        isHoliday: false,
        nflWeek: w,
        type: "regular"
      });
      if (w === 12) {
        legs.push({
          displayOrder: currentLeg++,
          name: "Thanksgiving / Black Friday",
          isHoliday: true,
          nflWeek: 12,
          type: "thanksgiving"
        });
      }
      if (w === 16) {
        legs.push({
          displayOrder: currentLeg++,
          name: "Christmas Day",
          isHoliday: true,
          nflWeek: 16,
          type: "christmas"
        });
      }
    }
    return legs;
  }
}

export class StandardSurvivorRules implements ContestRules {
  contestTypeId = "standard";
  name = "Standard Survivor";
  totalLegs = 18;
  usesThanksgivingLeg = false;
  usesChristmasLeg = false;
  usesHolidayReservations = false;

  holidayLegs() {
    return [];
  }

  roadmapLegs(): ContestLegDefinition[] {
    const legs: ContestLegDefinition[] = [];
    for (let w = 1; w <= 18; w++) {
      legs.push({
        displayOrder: w,
        name: `Week ${w}`,
        isHoliday: false,
        nflWeek: w,
        type: "regular"
      });
    }
    return legs;
  }
}

export class ContestRulesService {
  private rulesMap: Record<string, ContestRules> = {
    circa: new CircaSurvivorRules(),
    standard: new StandardSurvivorRules()
  };

  getRules(contestTypeId: string): ContestRules {
    const cleanId = (contestTypeId || "circa").toLowerCase();
    return this.rulesMap[cleanId] || this.rulesMap.circa;
  }

  getAllRules(): ContestRules[] {
    return Object.values(this.rulesMap);
  }
}

export const contestRulesService = new ContestRulesService();
