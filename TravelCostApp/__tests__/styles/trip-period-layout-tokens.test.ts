import { Dimensions } from "react-native";

import { layoutFor } from "../../util/layout";
import { dynamicScale } from "../../util/scalingUtil";
import { tripPeriodLayoutTokens } from "../../styles/trip-period-layout-tokens";

describe("trip-period-layout-tokens", () => {
  const phoneViewport = { width: 390, height: 844 };

  beforeEach(() => {
    jest.spyOn(Dimensions, "get").mockReturnValue({
      width: phoneViewport.width,
      height: phoneViewport.height,
      scale: 3,
      fontScale: 1,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("preserves narrow-phone period chrome sizes from the legacy dynamicScale baseline", () => {
    const layout = layoutFor(phoneViewport);
    const tokens = tripPeriodLayoutTokens(layout);

    expect(tokens.headerCard.minHeight).toBe(dynamicScale(52, true));
    expect(tokens.headerCard.paddingVertical).toBe(dynamicScale(4, true));
    expect(tokens.dropdownContainer.marginTop).toBe(dynamicScale(2, true));
    expect(tokens.periodHeaderRow.gap).toBe(dynamicScale(12, true));
    expect(tokens.periodHeaderRow.marginTop).toBe(dynamicScale(18, true));
    expect(tokens.periodHeaderRow.paddingHorizontal).toBe(dynamicScale(12));
    expect(tokens.periodDateHeader.marginTop).toBe(dynamicScale(12, true));
    expect(tokens.periodDateHeader.marginLeft).toBe(dynamicScale(18));
    expect(tokens.periodDateHeader.marginBottom).toBe(dynamicScale(-4, true));
    expect(tokens.periodHeaderLabelFontSize).toBe(dynamicScale(28, false, 0.5));
  });

  it("uses layout spacing tokens on wide breakpoints", () => {
    const wide = layoutFor({ width: 1024, height: 768 });
    const tokens = tripPeriodLayoutTokens(wide);

    expect(tokens.periodHeaderLabelFontSize).toBe(34);
    expect(tokens.periodHeaderRow.gap).toBe(20);
    expect(tokens.headerCard.minHeight).toBe(40);
  });

  it("uses non-overlapping layout spacing on medium tablet landscape", () => {
    const mediumLandscape = layoutFor({ width: 736, height: 414 });
    const tokens = tripPeriodLayoutTokens(mediumLandscape);

    expect(tokens.periodDateHeader.marginBottom).toBe(mediumLandscape.space(1));
    expect(Number(tokens.periodDateHeader.marginBottom)).toBeGreaterThanOrEqual(0);
    expect(tokens.periodHeaderRow.gap).toBe(mediumLandscape.space(2));
    expect(tokens.dividerBar.marginTop).toBe(mediumLandscape.space(3));
  });
});
