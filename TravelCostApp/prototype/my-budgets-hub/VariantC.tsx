import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/styles";
import { shadowRegressionStyles } from "../../styles/shadow-regression-styles";
import { dynamicScale } from "../../util/scalingUtil";
import type { PrototypeBudget } from "./mock-data";
import { ActionFeedback, BudgetList, HubActions, SectionTitle } from "./shared";

export const VARIANT_NAME = "Compact header";

export function VariantC({
  budgets,
  feedback,
  onJoin,
  onAddAnother,
  onBudgetPress,
}: {
  budgets: PrototypeBudget[];
  feedback: string | null;
} & HubActions) {
  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <SectionTitle>My Budgets</SectionTitle>
        <View style={styles.headerActions}>
          <Pressable onPress={onJoin} style={styles.joinLink}>
            <Text style={styles.joinLinkText}>Join</Text>
          </Pressable>
          <Pressable
            onPress={onAddAnother}
            style={({ pressed }) => [
              styles.addFab,
              shadowRegressionStyles.addExpenseFab,
              pressed && GlobalStyles.pressed,
            ]}
          >
            <Ionicons
              name="add"
              size={dynamicScale(28, false, 0.5)}
              color={GlobalStyles.colors.backgroundColor}
            />
          </Pressable>
        </View>
      </View>
      <Text style={styles.hint}>
        Tap + for another budget · Join via invite
      </Text>
      <ActionFeedback message={feedback} />
      <BudgetList budgets={budgets} onBudgetPress={onBudgetPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: dynamicScale(16) },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: dynamicScale(8),
    marginTop: dynamicScale(4, true),
  },
  joinLink: {
    paddingVertical: dynamicScale(8, true),
    paddingHorizontal: dynamicScale(12),
  },
  joinLinkText: {
    fontSize: dynamicScale(15, false, 0.5),
    fontWeight: "600",
    color: GlobalStyles.colors.primary500,
  },
  addFab: {
    backgroundColor: GlobalStyles.colors.primary400,
    borderRadius: 99,
    padding: dynamicScale(8, false, 0.5),
  },
  hint: {
    fontSize: dynamicScale(12, false, 0.5),
    color: GlobalStyles.colors.textHidden,
    marginTop: dynamicScale(-8, true),
    marginBottom: dynamicScale(12, true),
  },
});
