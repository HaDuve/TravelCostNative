import { de, en, fr, ru } from "../../i18n/supportedLanguages";

const KEYS = [
  "splitHistoryButton",
  "splitHistoryTitle",
  "splitHistoryEmpty",
  "splitHistoryLoadMore",
  "splitHistoryLoadError",
  "splitHistoryAdded",
  "splitHistoryEdited",
  "splitHistoryDeleted",
  "splitHistoryUndone",
  "splitHistoryPaidBack",
  "splitHistorySettlement",
  "splitHistoryBy",
];

describe("split history copy", () => {
  it.each([
    ["en", en],
    ["de", de],
    ["fr", fr],
    ["ru", ru],
  ])("%s has every change history string", (_name, locale) => {
    for (const key of KEYS) {
      expect((locale as Record<string, string>)[key]).toBeTruthy();
    }
  });

  it("EN and DE say Nomad, never Traveller", () => {
    const copy = (l: Record<string, string>) => KEYS.map((k) => l[k]).join("\n");
    expect(copy(en)).not.toMatch(/traveller/i);
    expect(copy(de)).not.toMatch(/traveller|reisende/i);
    expect(en.splitHistoryEmpty).toMatch(/nomads/);
    expect(de.splitHistoryEmpty).toMatch(/Nomaden/);
  });

  it("names Paid back and Settlement like the rest of the Split Summary", () => {
    expect(en.splitHistoryPaidBack).toBe("Paid back");
    expect(en.splitHistorySettlement).toBe("Settlement");
  });
});
