// Thin shim for backward compatibility.
// New pure functions live in util/budget.ts (no React Context dependencies).
export {
  calculateAverageUpToDate,
  calculateDailyAverage,
  computeDynamicDailyBudget,
  getBudgetColor,
} from "./budget";
