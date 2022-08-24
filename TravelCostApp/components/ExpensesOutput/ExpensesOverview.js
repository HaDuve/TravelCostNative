import { StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import ExpenseCategories from "./ExpenseStatistics/ExpenseCategories";
import IconButton from "../UI/IconButton";
import ExpenseGraph from "./ExpenseStatistics/ExpenseGraph";

const ExpensesOverview = ({ expenses }) => {
  const [toggleGraph, setToggleGraph] = useState(false);
  //   console.log(JSON.stringify(expenses, null, 2));
  function toggleContent() {
    setToggleGraph(!toggleGraph);
  }
  return (
    <View style={styles.container}>
      <IconButton
        icon="toggle"
        size={24}
        color={"black"}
        onPress={toggleContent}
      />
      {!toggleGraph && <ExpenseCategories expenses={expenses} />}
      {toggleGraph && <ExpenseGraph expenses={expenses} />}
    </View>
  );
};

export default ExpensesOverview;

const styles = StyleSheet.create({
  container: { flex: 1 },
});
