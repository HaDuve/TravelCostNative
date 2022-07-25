import { StyleSheet, Text, View, FlatList } from "react-native";
import React from "react";

function renderExpenseItem(itemData) {
  return <Text>{itemData.item.description}</Text>;
}

const ExpensesList = ({ expenses }) => {
  return (
    <FlatList
      data={expenses}
      renderItem={renderExpenseItem}
      keyExtractor={(item) => item.id}
    />
  );
};

export default ExpensesList;

const styles = StyleSheet.create({});
