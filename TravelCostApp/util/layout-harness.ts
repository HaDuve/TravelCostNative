import type { LayoutViewport } from "./layout";
import { layoutFor } from "./layout";
import { dynamicScale } from "./scalingUtil";

export type LayoutHarnessComparison = {
  viewport: LayoutViewport;
  breakpoint: string;
  orientation: string;
  layoutSpacing: number;
  legacySpacing: number;
  layoutTypography: number;
  legacyTypography: number;
};

export function compareLayoutToLegacyScaling(
  viewport: LayoutViewport
): LayoutHarnessComparison {
  const layout = layoutFor(viewport);

  return {
    viewport,
    breakpoint: layout.breakpoint,
    orientation: layout.orientation,
    layoutSpacing: layout.space(4),
    legacySpacing: dynamicScale(20, true),
    layoutTypography: layout.type(20),
    legacyTypography: dynamicScale(20, false, 0.5),
  };
}
