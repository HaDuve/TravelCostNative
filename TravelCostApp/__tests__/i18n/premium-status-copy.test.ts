import { de, en, fr, ru } from "../../i18n/supportedLanguages";

jest.mock("../../components/Premium/PremiumConstants", () => ({
  ENTITLEMENT_ID: "Premium",
}));

import { PREMIUM_STATUS_FEATURE_KEYS } from "../../util/premium-status";

const PREMIUM_STATUS_COPY_KEYS = [
  "premiumStatusTitle",
  "premiumStatusSubtitle",
  "premiumStatusPersonalNote",
  "premiumStatusPersonalSignature",
  "premiumStatusFeaturesTitle",
  "premiumStatusMemberSince",
  "premiumStatusRenewsOn",
  "premiumStatusExpiresOn",
  "premiumStatusNeverExpires",
  "premiumStatusManageSubscription",
  "premiumStatusManageHint",
  "premiumStatusLoadError",
  ...PREMIUM_STATUS_FEATURE_KEYS,
] as const;

describe("premium status i18n", () => {
  it("ships EN+DE+FR+RU copy for every premium status key", () => {
    for (const locale of [en, de, fr, ru]) {
      for (const key of PREMIUM_STATUS_COPY_KEYS) {
        expect(locale[key]).toBeTruthy();
      }
    }
  });

  it("English personal note is signed by Hannes", () => {
    expect(en.premiumStatusPersonalSignature).toBe("Hannes");
    expect(en.premiumStatusPersonalNote).toMatch(/Hannes/i);
  });
});
