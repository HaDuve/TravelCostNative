import { Platform } from "react-native";

import { GlobalStyles } from "../constants/styles";
import { dynamicScale } from "../util/scalingUtil";

/**
 * Locked ActionRow design tokens (variant C — accent strip).
 * Do not tweak per screen; change here only after design review.
 */
export const ActionRowTokens = {
  surface: "#FFFFFF",
  borderColor: GlobalStyles.colors.gray300,
  borderWidth: 1,
  borderRadius: 16,
  padding: dynamicScale(14),
  marginBottom: dynamicScale(10, true),
  accentStripWidth: dynamicScale(5),
  primaryTint: GlobalStyles.colors.primary50,
  iconSize: dynamicScale(20, false, 0.5),
  imageIconSize: dynamicScale(20, false, 0.5),
  labelFontSize: dynamicScale(16, false, 0.5),
  hintFontSize: dynamicScale(12, false, 0.5),
  chevronFontSize: dynamicScale(22, false, 0.5),
  gradients: {
    primary: GlobalStyles.gradientPrimaryButton,
    promotional: GlobalStyles.gradientColorsButton,
  },
  press: GlobalStyles.pressedActionRow,
  shadow: Platform.select({
    ios: {
      shadowColor: "#002A22",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.16,
      shadowRadius: 3,
    },
    android: {
      elevation: 3,
    },
  }),
} as const;

/** Shell style co-locating background, border, and shadow for ActionRow. */
export const actionRowCardShell = {
  backgroundColor: ActionRowTokens.surface,
  borderRadius: ActionRowTokens.borderRadius,
  borderWidth: ActionRowTokens.borderWidth,
  borderColor: ActionRowTokens.borderColor,
  ...ActionRowTokens.shadow,
};
