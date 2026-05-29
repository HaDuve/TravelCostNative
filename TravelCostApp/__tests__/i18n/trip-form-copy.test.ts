import { de, en, fr, ru } from "../../i18n/supportedLanguages";

/** Wording that treats the trip container as a "trip budget" entity (CONTEXT.md avoid). */
const tripBudgetAsContainerEn = /trip budget/i;
const tripBudgetAsContainerFr = /budget de voyage/i;
/** Cyrillic inflection between бюджет and поездк (\\w does not match Russian suffixes). */
const tripBudgetAsContainerRu = /бюджет.{0,4}поездк/iu;

const walk5Expectations: Array<{
  lang: string;
  locale: Record<string, string>;
  tripPattern: RegExp;
  avoidPattern: RegExp;
}> = [
  {
    lang: "en",
    locale: en,
    tripPattern: /new trip/i,
    avoidPattern: tripBudgetAsContainerEn,
  },
  {
    lang: "de",
    locale: de,
    tripPattern: /neue Reise/i,
    avoidPattern: /budget.*reise/i,
  },
  {
    lang: "fr",
    locale: fr,
    tripPattern: /nouveau voyage/i,
    avoidPattern: tripBudgetAsContainerFr,
  },
  {
    lang: "ru",
    locale: ru,
    tripPattern: /новое путешествие/i,
    avoidPattern: tripBudgetAsContainerRu,
  },
];

describe("trip form i18n (issue #223)", () => {
  describe("tripBudgetAsContainerRu guard", () => {
    it("matches inflected budget+trip phrasing that \\w-based patterns miss", () => {
      expect("бюджета поездки").toMatch(tripBudgetAsContainerRu);
      expect("бюджет поездки").toMatch(tripBudgetAsContainerRu);
    });

    it("does not match acceptable trip-only phrasing", () => {
      expect("для этой поездки").not.toMatch(tripBudgetAsContainerRu);
      expect("Новая поездка").not.toMatch(tripBudgetAsContainerRu);
    });
  });

  describe("English", () => {
    it("enterNameAlert asks for a trip name, not a Trip Budget name", () => {
      expect(en.enterNameAlert).toMatch(/trip/i);
      expect(en.enterNameAlert).not.toMatch(tripBudgetAsContainerEn);
    });

    it("keeps Trip Budget only as form screen title (intentional)", () => {
      expect(en.tripFormTitleNew).toBe("New Trip Budget");
      expect(en.tripFormTitleEdit).toBe("Edit Trip Budget");
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

  describe("walkthrough onboarding (walk5)", () => {
    it.each(walk5Expectations)(
      "$lang walk5 promotes creating a Trip, not a trip-budget container",
      ({ locale, tripPattern, avoidPattern }) => {
        expect(locale.walk5).toMatch(tripPattern);
        expect(locale.walk5).not.toMatch(avoidPattern);
      }
    );
  });

  it("trip form alert keys exist in every locale", () => {
    for (const locale of [en, de, fr, ru]) {
      expect(locale.enterNameAlert).toBeTruthy();
      expect(locale.tripFormTitleNew).toBeTruthy();
      expect(locale.tripFormTitleEdit).toBeTruthy();
      expect(locale.walk5).toBeTruthy();
    }
  });
});
