import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

import React from "react";
import CategoryProgressBar from "./CategoryProgressBar";
import { CatColors, GlobalStyles } from "../../../constants/styles";
import CategoryChart from "../../ExpensesOverview/CategoryChart";
import Animated, { Layout } from "react-native-reanimated";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import { getCatString } from "../../../util/category";
import PropTypes from "prop-types";
import { ExpenseData } from "../../../util/expense";
import { travellerToDropdown } from "../../../util/split";
import useContext from "react";
import { TripContext } from "../../../store/trip-context";

const ExpenseTravellers = ({ expenses, periodName, navigation }) => {
  const layoutAnim = Layout.damping(50).stiffness(300).overshootClamping(0.8);

  if (!expenses)
    return (
      <View style={styles.container}>
        <Text>{i18n.t("fallbackTextExpenses")}</Text>;
      </View>
    );

  const travellerList = [];
  expenses.forEach((expense: ExpenseData) => {
    const hasSplits = expense.splitList && expense.splitList?.length !== 0;
    if (hasSplits) {
      expense.splitList.forEach((split) => {
        const travellerName = split.userName;
        if (!travellerList.includes(travellerName)) {
          travellerList.push(travellerName);
        }
      });
    } else {
      const travellerName = expense.whoPaid;
      if (!travellerList.includes(travellerName)) {
        travellerList.push(travellerName);
      }
    }
  });

  function getAllExpensesWithTraveller(traveller: string) {
    return expenses.filter((expense: ExpenseData) => {
      // check if the expense has a splitlist
      const hasSplits = expense.splitList && expense.splitList?.length !== 0;
      if (!hasSplits) {
        return expense.whoPaid === traveller;
      } else {
        // return true if the splitlist contains the traveller
        return expense.splitList.some((split) => {
          return split.userName === traveller;
        });
      }
    });
  }

  function getSumExpenses(expenses, traveller) {
    // return the sum of expenses for a given traveller
    // sum up either the expense.calcAmount if no splitlist exists
    // or the expense.calcAmount - split.amount if a splitlist exists
    const expensesSum = expenses.reduce((sum, expense: ExpenseData) => {
      const hasSplits = expense.splitList && expense.splitList?.length !== 0;
      if (!hasSplits) {
        const correct = traveller == expense.whoPaid;
        if (!correct) return sum;
        return sum + expense.calcAmount;
      } else {
        const split = expense.splitList.find(
          (split) => split.userName === traveller
        );
        const correct = split;
        if (!correct) return sum;

        // check if the expense has a calcAmount by comparing it to the amount
        // if it is the same, the expense has no calcAmount
        const hasCalcAmount = expense.calcAmount !== expense.amount;
        if (!hasCalcAmount) {
          return sum + expense.calcAmount - split.amount;
        } else {
          // calculate the rate of the split
          const rate = expense.calcAmount / expense.amount;
          // calculate the amount of the split
          const splitAmount = split.amount * rate;
          return sum + expense.calcAmount - splitAmount;
        }
      }
    }, 0);
    return expensesSum;
  }

  function getSumAllExpenses(expenses) {
    // return the sum of all expenses
    const expensesSum = expenses.reduce((sum, expense: ExpenseData) => {
      return sum + expense.calcAmount;
    }, 0);
    return expensesSum;
  }
  const totalSum = getSumAllExpenses(expenses);

  const catSumCat = [];
  const dataList = [];

  for (const travellerIndex in travellerList) {
    const catExpenses = getAllExpensesWithTraveller(
      travellerList[travellerIndex]
    );
    const sumCat = getSumExpenses(catExpenses, travellerList[travellerIndex]);
    catSumCat.push({
      cat: travellerList[travellerIndex],
      sumCat: sumCat,
      color: "",
      catExpenses: catExpenses,
    });
  }

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
          iconOverride={"happy-outline"}
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
            <Text>{i18n.t("fallbackTextExpenses")}</Text>;
          </View>
        }
      />
    </Animated.View>
  );
};

export default ExpenseTravellers;

ExpenseTravellers.propTypes = {
  expenses: PropTypes.array,
  periodName: PropTypes.string,
  navigation: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 4,
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
