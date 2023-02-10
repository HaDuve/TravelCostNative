import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import PropTypes from "prop-types";

import { GlobalStyles } from "../../constants/styles";
import { toShortFormat } from "../../util/date";
import { Ionicons } from "@expo/vector-icons";
import { getCatSymbol } from "../../util/category";
import { memo, useContext, useCallback } from "react";
import { UserContext } from "../../store/user-context";
import { TripContext } from "../../store/trip-context";
import { formatExpenseString, truncateString } from "../../util/string";
import React from "react";

import Animated, {
  SlideInUp,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  CurvedTransition,
} from "react-native-reanimated";
import { FlatList } from "react-native-gesture-handler";

function ExpenseItem(props): JSX.Element {
  const {
    id,
    description,
    amount,
    date,
    category,
    whoPaid,
    currency,
    calcAmount,
    splitList,
  } = props;
  console.log("ExpenseItem ~ props", props);
  const navigation = useNavigation();
  const TripCtx = useContext(TripContext);
  const homeCurrency = TripCtx.tripCurrency;
  const calcAmountString = formatExpenseString(calcAmount);
  const amountString = formatExpenseString(amount);
  const widthInChars = parseInt(
    (Dimensions.get("window").width / 17).toString()
  );
  const descriptionString = truncateString(description, widthInChars);
  const iconString = getCatSymbol(category);
  const sameCurrency = homeCurrency === currency;

  const memoizedCallback = useCallback(
    () =>
      navigation.navigate("ManageExpense", {
        expenseId: id,
      }),
    []
  );
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

  const longList =
    splitList && splitList.length > 2 ? splitList.slice(0, 2) : null;
  longList?.push({ userName: "+" });
  const sharedList =
    splitList && splitList.length > 0 ? (
      <View>
        <FlatList
          data={longList ? longList : splitList}
          horizontal={true}
          renderItem={({ item }) => (
            <View
              style={[styles.avatar, GlobalStyles.shadow, { marginBottom: 16 }]}
            >
              <Text style={styles.avatarText}>{item.userName.slice(0, 1)}</Text>
            </View>
          )}
          contentContainerStyle={styles.avatarContainer}
          keyExtractor={(item) => item + Math.random()}
        ></FlatList>
      </View>
    ) : (
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, GlobalStyles.shadow]}>
          <Text style={styles.avatarText}>{whoPaid.slice(0, 1)}</Text>
        </View>
      </View>
    );

  if (!id) return <></>;
  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft}>
      <Pressable
        onPress={memoizedCallback}
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
              {truncateString(descriptionString, 16)}
            </Text>
            <Text style={[styles.textBase, styles.secondaryText]}>
              {toShortFormat(date)}
            </Text>
          </View>
          <View>{sharedList}</View>
          <View style={styles.amountContainer}>
            <Text style={styles.amount}>
              {calcAmountString}
              {homeCurrency}
            </Text>
            {originalCurrency}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
export default memo(ExpenseItem);

ExpenseItem.propTypes = {
  id: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  category: PropTypes.string.isRequired,
  whoPaid: PropTypes.string.isRequired,
  currency: PropTypes.string.isRequired,
  calcAmount: PropTypes.number.isRequired,
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.75,
  },
  expenseItem: {
    borderWidth: 0,
    borderColor: "black",
    padding: 8,
    paddingRight: 28,
    marginLeft: 28,
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
    minWidth: 100,
    maxWidth: 100,
    textAlign: "right",
    fontSize: 20,
    fontWeight: "300",
    color: GlobalStyles.colors.error300,
  },
  originalCurrencyText: {
    fontSize: 12,
    fontWeight: "300",
  },
  avatarContainer: {
    maxWidth: 50,
    minWidth: 50,
    paddingTop: 8,
    paddingRight: 18,
    // center items left
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  avatar: {
    marginRight: -6,
    minHeight: 20,
    minWidth: 20,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.primary700,
    backgroundColor: GlobalStyles.colors.gray500,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: GlobalStyles.colors.primary700,
  },
});
