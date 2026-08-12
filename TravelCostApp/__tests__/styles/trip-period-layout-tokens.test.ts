import { layoutFor } from "../../util/layout";
import { tripPeriodLayoutTokens } from "../../styles/trip-period-layout-tokens";

describe("trip-period-layout-tokens", () => {
  it("builds period header spacing from fixed layout tokens instead of dynamicScale", () => {
    const layout = layoutFor({ width: 390, height: 844 });
    const tokens = tripPeriodLayoutTokens(layout);

    expect(tokens.periodHeaderRow.gap).toBe(16);
    expect(tokens.periodHeaderRow.paddingHorizontal).toBe(16);
    expect(tokens.periodHeaderLabelFontSize).toBe(28);
  });

  it("uses layout type scale for period header label typography only", () => {
    const wide = layoutFor({ width: 1024, height: 768 });
    const tokens = tripPeriodLayoutTokens(wide);

    expect(tokens.periodHeaderLabelFontSize).toBe(34);
    expect(tokens.periodHeaderRow.gap).toBe(20);
  });
});
