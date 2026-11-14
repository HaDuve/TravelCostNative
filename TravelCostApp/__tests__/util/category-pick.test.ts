import {
  categoryPickColumnCount,
  categoryPickSelectionResult,
  categoryPickTileMinHeight,
  isCategoryTileSelected,
  SKIP_CATEGORY_VALUE,
  shouldShowCategoryPickSpinner,
} from "../../util/category-pick";
import { layoutFor } from "../../util/layout";

describe("categoryPickColumnCount", () => {
  it("uses 3 columns on narrow layouts", () => {
    expect(categoryPickColumnCount(layoutFor({ width: 320, height: 568 }))).toBe(
      3
    );
    expect(categoryPickColumnCount(layoutFor({ width: 390, height: 844 }))).toBe(
      3
    );
    expect(categoryPickColumnCount(layoutFor({ width: 599, height: 800 }))).toBe(
      3
    );
  });

  it("uses 4 columns on medium layouts", () => {
    expect(categoryPickColumnCount(layoutFor({ width: 600, height: 800 }))).toBe(
      4
    );
    expect(categoryPickColumnCount(layoutFor({ width: 767, height: 900 }))).toBe(
      4
    );
  });

  it("uses 5 columns on wide layouts", () => {
    expect(categoryPickColumnCount(layoutFor({ width: 768, height: 1024 }))).toBe(
      5
    );
    expect(
      categoryPickColumnCount(layoutFor({ width: 1024, height: 768 }))
    ).toBe(5);
  });
});

describe("categoryPickTileMinHeight", () => {
  const layout = layoutFor({ width: 390, height: 844 });

  it("uses a shared base height from layout space tokens at fontScale 1", () => {
    const expected =
      layout.space(7) * 2 + layout.space(3); /* ~112: icon + 2 label lines */
    expect(categoryPickTileMinHeight(layout, 1)).toBe(expected);
  });

  it("grows shared tile height with larger Dynamic Type fontScale", () => {
    const base = categoryPickTileMinHeight(layout, 1);
    const large = categoryPickTileMinHeight(layout, 2);
    expect(large).toBe(base * 2);
    expect(large).toBeGreaterThan(base);
  });
});

describe("categoryPickSelectionResult", () => {
  it("navigates to ManageExpense with the picked category for a new Fast expense", () => {
    expect(
      categoryPickSelectionResult({
        expenseId: undefined,
        category: "food",
        iconName: "fast-food-outline",
      })
    ).toEqual({
      action: "navigateManageExpense",
      pickedCat: "food",
      iconName: "fast-food-outline",
    });
  });

  it("goes back after picking a category while editing an Expense", () => {
    expect(
      categoryPickSelectionResult({
        expenseId: "exp-1",
        category: "food",
        iconName: "fast-food-outline",
      })
    ).toEqual({
      action: "goBack",
      expenseId: "exp-1",
      category: "food",
    });
  });

  it("skips category for a new Fast expense with the same sentinel as Continue", () => {
    expect(
      categoryPickSelectionResult({
        expenseId: undefined,
        category: SKIP_CATEGORY_VALUE,
      })
    ).toEqual({
      action: "navigateManageExpense",
      pickedCat: SKIP_CATEGORY_VALUE,
    });
  });

  it("skips category while editing an Expense and goes back", () => {
    expect(
      categoryPickSelectionResult({
        expenseId: "exp-1",
        category: SKIP_CATEGORY_VALUE,
      })
    ).toEqual({
      action: "goBack",
      expenseId: "exp-1",
      category: SKIP_CATEGORY_VALUE,
    });
  });
});

describe("isCategoryTileSelected", () => {
  it("marks the Expense current category tile as selected", () => {
    expect(isCategoryTileSelected("food", "food")).toBe(true);
    expect(isCategoryTileSelected("other", "food")).toBe(false);
    expect(isCategoryTileSelected("food", undefined)).toBe(false);
    expect(isCategoryTileSelected("newCat", "food")).toBe(false);
  });
});

describe("shouldShowCategoryPickSpinner", () => {
  it("shows a spinner only while loading with an empty cache", () => {
    expect(
      shouldShowCategoryPickSpinner({ isLoading: true, hasCachedList: false })
    ).toBe(true);
    expect(
      shouldShowCategoryPickSpinner({ isLoading: true, hasCachedList: true })
    ).toBe(false);
    expect(
      shouldShowCategoryPickSpinner({ isLoading: false, hasCachedList: false })
    ).toBe(false);
  });
});
