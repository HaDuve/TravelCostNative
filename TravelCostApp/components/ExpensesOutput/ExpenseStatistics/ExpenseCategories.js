import { StyleSheet, Text, View } from "react-native";
import { FlatList } from "react-native";

import React from "react";
import CategoryProgressBar from "./CategoryProgressBar";
import { GlobalStyles } from "../../../constants/styles";

const ExpenseCategories = ({ expenses }) => {
  if (!expenses) return;

  let categoryList = [];
  expenses.forEach((expense) => {
    const cat = expense.description;
    if (!categoryList.includes(cat)) {
      categoryList.push(cat);
    }
  });

  function getAllExpensesWithCat(category) {
    return expenses.filter((expense) => {
      return expense.description === category;
    });
  }

  function getSumExpenses(expenses) {
    const expensesSum = expenses.reduce((sum, expense) => {
      return sum + expense.amount;
    }, 0);
    return expensesSum;
  }
  const totalSum = getSumExpenses(expenses);

  let catSumCat = [];
  categoryList.forEach((cat) => {
    const catExpenses = getAllExpensesWithCat(cat);
    const sumCat = getSumExpenses(catExpenses);
    catSumCat.push({ cat: cat, sumCat: sumCat, color: "" });
  });

  function renderItem(itemData) {
    return (
      <CategoryProgressBar
        color={itemData.item.color}
        cat={itemData.item.cat}
        totalCost={totalSum}
        catCost={itemData.item.sumCat}
      />
    );
  }

  catSumCat.sort((a, b) => b.sumCat - a.sumCat);

  const colorlist = [
    GlobalStyles.colors.error500,
    GlobalStyles.colors.accent500,
    GlobalStyles.colors.error300,
    GlobalStyles.colors.accent700,
  ];

  let color_i = 0;
  catSumCat.forEach((item) => {
    item.color = colorlist[color_i];
    color_i++;
    if (color_i >= colorlist.length) {
      color_i = 0;
    }
  });

  return (
    <View>
      <FlatList
        data={catSumCat}
        renderItem={renderItem}
        keyExtractor={(item) => item.cat}
      />
    </View>
  );
};

export default ExpenseCategories;

const styles = StyleSheet.create({});
