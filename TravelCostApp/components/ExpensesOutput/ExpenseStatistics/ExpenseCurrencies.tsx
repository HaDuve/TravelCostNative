import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

import React, { useContext } from "react";
import CategoryProgressBar from "./CategoryProgressBar";
import { CatColors, GlobalStyles } from "../../../constants/styles";
import CategoryChart from "../../ExpensesOverview/CategoryChart";
import Animated, { Layout } from "react-native-reanimated";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import { getCatString } from "../../../util/category";
import PropTypes from "prop-types";
import { ExpenseData, getExpensesSum } from "../../../util/expense";
import BlurPremium from "../../Premium/BlurPremium";
import { processTitleStringFilteredPiecharts } from "../../../util/string";
import { TripContext } from "../../../store/trip-context";
import { dynamicScale } from "../../../util/scalingUtil";
import { OrientationContext } from "../../../store/orientation-context";

const ExpenseCurrencies = ({
  expenses,
  periodName,
  navigation,
  forcePortraitFormat,
}) => {
  const layoutAnim = Layout.damping(50).stiffness(300).overshootClamping(0.8);
  const { tripCurrency } = useContext(TripContext);
  const { isPortrait } = useContext(OrientationContext);
  const useRowFormat = !isPortrait && !forcePortraitFormat;
  if (!expenses)
    return (
      <View style={styles.container}>
        <Text>{i18n.t("fallbackTextExpenses")}</Text>
      </View>
    );

  const countryList = [];
  expenses.forEach((expense: ExpenseData) => {
    const currencyName = expense.currency;
    if (!countryList.includes(currencyName)) {
      countryList.push(currencyName);
    }
  });

  function getAllExpensesWithCur(currency: string) {
    return expenses.filter((expense: ExpenseData) => {
      return expense.currency === currency;
    });
  }

  const totalSum = getExpensesSum(expenses);

  const catSumCat = [];
  const dataList = [];

  countryList.forEach((cat: string) => {
    const catExpenses: ExpenseData[] = getAllExpensesWithCur(cat);
    const sumCat = getExpensesSum(catExpenses);
    catSumCat.push({
      cat: cat,
      sumCat: sumCat,
      color: "",
      catExpenses: catExpenses,
    });
  });

  function renderItem(itemData: {
    item: {
      cat: string;
      sumCat: number;
      color: string;
      catExpenses: ExpenseData[];
    };
    index: number;
  }) {
    const newPeriodName = processTitleStringFilteredPiecharts(
      periodName,
      tripCurrency,
      itemData
    );
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
            dayString: getCatString(itemData.item.cat) + " " + newPeriodName,
          });
        }}
      >
        <CategoryProgressBar
          color={itemData.item.color}
          cat={itemData.item.cat}
          totalCost={totalSum}
          catCost={itemData.item.sumCat}
          iconOverride={"cash-outline"}
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
    if (color_i >= colorlist?.length) {
      color_i = 0;
    }
    dataList.push({ x: item.cat, y: item.sumCat, color: item.color });
  });

  return (
    <Animated.View style={styles.container}>
      {useRowFormat && <CategoryChart inputData={dataList}></CategoryChart>}
      <Animated.FlatList
        itemLayoutAnimation={layoutAnim}
        data={catSumCat}
        renderItem={renderItem}
        keyExtractor={(item) => item.cat}
        ListHeaderComponent={
          !useRowFormat ? (
            <CategoryChart inputData={dataList}></CategoryChart>
          ) : (
            <View style={{ height: dynamicScale(100, true) }}></View>
          )
        }
        ListFooterComponent={
          <View style={{ height: dynamicScale(100, true) }}></View>
        }
        ListEmptyComponent={
          <View style={styles.fallbackTextContainer}>
            <Text>{i18n.t("fallbackTextExpenses")}</Text>
          </View>
        }
      />
      {/* <BlurPremium /> */}
    </Animated.View>
  );
};

export default ExpenseCurrencies;

ExpenseCurrencies.propTypes = {
  expenses: PropTypes.array,
  periodName: PropTypes.string,
  navigation: PropTypes.object,
  forcePortraitFormat: PropTypes.bool,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  fallbackTextContainer: {
    flex: 1,
    padding: dynamicScale(24),
    marginTop: dynamicScale(-150, true),
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryCard: {
    marginBottom: dynamicScale(20, true),
    marginHorizontal: dynamicScale(16),
    paddingBottom: dynamicScale(12, true),
    shadowColor: "#000",
    shadowOffset: {
      width: 1,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2.84,
    elevation: 5,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(10, false, 0.5),
  },
});
