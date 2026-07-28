import { de, en, fr, ru } from "../../i18n/supportedLanguages";

/** Context hints on premium upsell ActionRows — must ship in EN, DE, FR, and RU. */
const PAYWALL_HINT_KEYS = [
  "paywallHintCustomCategories",
  "paywallHintExpenseSearch",
  "paywallHintAdvancedCharts",
  "paywallHintGptDeal",
  "paywallHintDebtSettlements",
  "paywallHintUnlimitedExpenses",
] as const;

describe("paywall feature hint i18n", () => {
  it("ships EN+DE+FR+RU copy for every paywall hint key", () => {
    for (const locale of [en, de, fr, ru]) {
      for (const key of PAYWALL_HINT_KEYS) {
        expect(locale[key]).toBeTruthy();
      }
    }
  });

  it("English hints explain the blocked premium feature in plain language", () => {
    expect(en.paywallHintCustomCategories).toBe(
      "Create your own categories"
    );
    expect(en.paywallHintExpenseSearch).toBe(
      "Search and filter expenses"
    );
    expect(en.paywallHintAdvancedCharts).toBe(
      "Advanced spending charts"
    );
    expect(en.paywallHintGptDeal).toBe(
      "Ask AI if you got a good deal"
    );
    expect(en.paywallHintDebtSettlements).toBe(
      "Simplify debt settlements"
    );
    expect(en.paywallHintUnlimitedExpenses).toBe(
      "Add unlimited budgets and expenses"
    );
  });
});
