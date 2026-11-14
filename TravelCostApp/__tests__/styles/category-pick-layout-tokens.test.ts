import { categoryPickLayoutTokens } from "../../styles/category-pick-layout-tokens";
import { ActionRowTokens } from "../../styles/action-row-tokens";
import { layoutFor } from "../../util/layout";
import { categoryPickTileMinHeight } from "../../util/category-pick";

describe("categoryPickLayoutTokens", () => {
  const layout = layoutFor({ width: 390, height: 844 });

  it("uses layout space/type tokens for padding, gaps, and type sizes", () => {
    const tokens = categoryPickLayoutTokens(layout, 1);

    expect(tokens.headerPaddingHorizontal).toBe(layout.space(2));
    expect(tokens.headerGap).toBe(layout.space(1));
    expect(tokens.tileMargin).toBe(layout.space(1));
    expect(tokens.listPaddingHorizontal).toBe(layout.space(2));
    expect(tokens.bottomBarPaddingTop).toBe(layout.space(1));
    expect(tokens.titleFontSize).toBe(layout.type(18));
    expect(tokens.labelFontSize).toBe(layout.type(16));
    expect(tokens.editFontSize).toBe(layout.type(16));
  });

  it("reuses ActionRow border radius instead of a hardcoded 12", () => {
    const tokens = categoryPickLayoutTokens(layout, 1);
    expect(tokens.tileBorderRadius).toBe(ActionRowTokens.borderRadius);
    expect(tokens.tileBorderRadius).not.toBe(12);
  });

  it("grows tile minHeight with fontScale", () => {
    const normal = categoryPickLayoutTokens(layout, 1);
    const large = categoryPickLayoutTokens(layout, 2);
    expect(normal.tileMinHeight).toBe(categoryPickTileMinHeight(layout, 1));
    expect(large.tileMinHeight).toBe(categoryPickTileMinHeight(layout, 2));
    expect(large.tileMinHeight).toBeGreaterThan(normal.tileMinHeight);
  });
});
