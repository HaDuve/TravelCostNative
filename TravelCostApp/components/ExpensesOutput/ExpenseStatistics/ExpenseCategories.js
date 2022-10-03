import { StyleSheet, Text, View } from "react-native";
import { FlatList } from "react-native";

import React from "react";
import CategoryProgressBar from "./CategoryProgressBar";
import { GlobalStyles } from "../../../constants/styles";
import CategoryChart from "../../ExpensesOverview/CategoryChart";
import { ScrollView } from "react-native-gesture-handler";

const ExpenseCategories = ({ expenses, periodName }) => {
  if (!expenses) return;

  let categoryList = [];
  expenses.forEach((expense) => {
    const cat = expense.category;
    if (!categoryList.includes(cat)) {
      categoryList.push(cat);
    }
  });

  function getAllExpensesWithCat(category) {
    return expenses.filter((expense) => {
      return expense.category === category;
    });
  }

  function getSumExpenses(expenses) {
    const expensesSum = expenses.reduce((sum, expense) => {
      return sum + expense.calcAmount;
    }, 0);
    return expensesSum;
  }
  const totalSum = getSumExpenses(expenses);

  let catSumCat = [];
  let dataList = [];

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
  dataList.sort((a, b) => b.sumCat - a.sumCat);

  const colorlist = [
    // items of the color list will repeat those colors

    GlobalStyles.colors.primary400,
    GlobalStyles.colors.error500,
    GlobalStyles.colors.accent500,
    GlobalStyles.colors.primary700,
    GlobalStyles.colors.error300,
    GlobalStyles.colors.accent700,
    GlobalStyles.colors.errorGrayed,
  ];

  let color_i = 0;
  catSumCat.forEach((item) => {
    item.color = colorlist[color_i];
    color_i++;
    if (color_i >= colorlist.length) {
      color_i = 0;
    }
    dataList.push({ x: item.cat, y: item.sumCat, color: item.color });
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={catSumCat}
        renderItem={renderItem}
        keyExtractor={(item) => item.cat}
        ListHeaderComponent={
          <CategoryChart inputData={dataList}></CategoryChart>
        }
      />
    </View>
  );
};

export default ExpenseCategories;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 60,
  },
});
