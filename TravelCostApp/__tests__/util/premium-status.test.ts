import { buildPremiumStatusViewModel, formatPremiumDate } from "../../util/premium-status";

describe("premium status view model", () => {
  it("formats member since and renewal dates for renewing subscriptions", () => {
    const model = buildPremiumStatusViewModel({
      originalPurchaseDate: "2026-02-01T12:00:00.000Z",
      managementURL: "https://apps.apple.com/account/subscriptions",
      entitlements: {
        active: {
          Premium: {
            isActive: true,
            originalPurchaseDate: "2026-02-01T12:00:00.000Z",
            expirationDate: "2027-02-01T12:00:00.000Z",
            store: "APP_STORE",
          },
        },
      },
    } as any);

    expect(model.isPremium).toBe(true);
    expect(model.memberSinceLabel).toBe(
      formatPremiumDate("2026-02-01T12:00:00.000Z")
    );
    expect(model.renewalLabel).toBe(
      formatPremiumDate("2027-02-01T12:00:00.000Z")
    );
    expect(model.renewalNeverExpires).toBe(false);
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
            originalPurchaseDate: "2026-02-01T12:00:00.000Z",
            expirationDate: null,
            store: "APP_STORE",
          },
        },
      },
    } as any);

    expect(model.renewalNeverExpires).toBe(true);
    expect(model.renewalLabel).toBeNull();
  });
});
