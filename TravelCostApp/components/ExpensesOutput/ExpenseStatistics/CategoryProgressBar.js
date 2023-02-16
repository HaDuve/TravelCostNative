import React, { StyleSheet, Text, View, Dimensions } from "react-native";
import * as Progress from "react-native-progress";
import { GlobalStyles } from "../../../constants/styles";
import { Ionicons } from "@expo/vector-icons";
import { getCatString, getCatSymbol } from "../../../util/category";
import { useContext } from "react";
import { UserContext } from "../../../store/user-context";
import { TripContext } from "../../../store/trip-context";
import { formatExpenseString, truncateString } from "../../../util/string";
import Animated, {
  FadeInRight,
  FadeInUp,
  FadeOut,
  FadeOutLeft,
  Layout,
} from "react-native-reanimated";

const CategoryProgressBar = ({ cat, color, totalCost, catCost }) => {
  const tripCtx = useContext(TripContext);
  let budgetProgress = (catCost / totalCost) * 1;
  if (Number.isNaN(budgetProgress)) {
    console.error("NaN budgetProgress passed to CategoryProgressBar");
    return <></>;
  }
  const budgetColor = color;
  const unfilledColor = GlobalStyles.colors.gray500Accent;
  const icon = getCatSymbol(cat);
  const userCurrency = tripCtx.tripCurrency;
  const catCostString = formatExpenseString(catCost);
  const windowWidth = Dimensions.get("window").width;

  return (
    <Animated.View entering={FadeInRight} style={styles.container}>
      <View style={styles.titleRow}>
        <Ionicons name={icon} size={30} color={color} />
        <Text style={[styles.sum, { color: budgetColor, marginLeft: 8 }]}>
          {getCatString(cat)}
        </Text>
        <View style={{ flex: 1 }}></View>
        <Text style={[styles.sum, { color: GlobalStyles.colors.error300 }]}>
          {catCostString}
          {userCurrency}
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
