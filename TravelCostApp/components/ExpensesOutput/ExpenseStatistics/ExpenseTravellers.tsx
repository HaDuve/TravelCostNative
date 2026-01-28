import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

import React, { useCallback, useContext, useMemo } from "react";
import CategoryProgressBar from "./CategoryProgressBar";
import { CatColors, GlobalStyles } from "../../../constants/styles";
import CategoryChart from "../../ExpensesOverview/CategoryChart";
import Animated, { Layout } from "react-native-reanimated";

import { i18n } from "../../../i18n/i18n";

import { getCatLocalized } from "../../../util/category";
import PropTypes from "prop-types";
import {
  ExpenseData,
  getExpensesSum,
  getTravellerSum,
} from "../../../util/expense";
import { TripContext } from "../../../store/trip-context";
import BlurPremium from "../../Premium/BlurPremium";
import { processTitleStringFilteredPiecharts } from "../../../util/string";
import { dynamicScale } from "../../../util/scalingUtil";
import { OrientationContext } from "../../../store/orientation-context";

const ExpenseTravellers = ({
  expenses,
  periodName,
  navigation,
  forcePortraitFormat = false,
}) => {
  const layoutAnim = useMemo(
    () => Layout.damping(50).stiffness(300).overshootClamping(0.8),
    []
  );
  const { tripCurrency } = useContext(TripContext);
  const { isPortrait } = useContext(OrientationContext);
  const useRowFormat = !isPortrait && !forcePortraitFormat;
  const totalSum = useMemo(
    () => (expenses ? getExpensesSum(expenses) : 0),
    [expenses]
  );

  const { catSumCat, dataList } = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return { catSumCat: [], dataList: [] };
    }

    const travellerMap = new Map<string, ExpenseData[]>();
    expenses.forEach((expense: ExpenseData) => {
      const hasSplits = expense.splitList && expense.splitList.length !== 0;
      if (hasSplits && expense.splitList) {
        expense.splitList.forEach((split) => {
          const travellerName = split.userName;
          const existing = travellerMap.get(travellerName);
          if (existing) {
            existing.push(expense);
          } else {
            travellerMap.set(travellerName, [expense]);
          }
        });
      } else {
        const travellerName = expense.whoPaid;
        const existing = travellerMap.get(travellerName);
        if (existing) {
          existing.push(expense);
        } else {
          travellerMap.set(travellerName, [expense]);
        }
      }
    });

    const catSumCat = Array.from(travellerMap.entries()).map(
      ([traveller, catExpenses]) => ({
        cat: traveller,
        sumCat: Number(getTravellerSum(catExpenses, traveller)),
        color: "",
        catExpenses,
      })
    );

    catSumCat.sort((a, b) => b.sumCat - a.sumCat);

    const colorlist = CatColors;
    const dataList = catSumCat.map((item, index) => {
      const color = colorlist[index % colorlist.length];
      item.color = color;
      return { x: item.cat, y: item.sumCat, color };
    });

    return { catSumCat, dataList };
  }, [expenses]);

  const renderItem = useCallback((itemData) => {
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
            dayString: getCatLocalized(itemData.item.cat) + " " + newPeriodName,
            showSumForTravellerName: itemData.item.cat,
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
  }, [navigation, periodName, totalSum, tripCurrency]);

  if (!expenses)
    return (
      <View style={styles.container}>
        <Text>{i18n.t("fallbackTextExpenses")}</Text>
      </View>
    );

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

export default ExpenseTravellers;

ExpenseTravellers.propTypes = {
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
