import {
  CATEGORY_ICON_CHOICES,
  formatCategoryIconLabel,
  uniqueCategoryIcons,
} from "../../util/category-icons";

describe("uniqueCategoryIcons", () => {
  it("keeps the first occurrence of each icon and drops later duplicates", () => {
    expect(
      uniqueCategoryIcons([
        "gift-outline",
        "desktop-outline",
        "gift-outline",
        "leaf-outline",
        "desktop-outline",
        "film-outline",
        "pulse-outline",
        "film-outline",
        "leaf-outline",
        "pulse-outline",
      ])
    ).toEqual([
      "gift-outline",
      "desktop-outline",
      "leaf-outline",
      "film-outline",
      "pulse-outline",
    ]);
  });
});

describe("CATEGORY_ICON_CHOICES", () => {
  it("exposes a duplicate-free icon list for the picker", () => {
    expect(CATEGORY_ICON_CHOICES).toEqual(
      uniqueCategoryIcons(CATEGORY_ICON_CHOICES)
    );
    expect(CATEGORY_ICON_CHOICES).toContain("gift-outline");
    expect(CATEGORY_ICON_CHOICES).toContain("cafe-outline");
  });
});

describe("formatCategoryIconLabel", () => {
  it("turns an ionicon name into a readable accessibility label", () => {
    expect(formatCategoryIconLabel("cafe-outline")).toBe("Cafe");
    expect(formatCategoryIconLabel("game-controller-outline")).toBe(
      "Game Controller"
    );
  });
});
