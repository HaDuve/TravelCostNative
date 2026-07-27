import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import { shadowRegressionStyles } from "../../styles/shadow-regression-styles";
import { dynamicScale } from "../../util/scalingUtil";
import type { PrototypeBudget } from "./mock-data";
import {
  ActionFeedback,
  AddIcon,
  BudgetList,
  HubActions,
  JoinIcon,
  SectionTitle,
} from "./shared";

export const VARIANT_NAME = "Action rows";

function ActionRow({
  label,
  hint,
  icon,
  onPress,
}: {
  label: string;
  hint: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        shadowRegressionStyles.tripHistoryCard,
        pressed && GlobalStyles.pressed,
      ]}
    >
      <View style={styles.actionIcon}>{icon}</View>
      <View style={styles.actionText}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionHint}>{hint}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export function VariantB({
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
      <SectionTitle>My Budgets</SectionTitle>
      <ActionFeedback message={feedback} />
      <ActionRow
        label="Join budget"
        hint="Enter an invite code or link"
        icon={<JoinIcon />}
        onPress={onJoin}
      />
      <ActionRow
        label="Add another budget"
        hint="New budgets start empty"
        icon={<AddIcon />}
        onPress={onAddAnother}
      />
      <Text style={styles.listLabel}>Your budgets</Text>
      <BudgetList budgets={budgets} onBudgetPress={onBudgetPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: dynamicScale(16) },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: 16,
    padding: dynamicScale(14),
    marginBottom: dynamicScale(10, true),
  },
  actionIcon: { marginRight: dynamicScale(12) },
  actionText: { flex: 1 },
  actionLabel: {
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "600",
    color: GlobalStyles.colors.textColor,
  },
  actionHint: {
    fontSize: dynamicScale(12, false, 0.5),
    color: GlobalStyles.colors.textHidden,
    marginTop: dynamicScale(2, true),
  },
  chevron: {
    fontSize: dynamicScale(22, false, 0.5),
    color: GlobalStyles.colors.gray600,
  },
  listLabel: {
    fontSize: dynamicScale(13, false, 0.5),
    fontWeight: "600",
    color: GlobalStyles.colors.gray700,
    marginTop: dynamicScale(8, true),
    marginBottom: dynamicScale(8, true),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
