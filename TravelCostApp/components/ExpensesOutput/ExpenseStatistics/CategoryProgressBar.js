import { StyleSheet, Text, View } from "react-native";
import * as Progress from "react-native-progress";
import { GlobalStyles } from "../../../constants/styles";
import { Ionicons } from "@expo/vector-icons";
import { getCatSymbol } from "../../../util/category";

const CategoryProgressBar = ({ cat, color, totalCost, catCost }) => {
  let budgetProgress = (catCost / totalCost) * 1;
  const budgetColor = color;
  const unfilledColor = GlobalStyles.colors.gray500;
  const icon = getCatSymbol(cat);
  const stylingSpace = "  ";

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Ionicons name={icon} size={30} color={GlobalStyles.colors.error300} />
        <Text style={[styles.sum, { color: budgetColor }]}>
          {stylingSpace}
          {cat}
        </Text>
        <View style={{ flex: 1 }}></View>
        <Text style={[styles.sum, { color: budgetColor }]}>{catCost}$</Text>
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