import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";
import { formatExpenseWithCurrency } from "../../util/string";

/**
 * Fixed height of a section header row. The Expense list's scroll offset math
 * (`getItemLayout`) relies on every header being exactly this tall.
 */
export const SECTION_HEADER_HEIGHT = dynamicScale(32, true);

/**
 * Small gray caption above a group of Expenses ("Today", "Friday 27.11",
 * "This morning", "October 2026"), with the group's period spend right-aligned
 * in the Trip currency. Fixed height; label and amount never wrap.
 * Not pressable or swipeable; announced as a header to screen readers,
 * including the amount.
 */
function ExpenseListSectionHeader({
  label,
  total,
  currency,
}: {
  label: string;
  total?: number;
  currency?: string;
}) {
  const amount =
    total === undefined ? "" : formatExpenseWithCurrency(total, currency);
  return (
    <View style={styles.container}>
      <Text
        accessibilityRole="header"
        accessibilityLabel={amount ? `${label}, ${amount}` : label}
        maxFontSizeMultiplier={1.2}
        numberOfLines={1}
        style={styles.label}
      >
        {label}
      </Text>
      {!!amount && (
        <Text
          accessible={false}
          importantForAccessibility="no"
          maxFontSizeMultiplier={1.2}
          numberOfLines={1}
          style={styles.amount}
        >
          {amount}
        </Text>
      )}
    </View>
  );
}

export default memo(ExpenseListSectionHeader);

const styles = StyleSheet.create({
  container: {
    height: SECTION_HEADER_HEIGHT,
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    // more room above than below, so the caption reads as part of the
    // group under it
    paddingBottom: dynamicScale(4, true),
    paddingLeft: dynamicScale(16),
    paddingRight: dynamicScale(16),
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  amount: {
    color: GlobalStyles.colors.gray700,
    fontSize: dynamicScale(12, false, 0.5),
    flexShrink: 0,
    marginLeft: dynamicScale(8),
  },
  label: {
    flexShrink: 1,
    // gray700 on backgroundColor is about 5.7:1 (WCAG AA needs 4.5:1)
    color: GlobalStyles.colors.gray700,
    fontSize: dynamicScale(12, false, 0.5),
  },
});
