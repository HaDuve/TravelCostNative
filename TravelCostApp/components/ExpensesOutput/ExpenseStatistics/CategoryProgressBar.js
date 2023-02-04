import React, { StyleSheet, Text, View, Dimensions } from "react-native";
import * as Progress from "react-native-progress";
import { GlobalStyles } from "../../../constants/styles";
import { Ionicons } from "@expo/vector-icons";
import { getCatSymbol } from "../../../util/category";
import { useContext } from "react";
import { UserContext } from "../../../store/user-context";
import { TripContext } from "../../../store/trip-context";
import { formatExpenseString, truncateString } from "../../../util/string";
import Animated, {
  FadeInRight,
  FadeInUp,
  FadeOut,
  FadeOutLeft,
} from "react-native-reanimated";

const CategoryProgressBar = ({ cat, color, totalCost, catCost }) => {
  const tripCtx = useContext(TripContext);
  let budgetProgress = (catCost / totalCost) * 1;
  if (Number.isNaN(budgetProgress)) {
    console.error("NaN budgetProgress passed to CategoryProgressBar");
    return <></>;
  }

  const widthChars = Dimensions.get("screen").width / 22;
  let catString = truncateString(cat, widthChars);
  const budgetColor = color;
  const unfilledColor = GlobalStyles.colors.gray500Accent;
  const icon = getCatSymbol(cat);
  const stylingSpace = "  ";
  const userCurrency = tripCtx.tripCurrency;
  const catCostString = formatExpenseString(catCost);
  const windowWidth = Dimensions.get("window").width;

  return (
    <Animated.View
      entering={FadeInRight.duration(1000)}
      exiting={FadeOutLeft.duration(1000)}
      style={styles.container}
    >
      <View style={styles.titleRow}>
        <Ionicons name={icon} size={30} color={color} />
        <Text style={[styles.sum, { color: budgetColor }]}>
          {stylingSpace}
          {catString}
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
    marginLeft: 24,
    marginRight: 20,
    borderRadius: 6,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleRow: {
    flex: 1,
    flexDirection: "row",
  },
  period: {
    fontSize: 12,
    color: GlobalStyles.colors.primary500,
  },
  sum: {
    fontSize: 24,
    fontWeight: "300",
    color: GlobalStyles.colors.primary500,
  },
});
