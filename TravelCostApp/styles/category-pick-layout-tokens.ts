import type { LayoutProfile } from "../util/layout";
import { categoryPickTileMinHeight } from "../util/category-pick";
import { ActionRowTokens } from "./action-row-tokens";

/** Layout tokens for CategoryPickScreen — spacing/type from #387 layout module. */
export function categoryPickLayoutTokens(
  layout: LayoutProfile,
  fontScale: number
) {
  return {
    headerPaddingHorizontal: layout.space(2),
    headerPaddingBottom: layout.space(1),
    headerGap: layout.space(1),
    headerSafeAreaFloor: layout.space(1),
    editButtonPaddingHorizontal: layout.space(1),
    listPaddingHorizontal: layout.space(2),
    listPaddingBottom: layout.space(1),
    bottomBarPaddingHorizontal: layout.space(2),
    bottomBarPaddingTop: layout.space(1),
    bottomBarSafeAreaFloor: layout.space(2),
    tileMargin: layout.space(1),
    tilePaddingHorizontal: layout.space(1) / 2,
    tileLabelMarginTop: layout.space(1) / 2,
    tileMinHeight: categoryPickTileMinHeight(layout, fontScale),
    /** Shared interactive-surface radius (ActionRow), not a one-off 12. */
    tileBorderRadius: ActionRowTokens.borderRadius,
    titleFontSize: layout.type(18),
    editFontSize: layout.type(16),
    labelFontSize: layout.type(16),
  };
}

export type CategoryPickLayoutTokens = ReturnType<
  typeof categoryPickLayoutTokens
>;
