import React, { StyleSheet, Text, View, Dimensions } from "react-native";
import * as Progress from "react-native-progress";
import { GlobalStyles } from "../../../constants/styles";
import { Ionicons } from "@expo/vector-icons";
import {
  Category,
  getCatString,
  getCatSymbolMMKV,
} from "../../../util/category";
import { useContext } from "react";
import { TripContext } from "../../../store/trip-context";
import { formatExpenseWithCurrency } from "../../../util/string";
import Animated, { ZoomIn } from "react-native-reanimated";
import PropTypes from "prop-types";
import { useEffect } from "react";
import { useState } from "react";
import { UserContext } from "../../../store/user-context";

const CategoryProgressBar = ({
  cat,
  color,
  totalCost,
  catCost,
  iconOverride,
  iconJSXOverride,
}) => {
  const tripCtx = useContext(TripContext);
  const userCtx = useContext(UserContext);
  const budgetProgress = (catCost / totalCost) * 1;

  const [catSymbol, setCatSymbol] = useState(null);
  useEffect(() => {
    async function setCatSymbolAsync() {
      const listOfCats = userCtx.catIconNames;
      if (listOfCats) {
        const categoryObj: Category = listOfCats.find(
          ({ catString }) => catString === cat
        );
        if (categoryObj?.icon) {
          setCatSymbol(categoryObj.icon);
          return;
        }
      }
      const newCatSymbol = getCatSymbolMMKV(cat);
      setCatSymbol(newCatSymbol);
      !!iconOverride && setCatSymbol(iconOverride);
    }
    setCatSymbolAsync();
  }, [cat, iconOverride, userCtx.catIconNames]);

  const budgetColor = color;
  const unfilledColor = GlobalStyles.colors.gray500Accent;

  const userCurrency = tripCtx.tripCurrency;
  const catCostString = formatExpenseWithCurrency(catCost, userCurrency);
  const windowWidth = Dimensions.get("window").width;

  if (Number.isNaN(budgetProgress)) {
    console.error("NaN budgetProgress passed to CategoryProgressBar");
    return <></>;
  }
  return (
    <Animated.View entering={ZoomIn} style={styles.container}>
      <View style={styles.titleRow}>
        {iconJSXOverride ?? (
          <Ionicons name={catSymbol} size={30} color={color} />
        )}
        <Text style={[styles.sum, { color: budgetColor, marginLeft: 8 }]}>
          {getCatString(cat)}
        </Text>
        <View style={{ flex: 1 }}></View>
        <Text style={[styles.sum, { color: GlobalStyles.colors.error300 }]}>
          {catCostString}
        </Text>
      </View>
      <Progress.Bar
        color={budgetColor}
        unfilledColor={unfilledColor}
        borderWidth={0}
        borderRadius={8}
        progress={budgetProgress}
        height={14}
        width={windowWidth - 60}
      />
    </Animated.View>
  );
};

export default CategoryProgressBar;

CategoryProgressBar.propTypes = {
  cat: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  totalCost: PropTypes.number.isRequired,
  catCost: PropTypes.number.isRequired,
  iconOverride: PropTypes.string,
  iconJSXOverride: PropTypes.element,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    paddingBottom: 12,
    marginLeft: 16,
    marginRight: 20,
    borderRadius: 6,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  period: {
    fontSize: 12,
    color: GlobalStyles.colors.primary500,
  },
  sum: {
    fontSize: 22,
    fontWeight: "300",
    color: GlobalStyles.colors.primary500,
  },
});
