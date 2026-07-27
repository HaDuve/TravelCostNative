import { getMMKVString, setMMKVString } from "../store/mmkv";
import { MMKV_KEY_PATTERNS } from "../store/mmkv-keys";

export type NamingBannerVisibilityInput = {
  isImplicitDefault: boolean;
  isDismissed: boolean;
  /** Trip ledger expense count — first expense hides the banner without waiting for effects. */
  expenseCount?: number;
};

/** Naming banner only for undismissed implicit default Active trips with no expenses yet. */
export function shouldShowNamingBanner(
  input: NamingBannerVisibilityInput
): boolean {
  if (input.isImplicitDefault !== true) return false;
  if (input.isDismissed === true) return false;
  if ((input.expenseCount ?? 0) > 0) return false;
  return true;
}

export function isNamingBannerDismissed(tripid: string): boolean {
  if (!tripid) return false;
  return getMMKVString(MMKV_KEY_PATTERNS.NAMING_BANNER_DISMISSED(tripid)) === "1";
}

/** Permanent dismiss (Later or after first expense). */
export function dismissNamingBanner(tripid: string): void {
  if (!tripid) return;
  setMMKVString(MMKV_KEY_PATTERNS.NAMING_BANNER_DISMISSED(tripid), "1");
}

/**
 * First expense on an implicit default trip permanently dismisses the naming banner.
 * Safe to call repeatedly.
 */
export function dismissNamingBannerAfterFirstExpense(
  tripid: string,
  expenseCount: number,
  isImplicitDefault: boolean
): void {
  if (!isImplicitDefault || !tripid) return;
  if (expenseCount < 1) return;
  dismissNamingBanner(tripid);
}
