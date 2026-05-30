import { StyleSheet } from "react-native";

import { shadowRegressionStyles } from "../../styles/shadow-regression-styles";
import {
  assertSolidBackgroundForShadow,
  styleHasShadow,
} from "../../util/shadow-styles";

describe("shadow styles", () => {
  it("detects shadow props on a style object", () => {
    expect(styleHasShadow({ shadowColor: "#000", shadowOpacity: 0.5 })).toBe(
      true
    );
    expect(styleHasShadow({ backgroundColor: "#fff" })).toBe(false);
  });

  it("requires solid backgroundColor when shadow props are present", () => {
    expect(() =>
      assertSolidBackgroundForShadow({ shadowColor: "#000" })
    ).toThrow(/solid backgroundColor/);

    expect(() =>
      assertSolidBackgroundForShadow({
        shadowColor: "#000",
        backgroundColor: "#ffffff",
      })
    ).not.toThrow();
  });

  it("expense graph category card shadow includes backgroundColor", () => {
    assertSolidBackgroundForShadow(
      StyleSheet.flatten(shadowRegressionStyles.expenseGraphCategoryCard)
    );
  });

  it("statistics pie category card shadow includes backgroundColor", () => {
    assertSolidBackgroundForShadow(
      StyleSheet.flatten(shadowRegressionStyles.statisticsPieCategoryCard)
    );
  });

  it("overview dropdown shadow style includes backgroundColor", () => {
    assertSolidBackgroundForShadow(
      StyleSheet.flatten(shadowRegressionStyles.overviewDropdownContainer)
    );
  });

  it("overview fab toggle keeps svg-only chrome without a background halo", () => {
    const flat = StyleSheet.flatten(
      shadowRegressionStyles.overviewFabToggleButton
    ) as Record<string, unknown>;
    expect(flat.backgroundColor).toBeUndefined();
    expect(flat.borderRadius).toBeUndefined();
  });

  it("expenses summary container matches overview dropdown shadow chrome", () => {
    const summary = StyleSheet.flatten(
      shadowRegressionStyles.expensesSummaryContainer
    ) as Record<string, unknown>;
    const dropdown = StyleSheet.flatten(
      shadowRegressionStyles.overviewDropdownContainer
    ) as Record<string, unknown>;

    assertSolidBackgroundForShadow(summary);
    expect(summary.borderWidth).toBeGreaterThan(0);
    expect(summary.borderRadius).toBe(dropdown.borderRadius);
    expect(summary.backgroundColor).toBe(dropdown.backgroundColor);
    expect(summary.shadowColor).toBe(dropdown.shadowColor);
    expect(summary.shadowOpacity).toBe(dropdown.shadowOpacity);
    expect(summary.shadowRadius).toBe(dropdown.shadowRadius);
  });

  it("overview header cards share equal flex and width constraints", () => {
    const summary = StyleSheet.flatten(
      shadowRegressionStyles.expensesSummaryContainer
    ) as Record<string, unknown>;
    const dropdown = StyleSheet.flatten(
      shadowRegressionStyles.overviewDropdownContainer
    ) as Record<string, unknown>;

    expect(summary.flex).toBe(1);
    expect(dropdown.flex).toBe(1);
    expect(summary.maxWidth).toBe("50%");
    expect(dropdown.maxWidth).toBe("50%");
  });

  it("expense country flag container co-locates shadow and backgroundColor", () => {
    const flat = StyleSheet.flatten(
      shadowRegressionStyles.expenseCountryFlagContainer
    );
    expect(styleHasShadow(flat)).toBe(true);
    assertSolidBackgroundForShadow(flat);
  });

  it("split balance row co-locates shadow and backgroundColor", () => {
    assertSolidBackgroundForShadow(
      StyleSheet.flatten(shadowRegressionStyles.splitBalanceRow)
    );
  });

  it("trip history card co-locates shadow and backgroundColor", () => {
    assertSolidBackgroundForShadow(
      StyleSheet.flatten(shadowRegressionStyles.tripHistoryCard)
    );
  });

  it("trip traveller chip co-locates shadow and backgroundColor", () => {
    assertSolidBackgroundForShadow(
      StyleSheet.flatten(shadowRegressionStyles.tripTravellerChip)
    );
  });

  it("changelog item co-locates shadow and backgroundColor", () => {
    assertSolidBackgroundForShadow(
      StyleSheet.flatten(shadowRegressionStyles.changelogItem)
    );
  });

  it("overview divider bar co-locates shadow and backgroundColor", () => {
    const flat = StyleSheet.flatten(
      shadowRegressionStyles.overviewDividerBar
    ) as Record<string, unknown>;
    expect(styleHasShadow(flat)).toBe(true);
    assertSolidBackgroundForShadow(flat);
  });

  it("trip traveller avatar co-locates shadow and backgroundColor", () => {
    const flat = StyleSheet.flatten(
      shadowRegressionStyles.tripTravellerAvatar
    ) as Record<string, unknown>;
    expect(styleHasShadow(flat)).toBe(true);
    assertSolidBackgroundForShadow(flat);
  });

  it("statistics pie category cards use list item margins and border chrome", () => {
    const flat = StyleSheet.flatten(
      shadowRegressionStyles.statisticsPieCategoryCard
    ) as Record<string, unknown>;

    expect(flat.borderWidth).toBeGreaterThan(0);
    expect(flat.borderColor).toBeDefined();
    expect(flat.marginHorizontal).toBeDefined();
  });
});
