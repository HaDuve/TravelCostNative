import { StyleSheet, Text, View } from "react-native";
import * as Progress from "react-native-progress";
import { GlobalStyles } from "../../../constants/styles";
import { Ionicons } from "@expo/vector-icons";
import { getCatSymbol } from "../../../util/category";
import { useContext } from "react";
import { UserContext } from "../../../store/user-context";
import { TripContext } from "../../../store/trip-context";
import { formatExpenseString } from "../../../util/string";

const CategoryProgressBar = ({ cat, color, totalCost, catCost }) => {
  let budgetProgress = (catCost / totalCost) * 1;
  let catString = cat.slice(0, 14);
  if (cat.length > 14) catString = catString + "...";
  const budgetColor = color;
  const unfilledColor = GlobalStyles.colors.gray500;
  const icon = getCatSymbol(cat);
  const stylingSpace = "  ";
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const userCurrency = tripCtx.tripCurrency;
  const catCostString = formatExpenseString(catCost);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Ionicons name={icon} size={30} color={GlobalStyles.colors.error300} />
        <Text style={[styles.sum, { color: budgetColor }]}>
          {stylingSpace}
          {catString}
        </Text>
        <View style={{ flex: 1 }}></View>
        <Text style={[styles.sum, { color: budgetColor }]}>
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
        height={12}
        width={360}
      />
    </View>
  );
};

export default CategoryProgressBar;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
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
