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

  it("overview dropdown and fab shadow styles include backgroundColor", () => {
    assertSolidBackgroundForShadow(
      StyleSheet.flatten(shadowRegressionStyles.overviewDropdownContainer)
    );
    assertSolidBackgroundForShadow(
      StyleSheet.flatten(shadowRegressionStyles.overviewFabToggleButton)
    );
  });
});
