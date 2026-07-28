import { Platform, StyleSheet } from "react-native";

import { dynamicScale } from "../util/scalingUtil";

/** Layout styles for the premium blur overlay card — exported for regression tests. */
export const blurPremiumLayoutStyles = StyleSheet.create({
  titleContainerBlur: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    paddingHorizontal: "5%",

    ...Platform.select({
      ios: {
        paddingBottom: "2%",
        width: "100%",
        height: "100%",
      },
      android: {
        paddingBottom: "0%",
        width: "100%",
        height: "105%",
      },
    }),
  },
  overlayCardWrap: {
    width: "100%",
    maxWidth: dynamicScale(420, false, 0.5),
  },
  overlayCard: {
    width: "100%",
    padding: 30,
  },
});
