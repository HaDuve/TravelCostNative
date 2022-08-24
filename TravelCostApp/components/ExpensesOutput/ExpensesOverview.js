import { StyleSheet, Text, View } from "react-native";
import React from "react";
import ExpenseCategories from "./ExpenseStatistics/ExpenseCategories";

const ExpensesOverview = ({ expenses }) => {
  //   console.log(JSON.stringify(expenses, null, 2));
  return (
    <View style={styles.container}>
      <ExpenseCategories expenses={expenses} />
    </View>
  );
};

export default ExpensesOverview;

const styles = StyleSheet.create({
  container: { flex: 1 },
});
