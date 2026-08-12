import React, { useCallback } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import ResponsiveGrid from "../layout/ResponsiveGrid";
import ExpenseListRow from "./ExpenseListRow";
import { useLayoutProfile } from "../../store/layout-context";
import { GlobalStyles } from "../../constants/styles";
import type { ExpenseData } from "../../util/expense";

type FilteredExpensesGridProps = {
  expenses: ExpenseData[];
};

export default function FilteredExpensesGrid({
  expenses,
}: FilteredExpensesGridProps) {
  const layout = useLayoutProfile();
  const navigation = useNavigation();
  const isWide = layout.breakpoint !== "narrow";

  const navigateToExpense = useCallback(
    (expenseId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate("ManageExpense" as never, { expenseId } as never);
    },
    [navigation]
  );

  if (!isWide) {
    return (
      <ScrollView
        testID="filtered-expenses-list"
        contentContainerStyle={styles.listContent}
      >
        {expenses.map((expense) => (
          <ExpenseListRow
            key={expense.id}
            {...expense}
            layoutVariant="ledger"
            onPress={() => navigateToExpense(expense.id)}
          />
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      testID="filtered-expenses-list"
      contentContainerStyle={styles.listContent}
    >
      <ResponsiveGrid
        testID="filtered-expenses-grid"
        layout={layout}
        columnWidths={[1, 1]}
        items={expenses.map((expense) => ({
          key: expense.id,
          render: () => (
            <ExpenseListRow
              {...expense}
              layoutVariant="ledger"
              onPress={() => navigateToExpense(expense.id)}
            />
          ),
        }))}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 16,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
});
