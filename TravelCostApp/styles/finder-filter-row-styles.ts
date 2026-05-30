import { Platform, StyleSheet } from "react-native";
import { GlobalStyles } from "../constants/styles";
import { dynamicScale } from "../util/scalingUtil";

export const FINDER_FILTER_CONTENT_WIDTH = dynamicScale(180, false, 0.5);
export const FINDER_FILTER_CLEAR_SLOT_WIDTH = dynamicScale(40, false, 0.5);
const CLEAR_ICON_SIZE = dynamicScale(26, false, 0.5);

export const finderFilterRowStyles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: dynamicScale(90, true),
  },
  searchRow: {
    zIndex: 10,
  },
  dateRow: {
    zIndex: 1,
  },
  checkboxColumn: {
    borderRadius: dynamicScale(99, false, 0.5),
    marginRight: dynamicScale(8),
    justifyContent: "center",
    ...Platform.select({
      ios: { borderWidth: 1 },
    }),
  },
  filterContentColumn: {
    width: FINDER_FILTER_CONTENT_WIDTH,
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: dynamicScale(8, false, 0.3),
    overflow: "visible",
  },
  clearColumn: {
    width: FINDER_FILTER_CLEAR_SLOT_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  clearPlaceholder: {
    width: CLEAR_ICON_SIZE,
    height: CLEAR_ICON_SIZE,
  },
});
