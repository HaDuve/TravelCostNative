import { StyleSheet } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import { shadowRegressionStyles } from "../../styles/shadow-regression-styles";
import { styleHasShadow } from "../../util/shadow-styles";

describe("summary toast progress bars", () => {
  it("render flat tracks without drop shadow chrome", () => {
    const trackStyle = StyleSheet.flatten(
      shadowRegressionStyles.toastProgressBarTrack
    ) as Record<string, unknown>;

    expect(styleHasShadow(trackStyle)).toBe(false);
    expect(trackStyle.backgroundColor).toBe(GlobalStyles.colors.gray300);
  });
});
