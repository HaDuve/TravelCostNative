import { dynamicScale } from "../util/scalingUtil";

/** Compact profile top bar: icon row height is iconSize + small vertical padding only. */
export const ProfileToolbarTokens = {
  iconSize: dynamicScale(24, false, 0.5),
  paddingVertical: dynamicScale(4, true),
  paddingHorizontal: dynamicScale(8, false, 0.5),
  iconHitPadding: dynamicScale(4, false, 0.5),
  contentHeight:
    dynamicScale(24, false, 0.5) + 2 * dynamicScale(4, false, 0.5),
  /** Painted toolbar strip below the safe area (icon row + bottom padding). */
  chromeHeight:
    dynamicScale(24, false, 0.5) +
    2 * dynamicScale(4, false, 0.5) +
    dynamicScale(4, true),
} as const;
