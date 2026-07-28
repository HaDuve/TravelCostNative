import { de, en, fr, ru } from "../../i18n/supportedLanguages";

/** Keys passed to ActionRow `hint` — must ship in EN, DE, FR, and RU. */
const ACTION_ROW_HINT_KEYS = [
  "addAnotherBudgetHint",
  "addExpHereHint",
  "joinBudgetHint",
  "supportFeedbackHint",
  "getLocalPriceHint",
  "getLocalPriceExpenseHint",
  "getLocalPriceExpenseDealHint",
  "summaryHint",
] as const;

describe("ActionRow hint i18n", () => {
  it("ships EN+DE+FR+RU copy for every ActionRow hint key", () => {
    for (const locale of [en, de, fr, ru]) {
      for (const key of ACTION_ROW_HINT_KEYS) {
        expect(locale[key]).toBeTruthy();
      }
    }
  });

  it("English hints match locked ActionRow UX wording", () => {
    expect(en.addAnotherBudgetHint).toBe("New budgets start empty");
    expect(en.addExpHereHint).toBe("On this day: %{date}");
    expect(en.joinBudgetHint).toBe("Enter an invite code or link");
    expect(en.supportFeedbackHint).toBe("Tell us what to improve");
    expect(en.getLocalPriceHint).toBe("Check prices with AI on the road");
    expect(en.summaryHint).toBe("Quick overview for one or more budgets");
  });
});
