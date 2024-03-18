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
import BlurPremium from "../../Premium/BlurPremium";
import { processTitleStringFilteredPiecharts } from "../../../util/string";
import { TripContext } from "../../../store/trip-context";
import { getExpensesSum } from "../../../util/expense";
import { moderateScale, scale, verticalScale } from "../../../util/scalingUtil";
import { useOrientation } from "../../Hooks/useOrientation";

const ExpenseCategories = ({ expenses, periodName, navigation }) => {
  const layoutAnim = Layout.damping(50).stiffness(300).overshootClamping(0.8);
  const { tripCurrency } = useContext(TripContext);
  const orientation = useOrientation();
  const isPortrait = orientation === "PORTRAIT";
  if (!expenses)
    return (
      <View style={styles.container}>
        <Text>{i18n.t("fallbackTextExpenses")}</Text>
      </View>
    );

  const categoryList = [];
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

  const totalSum = getExpensesSum(expenses);

  const catSumCat = [];
  const dataList = [];

  categoryList.forEach((cat) => {
    const catExpenses = getAllExpensesWithCat(cat);
    const sumCat = getExpensesSum(catExpenses);
    catSumCat.push({
      cat: cat,
      sumCat: sumCat,
      color: "",
      catExpenses: catExpenses,
    });
  });

  function renderItem(itemData) {
    const newPeriodName = processTitleStringFilteredPiecharts(
      periodName,
      tripCurrency,
      itemData
    );
    const isShadow = itemData.item?.catExpenses[0]?.id == "shadow1";
    if (isShadow) return <></>;
    return (
      <Pressable
        style={({ pressed }) => [
          styles.categoryCard,
          pressed && GlobalStyles.pressedWithShadow,
        ]}
        onPress={() => {
          // console.log("expenses", itemData.item.catExpenses);
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
      {!isPortrait && <CategoryChart inputData={dataList}></CategoryChart>}
      <Animated.FlatList
        itemLayoutAnimation={layoutAnim}
        data={catSumCat}
        renderItem={renderItem}
        keyExtractor={(item) => item.cat}
        ListHeaderComponent={
          isPortrait ? (
            <CategoryChart inputData={dataList}></CategoryChart>
          ) : (
            <View style={{ height: verticalScale(100) }}></View>
          )
        }
        ListFooterComponent={
          <View style={{ height: verticalScale(100) }}></View>
        }
        ListEmptyComponent={
          <View style={styles.fallbackTextContainer}>
            <Text style={{ marginVertical: 12 }}>
              {i18n.t("fallbackTextExpenses")}
            </Text>
          </View>
        }
      />
      <BlurPremium />
    </Animated.View>
  );
};

export default ExpenseCategories;

ExpenseCategories.propTypes = {
  expenses: PropTypes.array,
  periodName: PropTypes.string,
  navigation: PropTypes.object,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  fallbackTextContainer: {
    flex: 1,
    padding: scale(24),
    marginTop: verticalScale(-150),
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryCard: {
    marginBottom: verticalScale(20),
    marginHorizontal: scale(16),
    paddingBottom: verticalScale(12),
    shadowColor: "#000",
    shadowOffset: {
      width: 1,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2.84,
    elevation: 5,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: moderateScale(10),
  },
});
