import { de, en, fr, ru } from "../../i18n/supportedLanguages";

describe("My Budgets hub i18n (issue #356)", () => {
  it("ships EN+DE+FR+RU copy for hub actions and implicit labeling", () => {
    for (const locale of [en, de, fr, ru]) {
      expect(locale.myBudgets).toBeTruthy();
      expect(locale.yourBudgets).toBeTruthy();
      expect(locale.joinBudget).toBeTruthy();
      expect(locale.joinBudgetHint).toBeTruthy();
      expect(locale.addAnotherBudget).toBeTruthy();
      expect(locale.addAnotherBudgetHint).toBeTruthy();
      expect(locale.yourBudget).toBeTruthy();
      expect(locale.myBudgetAutoName).toBeTruthy();
      expect(locale.activeTripLabel).toBeTruthy();
      expect(locale.implicitBudgetExpenseCount).toContain("%{count}");
    }
  });

  it("English matches Variant B and join-rule PRD wording", () => {
    expect(en.myBudgets).toBe("My Budgets");
    expect(en.yourBudgets).toBe("Your budgets");
    expect(en.joinBudget).toBe("Join budget");
    expect(en.addAnotherBudget).toBe("Add another budget");
    expect(en.addAnotherBudgetHint).toBe("New budgets start empty");
    expect(en.yourBudget).toBe("Your budget");
    expect(en.myBudgetAutoName).toBe("My Budget");
    expect(en.activeTripLabel).toBe("Active");
  });
});
