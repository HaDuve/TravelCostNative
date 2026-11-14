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

/** Everyday spendable-category icons approved for the Manage categories picker. */
const EVERYDAY_CATEGORY_ICONS = [
  "tennisball-outline",
  "basketball-outline",
  "baseball-outline",
  "golf-outline",
  "barbell-outline",
  "bicycle-outline",
  "ribbon-outline",
  "footsteps-outline",
  "airplane-outline",
  "car-outline",
  "car-sport-outline",
  "bus-outline",
  "boat-outline",
  "subway-outline",
  "bed-outline",
  "home-outline",
  "location-outline",
  "pin-outline",
  "flag-outline",
  "globe-outline",
  "earth-outline",
  "ticket-outline",
  "balloon-outline",
  "umbrella-outline",
  "snow-outline",
  "trail-sign-outline",
  "restaurant-outline",
  "beer-outline",
  "fish-outline",
  "egg-outline",
  "bag-outline",
  "basket-outline",
  "storefront-outline",
  "pricetags-outline",
  "receipt-outline",
  "business-outline",
  "briefcase-outline",
  "construct-outline",
  "hammer-outline",
  "build-outline",
  "cut-outline",
  "brush-outline",
  "bulb-outline",
  "wifi-outline",
  "call-outline",
  "mail-outline",
  "medkit-outline",
  "bandage-outline",
  "scale-outline",
  "camera-outline",
  "videocam-outline",
  "mic-outline",
  "dice-outline",
  "extension-puzzle-outline",
  "library-outline",
  "newspaper-outline",
  "journal-outline",
  "telescope-outline",
  "diamond-outline",
  "lock-closed-outline",
  "shield-checkmark-outline",
  "id-card-outline",
  "accessibility-outline",
] as const;

describe("CATEGORY_ICON_CHOICES", () => {
  it("exposes a duplicate-free icon list for the picker", () => {
    expect(CATEGORY_ICON_CHOICES).toEqual(
      uniqueCategoryIcons(CATEGORY_ICON_CHOICES)
    );
    expect(CATEGORY_ICON_CHOICES).toContain("gift-outline");
    expect(CATEGORY_ICON_CHOICES).toContain("cafe-outline");
  });

  it("includes everyday spendable-category icons for travellers and home life", () => {
    for (const icon of EVERYDAY_CATEGORY_ICONS) {
      expect(CATEGORY_ICON_CHOICES).toContain(icon);
    }
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
