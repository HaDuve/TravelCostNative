import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import * as Haptics from "expo-haptics";

import React, { useContext, useMemo } from "react";
import CategoryProgressBar from "./CategoryProgressBar";
import { CatColors, GlobalStyles } from "../../../constants/styles";
import CategoryChart from "../../ExpensesOverview/CategoryChart";
import Animated, { Layout } from "react-native-reanimated";

import { i18n } from "../../../i18n/i18n";

import { getCatLocalized } from "../../../util/category";
import PropTypes from "prop-types";
import { processTitleStringFilteredPiecharts } from "../../../util/string";
import { TripContext } from "../../../store/trip-context";
import { getExpensesSum } from "../../../util/expense";
import { dynamicScale } from "../../../util/scalingUtil";
import { OrientationContext } from "../../../store/orientation-context";

const ExpenseCategories = ({
  expenses,
  periodName,
  navigation,
  forcePortraitFormat = false,
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

  const { catSumCat, dataList } = useMemo(() => {
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

    catSumCat.sort((a, b) => b.sumCat - a.sumCat);

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

    return { catSumCat, dataList };
  }, [expenses, categoryList]);

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
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate("FilteredExpenses", {
            expenses: itemData.item.catExpenses,
            dayString: getCatLocalized(itemData.item.cat) + " " + newPeriodName,
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

  return (
    <Animated.View style={styles.container}>
      {useRowFormat && (
        <CategoryChart
          inputData={dataList}
          tripCurrency={tripCurrency}
          expenses={expenses}
          periodName={periodName}
          navigation={navigation}
        ></CategoryChart>
      )}
      <Animated.FlatList
        itemLayoutAnimation={layoutAnim}
        data={catSumCat}
        renderItem={renderItem}
        keyExtractor={(item) => item.cat}
        ListHeaderComponent={
          !useRowFormat ? (
            <CategoryChart
              inputData={dataList}
              tripCurrency={tripCurrency}
              expenses={expenses}
              periodName={periodName}
              navigation={navigation}
            ></CategoryChart>
          ) : (
            <View style={{ height: dynamicScale(100, true) }}></View>
          )
        }
        ListFooterComponent={
          <View style={{ height: dynamicScale(100, true) }}></View>
        }
        ListEmptyComponent={
          <View style={[isPortrait && styles.fallbackTextContainer]}>
            <Text
              style={{
                marginVertical: 12,
                fontSize: dynamicScale(14, false, 0.5),
              }}
            >
              {i18n.t("fallbackTextExpenses")}
            </Text>
          </View>
        }
      />
    </Animated.View>
  );
};

export default ExpenseCategories;

ExpenseCategories.propTypes = {
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
