import { de, en, fr, ru } from "../../i18n/supportedLanguages";

/**
 * Trip form titles/alerts use Budget container vocabulary (issue #357).
 * Supersedes #223 “Trip entity” form-title wording for home-first P1.
 */
describe("trip form i18n (issue #357 home-first)", () => {
  it("EN form titles and name alert use Budget, not Trip Budget entity", () => {
    expect(en.tripFormTitleNew).toBe("New budget");
    expect(en.tripFormTitleEdit).toBe("Edit budget");
    expect(en.enterNameAlert).toBe("Please enter a name for your new budget.");
    expect(en.tripNameLabel).toBe("Budget name");
    expect(en.selectCurrencyAlert).toMatch(/budget/i);
    expect(en.selectCurrencyAlert).not.toMatch(/\btrip\b/i);
  });

  it("DE/FR/RU form titles name Budget / budget / бюджет", () => {
    expect(de.tripFormTitleNew).toMatch(/Budget/i);
    expect(de.enterNameAlert).toMatch(/Budget/i);
    expect(de.tripFormTitleNew).not.toMatch(/\bReise\b/);

    expect(fr.tripFormTitleNew).toMatch(/budget/i);
    expect(fr.enterNameAlert).toMatch(/budget/i);
    expect(fr.tripFormTitleNew).not.toMatch(/\bvoyage\b/i);

    expect(ru.tripFormTitleNew).toMatch(/бюджет/i);
    expect(ru.enterNameAlert).toMatch(/бюджет/i);
    expect(ru.tripFormTitleNew).not.toMatch(/поездк/i);
  });

  it("trip form alert keys exist in every locale", () => {
    for (const locale of [en, de, fr, ru]) {
      expect(locale.enterNameAlert).toBeTruthy();
      expect(locale.tripFormTitleNew).toBeTruthy();
      expect(locale.tripFormTitleEdit).toBeTruthy();
    }
  });
});
