export type PrototypeBudget = {
  id: string;
  name: string;
  isImplicit: boolean;
  isActive: boolean;
  expenseCount: number;
  spent: number;
  currency: string;
  travellerCount: number;
};

export type PrototypeScenario = "implicit-only" | "named-single" | "multi";

export const SCENARIO_LABELS: Record<PrototypeScenario, string> = {
  "implicit-only": "Implicit only",
  "named-single": "One named",
  multi: "Multi-budget",
};

export function budgetsForScenario(scenario: PrototypeScenario): PrototypeBudget[] {
  switch (scenario) {
    case "implicit-only":
      return [
        {
          id: "implicit",
          name: "Your budget",
          isImplicit: true,
          isActive: true,
          expenseCount: 3,
          spent: 47.5,
          currency: "EUR",
          travellerCount: 1,
        },
      ];
    case "named-single":
      return [
        {
          id: "home",
          name: "Home expenses",
          isImplicit: false,
          isActive: true,
          expenseCount: 12,
          spent: 340.2,
          currency: "EUR",
          travellerCount: 1,
        },
      ];
    case "multi":
      return [
        {
          id: "home",
          name: "Home expenses",
          isImplicit: false,
          isActive: true,
          expenseCount: 12,
          spent: 340.2,
          currency: "EUR",
          travellerCount: 1,
        },
        {
          id: "shared",
          name: "Flat with Ana",
          isImplicit: false,
          isActive: false,
          expenseCount: 28,
          spent: 892.0,
          currency: "EUR",
          travellerCount: 2,
        },
      ];
  }
}
