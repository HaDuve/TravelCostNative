import type { LayoutProfile } from "./layout";

/** Sentinel category for Skip category — same value as the old Continue path. */
export const SKIP_CATEGORY_VALUE = "undefined";

export type CategoryPickSelectionResult =
  | {
      action: "navigateManageExpense";
      pickedCat: string;
      iconName?: string;
    }
  | {
      action: "goBack";
      expenseId: string;
      category: string;
    };

/** Adaptive grid columns from layout breakpoints: narrow 3 / medium 4 / wide 5. */
export function categoryPickColumnCount(layout: LayoutProfile): number {
  if (layout.breakpoint === "wide") return 5;
  if (layout.breakpoint === "medium") return 4;
  return 3;
}

/**
 * Shared category tile minHeight. Grows with Dynamic Type so icon + 2-line
 * labels are not clipped at largest system text.
 */
export function categoryPickTileMinHeight(
  layout: LayoutProfile,
  fontScale: number
): number {
  const base = layout.space(7) * 2 + layout.space(3);
  return Math.round(base * Math.max(fontScale, 1));
}

export function categoryPickSelectionResult(options: {
  expenseId?: string;
  category: string;
  iconName?: string;
}): CategoryPickSelectionResult {
  const { expenseId, category, iconName } = options;

  if (expenseId) {
    return { action: "goBack", expenseId, category };
  }

  if (iconName) {
    return {
      action: "navigateManageExpense",
      pickedCat: category,
      iconName,
    };
  }

  return {
    action: "navigateManageExpense",
    pickedCat: category,
  };
}

export function isCategoryTileSelected(
  tileCategory: string | undefined,
  selectedCategory: string | undefined | null
): boolean {
  if (!tileCategory || !selectedCategory) return false;
  if (tileCategory === "newCat") return false;
  return tileCategory === selectedCategory;
}

export function shouldShowCategoryPickSpinner(options: {
  isLoading: boolean;
  hasCachedList: boolean;
}): boolean {
  return options.isLoading && !options.hasCachedList;
}
