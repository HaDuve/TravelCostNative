import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { useContext, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import * as Progress from "react-native-progress";
import Animated, { ZoomIn } from "react-native-reanimated";

import { GlobalStyles } from "../../../constants/styles";
import { OrientationContext } from "../../../store/orientation-context";
import { TripContext } from "../../../store/trip-context";
import { UserContext } from "../../../store/user-context";
import {
  Category,
  getCatString,
  getCatSymbolMMKV,
} from "../../../util/category";
import { constantScale, dynamicScale } from "../../../util/scalingUtil";
import { formatExpenseWithCurrency } from "../../../util/string";

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
  const { isPortrait } = useContext(OrientationContext);
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

  if (Number.isNaN(budgetProgress)) {
    console.error("NaN budgetProgress passed to CategoryProgressBar");
    return <></>;
  }
  return (
    <Animated.View entering={ZoomIn} style={styles.container}>
      <View style={styles.titleRow}>
        {iconJSXOverride ?? (
          <Ionicons
            name={catSymbol}
            size={dynamicScale(30, false, 0.5)}
            color={color}
          />
        )}
        <Text
          style={[
            styles.sum,
            { color: budgetColor, marginLeft: dynamicScale(8) },
          ]}
        >
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
        borderRadius={dynamicScale(8)}
        progress={budgetProgress}
        height={constantScale(14, 0.5)}
        width={
          isPortrait
            ? dynamicScale(292, false, 0.96)
            : dynamicScale(300, false, 0.3)
        }
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
    alignItems: "flex-start",
    borderRadius: dynamicScale(6, false, 0.5),
    flex: 1,
    justifyContent: "space-between",
    marginLeft: dynamicScale(8),
    marginRight: dynamicScale(10),
    padding: dynamicScale(8),
    paddingBottom: dynamicScale(4, true),
  },
  period: {
    color: GlobalStyles.colors.primary500,
    fontSize: dynamicScale(12, false, 0.5),
  },
  sum: {
    color: GlobalStyles.colors.primary500,
    fontSize: dynamicScale(22, false, 0.5),
    fontWeight: "300",
  },
  titleRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: dynamicScale(4, true),
  },
});
