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

/** Adaptive grid columns: ~3 phone, 4 medium tablet, 5 wide tablet. */
export function categoryPickColumnCount(width: number): number {
  if (width >= 768) return 5;
  if (width >= 600) return 4;
  return 3;
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
