import { GlobalStyles } from "../constants/styles";

/**
 * Contrast-safe colors for Manage categories add form controls.
 * Add button text ≥4.5:1; back control ≥3:1 against page background.
 */
export const ManageCategoryTokens = {
  addButtonBackground: GlobalStyles.colors.primary700,
  addButtonText: "#FFFFFF",
  backControl: GlobalStyles.colors.textColor,
} as const;
