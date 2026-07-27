import { de, en, fr, ru } from "../../i18n/supportedLanguages";

describe("naming banner i18n (issue #355)", () => {
  it("ships EN+DE+FR+RU copy for banner text and Name it", () => {
    for (const locale of [en, de, fr, ru]) {
      expect(locale.namingBannerText).toBeTruthy();
      expect(locale.namingBannerNameIt).toBeTruthy();
      expect(locale.later).toBeTruthy();
      expect(locale.addExp).toBeTruthy();
    }
  });

  it("English matches the PRD naming banner wording", () => {
    expect(en.namingBannerText).toBe(
      "Name your budget to keep things organized."
    );
    expect(en.namingBannerNameIt).toBe("Name it");
  });
});
