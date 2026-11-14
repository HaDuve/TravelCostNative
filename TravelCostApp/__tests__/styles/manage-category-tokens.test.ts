import { GlobalStyles } from "../../constants/styles";
import { ManageCategoryTokens } from "../../styles/manage-category-tokens";

function relativeLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const channels = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  const [r, g, b] = channels.map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(foreground: string, background: string): number {
  const L1 = relativeLuminance(foreground);
  const L2 = relativeLuminance(background);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("ManageCategoryTokens", () => {
  it("uses theme tokens for Add button text with ≥4.5:1 contrast", () => {
    expect(ManageCategoryTokens.addButtonBackground).toBe(
      GlobalStyles.colors.primary700
    );
    expect(ManageCategoryTokens.addButtonText).toBe("#FFFFFF");
    expect(
      contrastRatio(
        ManageCategoryTokens.addButtonText,
        ManageCategoryTokens.addButtonBackground
      )
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("uses a theme token for the back control with ≥3:1 UI contrast", () => {
    expect(ManageCategoryTokens.backControl).toBe(
      GlobalStyles.colors.textColor
    );
    expect(
      contrastRatio(
        ManageCategoryTokens.backControl,
        GlobalStyles.colors.backgroundColor
      )
    ).toBeGreaterThanOrEqual(3);
  });
});
