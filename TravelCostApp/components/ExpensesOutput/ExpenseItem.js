import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import { GlobalStyles } from "../../constants/styles";
import { toShortFormat } from "../../util/date";
import { Ionicons } from "@expo/vector-icons";
import { getCatSymbol } from "../../util/category";
import { useContext } from "react";
import { UserContext } from "../../store/user-context";
import { TripContext } from "../../store/trip-context";
import { formatExpenseString, truncateString } from "../../util/string";

function ExpenseItem({
  id,
  description,
  amount,
  date,
  category,
  whoPaid,
  currency,
  calcAmount,
}) {
  const navigation = useNavigation();

  const TripCtx = useContext(TripContext);
  const homeCurrency = TripCtx.tripCurrency;

  const calcAmountString = formatExpenseString(calcAmount);
  const amountString = formatExpenseString(amount);

  const widthInChars = parseInt(Dimensions.get("window").width / 13);
  const descriptionString = truncateString(description, widthInChars);

  function expensePressHandler() {
    navigation.navigate("ManageExpense", {
      expenseId: id,
    });
  }

  const iconString = getCatSymbol(category);

  const sameCurrency = homeCurrency === currency;
  const originalCurrency = !sameCurrency ? (
    <>
      <Text style={styles.originalCurrencyText}>
        {amountString}
        {currency}
      </Text>
    </>
  ) : (
    <></>
  );

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
            {descriptionString}
          </Text>
          <Text style={[styles.textBase, styles.secondaryText]}>
            {toShortFormat(date)}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>
            {calcAmountString}
            {homeCurrency}
          </Text>
          {originalCurrency}
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
    paddingHorizontal: 4,
    paddingVertical: 0,
    backgroundColor: GlobalStyles.colors.backgroundColor,
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
  originalCurrencyText: {
    fontSize: 12,
    fontWeight: "300",
  },
});
