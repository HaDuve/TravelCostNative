import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text, View } from "react-native";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";

const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import { useContext } from "react";
import Animated, { Layout } from "react-native-reanimated";

import { CatColors, GlobalStyles } from "../../../constants/styles";
import { de, en, fr, ru } from "../../../i18n/supportedLanguages";
import { OrientationContext } from "../../../store/orientation-context";
import { TripContext } from "../../../store/trip-context";
import { getCatString } from "../../../util/category";
import { ExpenseData, getExpensesSum } from "../../../util/expense";
import { dynamicScale } from "../../../util/scalingUtil";
import { processTitleStringFilteredPiecharts } from "../../../util/string";
import CategoryChart from "../../ExpensesOverview/CategoryChart";

import CategoryProgressBar from "./CategoryProgressBar";

const ExpenseCurrencies = ({
  expenses,
  periodName,
  navigation,
  forcePortraitFormat,
}) => {
  const layoutAnim = Layout.damping(50).stiffness(300).overshootClamping(0.8);
  const { tripCurrency } = useContext(TripContext);
  const tripCtx = { tripCurrency };
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
      cat,
      sumCat,
      color: "",
      catExpenses,
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
            dayString: `${getCatString(itemData.item.cat)} ${newPeriodName}`,
          });
        }}
      >
        <CategoryProgressBar
          color={itemData.item.color}
          cat={itemData.item.cat}
          totalCost={totalSum}
          catCost={itemData.item.sumCat}
          iconOverride={"cash-outline"}
          iconJSXOverride={null}
        />
      </Pressable>
    );
  }

  catSumCat.sort((a, b) => b.sumCat - a.sumCat);
  dataList.sort((a, b) => b.sumCat - a.sumCat);

  const colorlist = CatColors;

  let color_i = 0;
  catSumCat.forEach(item => {
    item.color = colorlist[color_i];
    color_i++;
    if (color_i >= colorlist?.length) {
      color_i = 0;
    }
    dataList.push({ x: item.cat, y: item.sumCat, color: item.color });
  });

  return (
    <Animated.View style={styles.container}>
      {useRowFormat && (
        <CategoryChart
          inputData={dataList}
          tripCurrency={tripCtx.tripCurrency}
        ></CategoryChart>
      )}
      <Animated.FlatList
        itemLayoutAnimation={layoutAnim}
        data={catSumCat}
        renderItem={renderItem}
        keyExtractor={item => item.cat}
        ListHeaderComponent={
          !useRowFormat ? (
            <CategoryChart
              inputData={dataList}
              tripCurrency={tripCtx.tripCurrency}
            ></CategoryChart>
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

const styles = StyleSheet.create({
  categoryCard: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(10, false, 0.5),
    elevation: 5,
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
  },
  container: {
    flex: 1,
    flexDirection: "row",
  },
  fallbackTextContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "space-between",
    marginTop: dynamicScale(-150, true),
    padding: dynamicScale(24),
  },
});
