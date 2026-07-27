import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/styles";
import { shadowRegressionStyles } from "../../styles/shadow-regression-styles";
import { dynamicScale } from "../../util/scalingUtil";
import type { PrototypeBudget } from "./mock-data";

export type HubActions = {
  onJoin: () => void;
  onAddAnother: () => void;
  onBudgetPress: (budget: PrototypeBudget) => void;
};

export function BudgetCard({
  budget,
  onPress,
}: {
  budget: PrototypeBudget;
  onPress: () => void;
}) {
  const subtitle = budget.isImplicit
    ? `${budget.expenseCount} expenses · tap to name`
    : `${budget.expenseCount} expenses · ${budget.travellerCount} ${
        budget.travellerCount === 1 ? "person" : "people"
      }`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        shadowRegressionStyles.tripHistoryCard,
        budget.isActive && styles.cardActive,
        pressed && GlobalStyles.pressed,
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{budget.name}</Text>
        {budget.isActive && (
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>Active</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
      <Text style={styles.cardAmount}>
        {budget.spent.toFixed(2)} {budget.currency}
      </Text>
    </Pressable>
  );
}

export function BudgetList({
  budgets,
  onBudgetPress,
}: {
  budgets: PrototypeBudget[];
  onBudgetPress: (budget: PrototypeBudget) => void;
}) {
  return (
    <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
      {budgets.map((budget) => (
        <BudgetCard
          key={budget.id}
          budget={budget}
          onPress={() => onBudgetPress(budget)}
        />
      ))}
    </ScrollView>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function ActionFeedback({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.feedback}>
      <Text style={styles.feedbackText}>{message}</Text>
    </View>
  );
}

export function JoinIcon() {
  return (
    <Ionicons
      name="people-outline"
      size={dynamicScale(20, false, 0.5)}
      color={GlobalStyles.colors.primary500}
    />
  );
}

export function AddIcon() {
  return (
    <Ionicons
      name="add-circle-outline"
      size={dynamicScale(20, false, 0.5)}
      color={GlobalStyles.colors.primary500}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { paddingBottom: dynamicScale(120, true) },
  sectionTitle: {
    fontSize: dynamicScale(22, false, 0.5),
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
    marginBottom: dynamicScale(12, true),
  },
  card: {
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: 16,
    padding: dynamicScale(16),
    marginBottom: dynamicScale(12, true),
  },
  cardActive: {
    borderWidth: 2,
    borderColor: GlobalStyles.colors.primary400,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: dynamicScale(18, false, 0.5),
    fontWeight: "600",
    color: GlobalStyles.colors.textColor,
  },
  cardSubtitle: {
    marginTop: dynamicScale(4, true),
    fontSize: dynamicScale(13, false, 0.5),
    color: GlobalStyles.colors.textHidden,
  },
  cardAmount: {
    marginTop: dynamicScale(8, true),
    fontSize: dynamicScale(20, false, 0.5),
    fontWeight: "700",
    color: GlobalStyles.colors.primary500,
  },
  activePill: {
    backgroundColor: GlobalStyles.colors.primary50,
    paddingHorizontal: dynamicScale(8),
    paddingVertical: dynamicScale(2, true),
    borderRadius: 99,
  },
  activePillText: {
    fontSize: dynamicScale(11, false, 0.5),
    color: GlobalStyles.colors.primary700,
    fontWeight: "600",
  },
  feedback: {
    backgroundColor: GlobalStyles.colors.primary50,
    padding: dynamicScale(10),
    borderRadius: 8,
    marginBottom: dynamicScale(8, true),
  },
  feedbackText: {
    fontSize: dynamicScale(12, false, 0.5),
    color: GlobalStyles.colors.primary700,
  },
});
