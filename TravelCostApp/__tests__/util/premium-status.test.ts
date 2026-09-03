import { Settings } from "luxon";

jest.mock("../../components/Premium/PremiumConstants", () => ({
  ENTITLEMENT_ID: "Premium",
}));

import { buildPremiumStatusViewModel } from "../../util/premium-status";

describe("premium status view model", () => {
  beforeEach(() => {
    Settings.defaultLocale = "en";
  });

  it("formats member since and renewal dates for renewing subscriptions", () => {
    const model = buildPremiumStatusViewModel({
      originalPurchaseDate: "2026-02-01T12:00:00.000Z",
      managementURL: "https://apps.apple.com/account/subscriptions",
      entitlements: {
        active: {
          Premium: {
            isActive: true,
            willRenew: true,
            originalPurchaseDate: "2026-02-01T12:00:00.000Z",
            expirationDate: "2027-02-01T12:00:00.000Z",
          },
        },
      },
    } as never);

    expect(model.isPremium).toBe(true);
    expect(model.memberSinceLabel).toBe("Feb 1, 2026");
    expect(model.periodKind).toBe("renewing");
    expect(model.periodDateLabel).toBe("Feb 1, 2027");
    expect(model.managementURL).toBe(
      "https://apps.apple.com/account/subscriptions"
    );
  });

  it("marks lifetime premium as never expiring", () => {
    const model = buildPremiumStatusViewModel({
      entitlements: {
        active: {
          Premium: {
            isActive: true,
            willRenew: false,
            originalPurchaseDate: "2026-02-01T12:00:00.000Z",
            expirationDate: null,
          },
        },
      },
    } as never);

    expect(model.periodKind).toBe("lifetime");
    expect(model.periodDateLabel).toBeNull();
  });

  it("treats a cancelled remaining period as expiring, not renewing", () => {
    const model = buildPremiumStatusViewModel({
      entitlements: {
        active: {
          Premium: {
            isActive: true,
            willRenew: false,
            originalPurchaseDate: "2026-02-01T12:00:00.000Z",
            expirationDate: "2027-02-01T12:00:00.000Z",
          },
        },
      },
    } as never);

    expect(model.periodKind).toBe("expiring");
    expect(model.periodDateLabel).toBe("Feb 1, 2027");
  });

  it("is not premium when customer info is missing", () => {
    const model = buildPremiumStatusViewModel(null);
    expect(model.isPremium).toBe(false);
    expect(model.periodKind).toBeNull();
  });
});
