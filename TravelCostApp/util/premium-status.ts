import { DateTime } from "luxon";
import type { CustomerInfo } from "react-native-purchases";

export const PREMIUM_ENTITLEMENT_ID = "Premium";

export const PREMIUM_STATUS_FEATURE_KEYS = [
  "paywallHintUnlimitedExpenses",
  "paywallHintCustomCategories",
  "paywallHintDebtSettlements",
  "paywallHintGptDeal",
] as const;

export type PremiumStatusFeatureKey = (typeof PREMIUM_STATUS_FEATURE_KEYS)[number];

export type PremiumStatusViewModel = {
  isPremium: boolean;
  memberSinceLabel: string | null;
  renewalLabel: string | null;
  renewalNeverExpires: boolean;
  managementURL: string | null;
  storeLabel: string | null;
};

export function formatPremiumDate(isoDate?: string | null): string | null {
  if (!isoDate) return null;
  const parsed = DateTime.fromISO(isoDate);
  if (!parsed.isValid) return null;
  return parsed.toLocaleString(DateTime.DATE_MED);
}

export function buildPremiumStatusViewModel(
  customerInfo: CustomerInfo | null,
  entitlementId = PREMIUM_ENTITLEMENT_ID
): PremiumStatusViewModel {
  const entitlement = customerInfo?.entitlements?.active?.[entitlementId];
  const isPremium = Boolean(entitlement?.isActive);

  const memberSinceLabel = formatPremiumDate(
    entitlement?.originalPurchaseDate ?? customerInfo?.originalPurchaseDate
  );

  const expirationDate = entitlement?.expirationDate;
  const renewalNeverExpires = isPremium && !expirationDate;
  const renewalLabel = renewalNeverExpires
    ? null
    : formatPremiumDate(expirationDate);

  return {
    isPremium,
    memberSinceLabel,
    renewalLabel,
    renewalNeverExpires,
    managementURL: customerInfo?.managementURL ?? null,
    storeLabel: entitlement?.store ?? null,
  };
}
