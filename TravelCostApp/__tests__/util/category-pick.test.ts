import {
  categoryPickColumnCount,
  categoryPickSelectionResult,
  isCategoryTileSelected,
  SKIP_CATEGORY_VALUE,
  shouldShowCategoryPickSpinner,
} from "../../util/category-pick";

describe("categoryPickColumnCount", () => {
  it("uses 3 columns on phone widths", () => {
    expect(categoryPickColumnCount(320)).toBe(3);
    expect(categoryPickColumnCount(390)).toBe(3);
    expect(categoryPickColumnCount(599)).toBe(3);
  });

  it("uses 4 columns on medium tablet widths", () => {
    expect(categoryPickColumnCount(600)).toBe(4);
    expect(categoryPickColumnCount(767)).toBe(4);
  });

  it("uses 5 columns on wide tablet widths", () => {
    expect(categoryPickColumnCount(768)).toBe(5);
    expect(categoryPickColumnCount(1024)).toBe(5);
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
