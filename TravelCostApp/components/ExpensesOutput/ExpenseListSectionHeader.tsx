import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";

/**
 * Fixed height of a section header row. The Expense list's scroll offset math
 * (`getItemLayout`) relies on every header being exactly this tall.
 */
export const SECTION_HEADER_HEIGHT = dynamicScale(32, true);

/**
 * Small gray caption above a group of Expenses ("Today", "Monday 23.11",
 * "This morning", "October 2026").
 * Not pressable or swipeable; announced as a header to screen readers.
 */
function ExpenseListSectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.container}>
      <Text
        accessibilityRole="header"
        maxFontSizeMultiplier={1.2}
        numberOfLines={1}
        style={styles.label}
      >
        {label}
      </Text>
    </View>
  );
}

export default memo(ExpenseListSectionHeader);

const styles = StyleSheet.create({
  container: {
    height: SECTION_HEADER_HEIGHT,
    width: "100%",
    justifyContent: "flex-end",
    // more room above than below, so the caption reads as part of the
    // group under it
    paddingBottom: dynamicScale(4, true),
    paddingLeft: dynamicScale(16),
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  label: {
    // gray700 on backgroundColor is about 5.7:1 (WCAG AA needs 4.5:1)
    color: GlobalStyles.colors.gray700,
    fontSize: dynamicScale(12, false, 0.5),
  },
});
