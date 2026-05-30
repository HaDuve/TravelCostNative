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

  it("expenses summary pressable co-locates shadow and backgroundColor", () => {
    assertSolidBackgroundForShadow(
      StyleSheet.flatten([
        shadowRegressionStyles.expensesSummaryPressable,
        { shadowColor: "#BFBFBF", shadowOpacity: 0.75 },
      ])
    );
  });

  it("expense country flag container co-locates shadow and backgroundColor", () => {
    const flat = StyleSheet.flatten(
      shadowRegressionStyles.expenseCountryFlagContainer
    );
    expect(styleHasShadow(flat)).toBe(true);
    assertSolidBackgroundForShadow(flat);
  });
});
