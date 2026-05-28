import { de, en, fr, ru } from "../../i18n/supportedLanguages";

/** Split Summary / balance glossary copy (issue #222). */
const splitSummaryTouchpoints = (locale: Record<string, string>) =>
  [
    locale.simplifySplits,
    locale.settleSplits,
    locale.balanceSimplificationHelper,
    locale.settlementHelper,
    locale.simplifySplitsLabel,
    locale.calcOpenSplits,
    locale.noOpenSplits,
    locale.noOpenSplitsAllSettled,
    locale.noSplitsToSimplify,
    locale.couldNotSimplifySplits,
    locale.sureSettleSplitsFullMessage,
    locale.tripSettledAllExpensesPaid,
    locale.toastSettleFailedMessage,
    locale.toastSettleSuccessTitle,
    locale.toastSettleSuccessMessage,
  ]
    .filter(Boolean)
    .join("\n");

describe("split summary i18n (issue #222)", () => {
  describe("English", () => {
    it("button labels distinguish Balance simplification from Settlement", () => {
      expect(en.simplifySplits).toBe("Simplify splits");
      expect(en.settleSplits).toBe("Settle splits");
    });

    it("helper copy clarifies no money moved vs paid back", () => {
      expect(en.balanceSimplificationHelper).toMatch(/no money has moved/i);
      expect(en.settlementHelper).toMatch(/paid back/i);
    });

    it("balance touchpoints avoid open splits wording", () => {
      const copy = splitSummaryTouchpoints(en);
      expect(copy).not.toMatch(/open splits/i);
      expect(copy).not.toMatch(/simplify splits\?/i);
      expect(copy).toMatch(/balance/i);
      expect(copy).toMatch(/paid back/i);
    });
  });

  describe("German", () => {
    it("helper copy clarifies no money moved vs paid back", () => {
      expect(de.balanceSimplificationHelper).toMatch(/kein Geld bewegt/i);
      expect(de.settlementHelper).toMatch(/zurückbekommen/i);
    });

    it("balance touchpoints avoid Aufteilung open-split phrasing", () => {
      const copy = splitSummaryTouchpoints(de);
      expect(copy).not.toMatch(/offene Aufteilung/i);
      expect(copy).not.toMatch(/Aufteilungen vereinfachen/i);
      expect(copy).toMatch(/Salden/i);
    });
  });

  describe("French", () => {
    it("helper copy clarifies no money moved vs paid back", () => {
      expect(fr.balanceSimplificationHelper).toMatch(
        /n'a encore bougé|aucun argent/i
      );
      expect(fr.settlementHelper).toMatch(/remboursé/i);
    });

    it("balance touchpoints avoid open partage / dépense ouverte phrasing", () => {
      const copy = splitSummaryTouchpoints(fr);
      expect(copy).not.toMatch(/dépense ouverte/i);
      expect(copy).not.toMatch(/partages ouverts/i);
      expect(copy).toMatch(/soldes/i);
    });
  });

  describe("Russian", () => {
    it("helper copy clarifies no money moved vs paid back", () => {
      expect(ru.balanceSimplificationHelper).toMatch(/не переводились/i);
      expect(ru.settlementHelper).toMatch(/вернули деньги/i);
    });

    it("balance touchpoints avoid open раздел phrasing", () => {
      const copy = splitSummaryTouchpoints(ru);
      expect(copy).not.toMatch(/открыт\w* раздел/i);
      expect(copy).toMatch(/баланс/i);
    });
  });

  it("helper keys exist in every locale", () => {
    for (const locale of [en, de, fr, ru]) {
      expect(locale.balanceSimplificationHelper).toBeTruthy();
      expect(locale.settlementHelper).toBeTruthy();
    }
  });
});
