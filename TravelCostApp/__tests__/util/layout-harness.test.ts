import { Dimensions } from "react-native";

import { compareLayoutToLegacyScaling } from "../../util/layout-harness";
import { layoutFor } from "../../util/layout";
import { dynamicScale } from "../../util/scalingUtil";

describe("layout harness", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows fixed layout spacing stays below legacy tablet-inflated gaps on wide iPad", () => {
    jest.spyOn(Dimensions, "get").mockReturnValue({
      width: 1024,
      height: 768,
      scale: 2,
      fontScale: 2,
    });

    const comparison = compareLayoutToLegacyScaling({ width: 1024, height: 768 });

    expect(comparison.layoutSpacing).toBe(24);
    expect(comparison.layoutSpacing).toBeLessThan(comparison.legacySpacing);
  });

  it("documents breakpoint spacing and typography without using tabletScaleMult for gaps", () => {
    const wide = layoutFor({ width: 1024, height: 768 });

    expect(wide.space(4)).toBe(24);
    expect(wide.type(20)).toBe(24);
    expect(wide.space(4)).not.toBe(dynamicScale(20, true));
  });
});
