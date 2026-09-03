import { DateTime } from "luxon";
import type { CustomerInfo } from "react-native-purchases";

import { ENTITLEMENT_ID } from "../components/Premium/PremiumConstants";

export const PREMIUM_STATUS_FEATURE_KEYS = [
  "paywallHintUnlimitedExpenses",
  "paywallHintCustomCategories",
  "paywallHintDebtSettlements",
  "paywallHintAdvancedCharts",
  "paywallHintExpenseSearch",
  "paywallHintGptDeal",
] as const;

export type PremiumStatusFeatureKey =
  (typeof PREMIUM_STATUS_FEATURE_KEYS)[number];

export type PremiumPeriodKind = "lifetime" | "renewing" | "expiring";

export type PremiumStatusViewModel = {
  isPremium: boolean;
  memberSinceLabel: string | null;
  periodKind: PremiumPeriodKind | null;
  periodDateLabel: string | null;
  managementURL: string | null;
};

export function formatPremiumDate(isoDate?: string | null): string | null {
  if (!isoDate) return null;
  const parsed = DateTime.fromISO(isoDate);
  if (!parsed.isValid) return null;
  return parsed.toLocaleString(DateTime.DATE_MED);
}

function periodFromEntitlement(entitlement: {
  willRenew?: boolean;
  expirationDate?: string | null;
}): { kind: PremiumPeriodKind; dateLabel: string | null } {
  const expirationDate = entitlement.expirationDate;
  if (!expirationDate) {
    return { kind: "lifetime", dateLabel: null };
  }
  const dateLabel = formatPremiumDate(expirationDate);
  if (entitlement.willRenew === false) {
    return { kind: "expiring", dateLabel };
  }
  return { kind: "renewing", dateLabel };
}

export function buildPremiumStatusViewModel(
  customerInfo: CustomerInfo | null,
  entitlementId = ENTITLEMENT_ID
): PremiumStatusViewModel {
  const entitlement = customerInfo?.entitlements?.active?.[entitlementId];
  const isPremium = Boolean(entitlement?.isActive);

  if (!isPremium || !entitlement) {
    return {
      isPremium: false,
      memberSinceLabel: null,
      periodKind: null,
      periodDateLabel: null,
      managementURL: customerInfo?.managementURL ?? null,
    };
  }

  const memberSinceLabel = formatPremiumDate(
    entitlement.originalPurchaseDate ?? customerInfo?.originalPurchaseDate
  );
  const period = periodFromEntitlement(entitlement);

  return {
    isPremium: true,
    memberSinceLabel,
    periodKind: period.kind,
    periodDateLabel: period.dateLabel,
    managementURL: customerInfo?.managementURL ?? null,
  };
}
