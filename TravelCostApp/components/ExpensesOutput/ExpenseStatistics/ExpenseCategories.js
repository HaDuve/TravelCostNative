import { Pressable, StyleSheet, Text, View } from "react-native";
import { FlatList } from "react-native";
import * as Haptics from "expo-haptics";

import React from "react";
import CategoryProgressBar from "./CategoryProgressBar";
import { CatColors, GlobalStyles } from "../../../constants/styles";
import CategoryChart from "../../ExpensesOverview/CategoryChart";
import { ScrollView } from "react-native-gesture-handler";
import { G } from "react-native-svg";
import Animated, {
  FadeInRight,
  FadeInUp,
  FadeOutLeft,
  Layout,
  Transition,
} from "react-native-reanimated";
import { getCatString } from "../../../util/category";

const ExpenseCategories = ({ expenses, periodName, navigation }) => {
  const layoutAnim = Layout.damping(50).stiffness(300).overshootClamping(true);

  if (!expenses)
    return (
      <View style={styles.container}>
        <Text>No expenses</Text>;
      </View>
    );

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
    catSumCat.push({
      cat: cat,
      sumCat: sumCat,
      color: "",
      catExpenses: catExpenses,
    });
  });

  function renderItem(itemData) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.categoryCard,
          pressed && GlobalStyles.pressedWithShadow,
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate("FilteredExpenses", {
            expenses: itemData.item.catExpenses,
            dayString:
              getCatString(itemData.item.cat) +
              (periodName !== "total" ? " this " : " ") +
              periodName,
          });
        }}
      >
        <CategoryProgressBar
          color={itemData.item.color}
          cat={itemData.item.cat}
          totalCost={totalSum}
          catCost={itemData.item.sumCat}
        />
      </Pressable>
    );
  }

  catSumCat.sort((a, b) => b.sumCat - a.sumCat);
  dataList.sort((a, b) => b.sumCat - a.sumCat);

  const colorlist = CatColors;

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
    <Animated.View style={styles.container}>
      <Animated.FlatList
        itemLayoutAnimation={layoutAnim}
        data={catSumCat}
        renderItem={renderItem}
        keyExtractor={(item) => item.cat}
        ListHeaderComponent={
          <CategoryChart inputData={dataList}></CategoryChart>
        }
        ListFooterComponent={<View style={{ height: 100 }}></View>}
        ListEmptyComponent={
          <View style={styles.fallbackTextContainer}>
            <Text>
              No expenses for this Timeframe, try choosing another period in the
              dropdown menu or adding new expenses!
            </Text>
          </View>
        }
      />
    </Animated.View>
  );
};

export default ExpenseCategories;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 6,
  },
  fallbackTextContainer: {
    flex: 1,
    padding: 24,
    marginTop: "-50%",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  categoryCard: {
    marginVertical: 4,
    marginBottom: 12,
    marginHorizontal: 8,
    paddingBottom: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 1,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2.84,
    elevation: 5,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 10,
  },
});
