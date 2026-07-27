import { getMMKVString, setMMKVString } from "../store/mmkv";
import { MMKV_KEY_PATTERNS } from "../store/mmkv-keys";

export type NamingBannerVisibilityInput = {
  isImplicitDefault: boolean;
  isDismissed: boolean;
};

/** Naming banner only for undismissed implicit default Active trips. */
export function shouldShowNamingBanner(
  input: NamingBannerVisibilityInput
): boolean {
  return input.isImplicitDefault === true && input.isDismissed !== true;
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
