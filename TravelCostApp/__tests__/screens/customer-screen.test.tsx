import * as React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";
import { Settings } from "luxon";

const mockGetCustomerInfo = jest.fn();

jest.mock("react-native-purchases", () => ({
  __esModule: true,
  default: {
    getCustomerInfo: (...args: unknown[]) => mockGetCustomerInfo(...args),
  },
}));

jest.mock("../../components/Premium/PremiumConstants", () => ({
  ENTITLEMENT_ID: "Premium",
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

function premiumEntitlement(overrides: Record<string, unknown> = {}) {
  return {
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
    ...overrides,
  };
}

function premiumCustomerInfo(overrides: Record<string, unknown> = {}) {
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
        Premium: premiumEntitlement(),
      },
    },
    ...overrides,
  };
}

describe("Customer screen (premium status)", () => {
  beforeEach(() => {
    Settings.defaultLocale = "en";
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
    expect(screen.getByText(en.premiumStatusPersonalNote)).toBeTruthy();
  });

  it("shows premium perks, membership dates, and Hannes personal note", async () => {
    const screen = renderWithAppProviders(<CustomerScreen />);

    await waitFor(() => {
      expect(screen.getByText(en.premiumStatusFeaturesTitle)).toBeTruthy();
    });

    expect(screen.getByText(en.paywallHintUnlimitedExpenses)).toBeTruthy();
    expect(screen.getByText(en.paywallHintCustomCategories)).toBeTruthy();
    expect(screen.getByText(en.paywallHintDebtSettlements)).toBeTruthy();
    expect(screen.getByText(en.paywallHintAdvancedCharts)).toBeTruthy();
    expect(screen.getByText(en.paywallHintExpenseSearch)).toBeTruthy();
    expect(screen.getByText(en.paywallHintGptDeal)).toBeTruthy();
    expect(screen.getByText(en.premiumStatusMemberSince)).toBeTruthy();
    expect(screen.getByText("Feb 1, 2026")).toBeTruthy();
    expect(screen.getByText(en.premiumStatusRenewsOn)).toBeTruthy();
    expect(screen.getByText("Feb 1, 2027")).toBeTruthy();
    expect(screen.getByText(`— ${en.premiumStatusPersonalSignature}`)).toBeTruthy();
  });

  it("shows never expires for lifetime premium", async () => {
    mockGetCustomerInfo.mockResolvedValue(
      premiumCustomerInfo({
        entitlements: {
          active: {
            Premium: premiumEntitlement({ expirationDate: null }),
          },
        },
      })
    );

    const screen = renderWithAppProviders(<CustomerScreen />);

    await waitFor(() => {
      expect(screen.getByText(en.premiumStatusNeverExpires)).toBeTruthy();
    });
  });

  it("shows expires on when the subscription will not renew", async () => {
    mockGetCustomerInfo.mockResolvedValue(
      premiumCustomerInfo({
        entitlements: {
          active: {
            Premium: premiumEntitlement({ willRenew: false }),
          },
        },
      })
    );

    const screen = renderWithAppProviders(<CustomerScreen />);

    await waitFor(() => {
      expect(screen.getByText(en.premiumStatusExpiresOn)).toBeTruthy();
    });
    expect(screen.queryByText(en.premiumStatusRenewsOn)).toBeNull();
  });

  it("shows an error instead of celebrating when customer info fails to load", async () => {
    mockGetCustomerInfo.mockRejectedValue(new Error("network"));

    const screen = renderWithAppProviders(<CustomerScreen />);

    await waitFor(() => {
      expect(screen.getByText(en.premiumStatusLoadError)).toBeTruthy();
    });
    expect(screen.queryByText(en.premiumStatusTitle)).toBeNull();
    expect(screen.queryByText(en.premiumStatusPersonalNote)).toBeNull();
  });

  it("does not celebrate when the Premium entitlement is inactive", async () => {
    mockGetCustomerInfo.mockResolvedValue(
      premiumCustomerInfo({
        entitlements: { active: {} },
      })
    );

    const screen = renderWithAppProviders(<CustomerScreen />);

    await waitFor(() => {
      expect(screen.getByText(en.premiumNomadInactive)).toBeTruthy();
    });
    expect(screen.queryByText(en.premiumStatusTitle)).toBeNull();
  });

  it("hides manage subscription when the store URL is missing", async () => {
    mockGetCustomerInfo.mockResolvedValue(
      premiumCustomerInfo({ managementURL: null })
    );

    const screen = renderWithAppProviders(<CustomerScreen />);

    await waitFor(() => {
      expect(screen.getByText(en.premiumStatusTitle)).toBeTruthy();
    });
    expect(screen.queryByTestId("premium-manage-subscription")).toBeNull();
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
