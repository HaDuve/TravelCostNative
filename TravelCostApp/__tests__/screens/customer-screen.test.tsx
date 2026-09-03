import * as React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";

const mockGetCustomerInfo = jest.fn();

jest.mock("react-native-purchases", () => ({
  __esModule: true,
  default: {
    getCustomerInfo: (...args: unknown[]) => mockGetCustomerInfo(...args),
  },
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

import CustomerScreen from "../../screens/CustomerScreen";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { en } from "../../i18n/supportedLanguages";
import { formatPremiumDate } from "../../util/premium-status";

function premiumCustomerInfo(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    requestDate: "2026-03-01T12:00:00.000Z",
    originalAppUserId: "user_1",
    firstSeen: "2026-01-01T12:00:00.000Z",
    originalApplicationVersion: "1.0.0",
    originalPurchaseDate: "2026-02-01T12:00:00.000Z",
    managementURL: "https://apps.apple.com/account/subscriptions",
    allPurchasedProductIdentifiers: ["premium_yearly"],
    activeSubscriptions: ["premium_yearly"],
    entitlements: {
      active: {
        Premium: {
          identifier: "Premium",
          productIdentifier: "premium_yearly",
          isActive: true,
          willRenew: true,
          periodType: "NORMAL",
          latestPurchaseDate: "2026-02-01T12:00:00.000Z",
          originalPurchaseDate: "2026-02-01T12:00:00.000Z",
          expirationDate: "2027-02-01T12:00:00.000Z",
          store: "APP_STORE",
          isSandbox: false,
          unsubscribeDetectedAt: null,
          billingIssueDetectedAt: null,
        },
      },
    },
    ...overrides,
  };
}

describe("Customer screen (premium status)", () => {
  beforeEach(() => {
    mockGetCustomerInfo.mockReset();
    mockGetCustomerInfo.mockResolvedValue(premiumCustomerInfo());
    jest.spyOn(Linking, "openURL").mockImplementation(async () => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows a celebratory Premium Nomad headline after status loads", async () => {
    const screen = renderWithAppProviders(<CustomerScreen />);

    await waitFor(() => {
      expect(screen.getByText(en.premiumStatusTitle)).toBeTruthy();
    });
  });

  it("shows premium perks, membership dates, and Hannes personal note", async () => {
    const screen = renderWithAppProviders(<CustomerScreen />);

    await waitFor(() => {
      expect(screen.getByText(en.premiumStatusFeaturesTitle)).toBeTruthy();
    });

    expect(screen.getByText(en.paywallHintUnlimitedExpenses)).toBeTruthy();
    expect(screen.getByText(en.paywallHintCustomCategories)).toBeTruthy();
    expect(screen.getByText(en.paywallHintDebtSettlements)).toBeTruthy();
    expect(screen.getByText(en.paywallHintGptDeal)).toBeTruthy();
    expect(screen.getByText(en.premiumStatusMemberSince)).toBeTruthy();
    expect(
      screen.getByText(formatPremiumDate("2026-02-01T12:00:00.000Z")!)
    ).toBeTruthy();
    expect(screen.getByText(en.premiumStatusRenewsOn)).toBeTruthy();
    expect(
      screen.getByText(formatPremiumDate("2027-02-01T12:00:00.000Z")!)
    ).toBeTruthy();
    expect(screen.getByText(en.premiumStatusPersonalNote)).toBeTruthy();
    expect(screen.getByText(`— ${en.premiumStatusPersonalSignature}`)).toBeTruthy();
  });

  it("shows never expires for lifetime premium", async () => {
    const base = premiumCustomerInfo();
    mockGetCustomerInfo.mockResolvedValue({
      ...base,
      entitlements: {
        active: {
          Premium: {
            ...(base.entitlements as { active: { Premium: Record<string, unknown> } })
              .active.Premium,
            expirationDate: null,
          },
        },
      },
    });

    const screen = renderWithAppProviders(<CustomerScreen />);

    await waitFor(() => {
      expect(screen.getByText(en.premiumStatusNeverExpires)).toBeTruthy();
    });
  });

  it("opens the store management URL when manage subscription is pressed", async () => {
    const screen = renderWithAppProviders(<CustomerScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("premium-manage-subscription")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("premium-manage-subscription"));

    expect(Linking.openURL).toHaveBeenCalledWith(
      "https://apps.apple.com/account/subscriptions"
    );
  });
});
