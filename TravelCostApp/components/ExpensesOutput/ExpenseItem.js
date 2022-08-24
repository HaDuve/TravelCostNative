import { Pressable, StyleSheet, Text, View, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { GlobalStyles } from "../../constants/styles";
import { getFormattedDate, toShortFormat } from "../../util/date";
import { Ionicons } from "@expo/vector-icons";
import { getCatSymbol } from "../../util/category";
import { G } from "react-native-svg";

function ExpenseItem({ id, description, amount, date, category }) {
  const navigation = useNavigation();

  function expensePressHandler() {
    navigation.navigate("ManageExpense", {
      expenseId: id,
    });
  }

  const iconString = getCatSymbol(category);

  return (
    <Pressable
      onPress={expensePressHandler}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <View style={styles.expenseItem}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={iconString}
            size={28}
            color={GlobalStyles.colors.textColor}
          />
        </View>
        <View style={styles.leftItem}>
          <Text style={[styles.textBase, styles.description]}>
            {description}
          </Text>
          <Text style={[styles.textBase, styles.secondaryText]}>
            {toShortFormat(date)}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>{amount.toFixed(2)}$</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default ExpenseItem;

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.75,
  },
  expenseItem: {
    padding: 8,
    marginLeft: 8,
    marginRight: -8,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  textBase: {
    marginLeft: 4,
    color: GlobalStyles.colors.textColor,
  },
  description: {
    fontStyle: "italic",
    fontWeight: "300",
    fontSize: 15,
  },
  secondaryText: {
    color: GlobalStyles.colors.gray700,
    fontSize: 13,
  },
  iconContainer: {
    marginTop: 4,
    marginRight: 8,
    marginLeft: -12,
  },
  leftItem: {
    flex: 1,
  },
  amountContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    minWidth: 80,
  },
  amount: {
    fontSize: 20,
    fontWeight: "300",
    color: GlobalStyles.colors.error300,
  },
});
