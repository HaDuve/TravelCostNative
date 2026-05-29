import { de, en, fr, ru } from "../../i18n/supportedLanguages";

/** Wording that treats the trip container as a "trip budget" entity (CONTEXT.md avoid). */
const tripBudgetAsContainerEn = /trip budget/i;
const tripBudgetAsContainerFr = /budget de voyage/i;
const tripBudgetAsContainerRu = /бюджет\w* поездк/i;

describe("trip form i18n (issue #223)", () => {
  describe("English", () => {
    it("enterNameAlert asks for a trip name, not a Trip Budget name", () => {
      expect(en.enterNameAlert).toMatch(/trip/i);
      expect(en.enterNameAlert).not.toMatch(tripBudgetAsContainerEn);
    });

    it("keeps Trip Budget only as form screen title (intentional)", () => {
      expect(en.tripFormTitleNew).toBe("New Trip Budget");
      expect(en.tripFormTitleEdit).toBe("Edit Trip Budget");
    });

    it("walkthrough onboarding refers to a trip, not a trip budget container", () => {
      expect(en.walk5).toMatch(/new trip/i);
      expect(en.walk5).not.toMatch(tripBudgetAsContainerEn);
    });
  });

  describe("German (reference)", () => {
    it("enterNameAlert names the Reise, not a budget container", () => {
      expect(de.enterNameAlert).toMatch(/Reise/i);
      expect(de.enterNameAlert).not.toMatch(/Budget/i);
    });

    it("form titles refer to Reise, not budget-as-container", () => {
      expect(de.tripFormTitleNew).toMatch(/Reise/i);
      expect(de.tripFormTitleEdit).toMatch(/Reise/i);
      expect(de.tripFormTitleNew).not.toMatch(/Budget/i);
    });
  });

  describe("French", () => {
    it("enterNameAlert names the voyage, not budget de voyage as the container", () => {
      expect(fr.enterNameAlert).toMatch(/voyage/i);
      expect(fr.enterNameAlert).not.toMatch(tripBudgetAsContainerFr);
    });

    it("form titles refer to voyage, not budget de voyage as the container", () => {
      expect(fr.tripFormTitleNew).toMatch(/voyage/i);
      expect(fr.tripFormTitleEdit).toMatch(/voyage/i);
      expect(fr.tripFormTitleNew).not.toMatch(tripBudgetAsContainerFr);
    });
  });

  describe("Russian", () => {
    it("enterNameAlert names the поездка, not бюджет поездки as the container", () => {
      expect(ru.enterNameAlert).toMatch(/поездк/i);
      expect(ru.enterNameAlert).not.toMatch(tripBudgetAsContainerRu);
    });

    it("form titles refer to поездка, not бюджет as the container noun", () => {
      expect(ru.tripFormTitleNew).toMatch(/поездк/i);
      expect(ru.tripFormTitleEdit).toMatch(/поездк/i);
      expect(ru.tripFormTitleNew).not.toMatch(/^Бюджет /);
    });

    it("selectCurrencyAlert refers to this trip, not trip budget entity", () => {
      expect(ru.selectCurrencyAlert).toMatch(/поездк/i);
      expect(ru.selectCurrencyAlert).not.toMatch(tripBudgetAsContainerRu);
    });
  });

  it("trip form alert keys exist in every locale", () => {
    for (const locale of [en, de, fr, ru]) {
      expect(locale.enterNameAlert).toBeTruthy();
      expect(locale.tripFormTitleNew).toBeTruthy();
      expect(locale.tripFormTitleEdit).toBeTruthy();
    }
  });
});
