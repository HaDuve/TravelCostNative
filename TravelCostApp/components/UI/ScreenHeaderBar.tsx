/**
 * ScreenHeaderBar - Reusable header with consistent shadow
 * Used across TripSummaryScreen, and as the base for ProfileToolbar
 */

import * as React from "react";
import { View, Text, StyleSheet, Platform, type TextStyle, type ViewStyle } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import { ProfileToolbarTokens } from "../../styles/profile-toolbar-tokens";
import { dynamicScale } from "../../util/scalingUtil";

type ScreenHeaderBarProps = {
  title?: string;
  titleStyle?: TextStyle;
  children?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
};

export const ScreenHeaderBar = ({
  title,
  titleStyle,
  children,
  style,
  testID = "screen-header-bar",
}: ScreenHeaderBarProps) => {
  return (
    <View style={[styles.headerBar, style]} testID={testID}>
      {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    minHeight: ProfileToolbarTokens.chromeHeight,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    paddingBottom: dynamicScale(12, true),
    paddingHorizontal: dynamicScale(16, false, 0.5),
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: GlobalStyles.colors.textColor,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
    zIndex: 1,
  },
  title: {
    fontSize: dynamicScale(18, false, 0.5),
    fontWeight: "700",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
  },
});
