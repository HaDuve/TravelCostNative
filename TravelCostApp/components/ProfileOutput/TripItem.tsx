import {
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { GlobalStyles } from "../../constants/styles";
import * as Progress from "react-native-progress";
import React, { useContext, useEffect, useState } from "react";
import { TripContext } from "../../store/trip-context";
import { formatExpenseWithCurrency, truncateString } from "../../util/string";
import { getTravellers } from "../../util/http";
import LoadingOverlay from "../UI/LoadingOverlay";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
import { UserContext } from "../../store/user-context";
import PropTypes from "prop-types";
import { NetworkContext } from "../../store/network-context";
import { MAX_JS_NUMBER } from "../../confAppConstants";
import { getCurrencySymbol } from "../../util/currencySymbol";
import { ExpensesContext } from "../../store/expenses-context";

const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

function TripItem({
  tripid,
  tripName,
  totalBudget,
  dailyBudget,
  tripCurrency,
  trips,
}) {
  const tripData = {
    tripid,
    tripName,
    totalBudget,
    dailyBudget,
    tripCurrency,
  };
  let infinityString = "";
  if (!totalBudget || totalBudget >= MAX_JS_NUMBER) infinityString = "∞";
  const navigation = useNavigation();
  const tripCtx = useContext(TripContext);
  const userCtx = useContext(UserContext);
  const expCtx = useContext(ExpensesContext);
  const netCtx = useContext(NetworkContext);
  const [travellers, setTravellers] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  const expensesSum = expCtx.expenses.reduce((sum, expense) => {
    if (isNaN(Number(expense.calcAmount))) return sum;
    return Number(sum + Number(expense.calcAmount));
  }, 0);
  const expensesSumString = formatExpenseWithCurrency(
    expensesSum,
    tripCurrency
  );

  const tripCurrencySymbol = getCurrencySymbol(tripCurrency);

  useEffect(() => {
    async function getTripTravellers() {
      if (!netCtx.isConnected || !netCtx.strongConnection) return;
      setIsFetching(true);
      try {
        const listTravellers = await getTravellers(tripid);
        const objTravellers = [];
        listTravellers.forEach((traveller) => {
          objTravellers.push({ userName: traveller });
        });
        setTravellers(objTravellers);
      } catch (error) {
        console.log("error caught while get Travellers!");
      }
      setIsFetching(false);
    }
    getTripTravellers();
  }, [netCtx.isConnected, netCtx.strongConnection, tripid]);

  function tripPressHandler() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!netCtx.isConnected || !netCtx.strongConnection) {
      Alert.alert("You are offline", "Please go online to manage your trip");
      return;
    }
    // NOTE: Android can only handle alert with 2 actions, so this needs to be changed or actions will go missing
    console.log("pressed: ", tripid);
    navigation.navigate("ManageTrip", { tripId: tripid, trips: trips });
  }

  const tripTotalSumString = formatExpenseWithCurrency(
    tripCtx.totalSum,
    tripCurrency
  );
  const totalBudgetString = formatExpenseWithCurrency(
    totalBudget,
    tripCurrency
  );
  const dailyBudgetString = formatExpenseWithCurrency(
    dailyBudget,
    tripCurrency
  );

  const activeBorder =
    tripName === tripCtx.tripName
      ? { borderWidth: 1, borderColor: GlobalStyles.colors.primary400 }
      : {};

  const activeProgress = expensesSum / (totalBudget ?? MAX_JS_NUMBER);

  function renderTravellers(item) {
    return (
      <View style={[styles.travellerCard, GlobalStyles.strongShadow]}>
        <View style={[styles.avatar, GlobalStyles.shadowPrimary]}>
          <Text style={styles.avatarText}>
            {/* TODO: Profile Picture for now replaced with first char of the name */}
            {item.item.userName.charAt(0)}
          </Text>
        </View>
        <Text numberOfLines={1} style={styles.textWidth}>
          {item.item.userName}
        </Text>
      </View>
    );
  }

  if (tripid && !totalBudget) {
    return (
      <View style={styles.tripItem}>
        <Text>Refresh..</Text>
      </View>
    );
  }
  // if (isFetching) {
  //   return <LoadingOverlay />;
  // }
  if (!tripid) return <Text>no id</Text>;

  return (
    <Pressable
      onPress={tripPressHandler}
      style={({ pressed }) => pressed && GlobalStyles.pressedWithShadow}
    >
      <View
        style={[styles.tripItem, GlobalStyles.wideStrongShadow, activeBorder]}
      >
        <View style={styles.topRow}>
          <View style={styles.leftContainer}>
            <Text
              numberOfLines={1}
              style={[styles.textBase, styles.description, styles.textWidth]}
            >
              {tripName}
            </Text>
            <Text style={styles.textBase}>
              {i18n.t("daily")}
              {": " + dailyBudgetString}
            </Text>
          </View>
          <View style={[styles.amountContainer, styles.rightContainer]}>
            <Text style={styles.amount}>
              {expensesSumString}
              {infinityString ? " / ∞" : " / " + totalBudgetString}
            </Text>
            {!infinityString && (
              <Progress.Bar
                color={GlobalStyles.colors.primary500}
                unfilledColor={GlobalStyles.colors.gray600}
                borderWidth={0}
                borderRadius={8}
                progress={activeProgress}
                height={12}
                width={150}
              />
            )}
          </View>
        </View>
        <FlatList
          data={travellers}
          renderItem={renderTravellers}
          numColumns={2}
          keyExtractor={(item) => {
            return item.userName + tripid;
          }}
        ></FlatList>
      </View>
    </Pressable>
  );
}

export default TripItem;

TripItem.propTypes = {
  tripid: PropTypes.string,
  tripName: PropTypes.string,
  totalBudget: PropTypes.string,
  dailyBudget: PropTypes.string,
  tripCurrency: PropTypes.string,
  trips: PropTypes.array,
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.75,
  },
  tripItem: {
    flex: 1,
    padding: 12,
    margin: 12,
    backgroundColor: "white",
    borderRadius: 12,
  },
  topRow: {
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leftContainer: {
    flex: 1,
    paddingRight: 4,
    alignItems: "flex-start",
  },
  rightContainer: {
    flex: 1,
    marginRight: -8,
    marginTop: -8,
    alignItems: "flex-end",
  },
  textBase: {
    color: GlobalStyles.colors.textColor,
    fontSize: 14,
    fontWeight: "300",
  },
  textWidth: {
    flex: 1,
    width: "100%",
  },
  description: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: "300",
    fontStyle: "italic",
  },
  amountContainer: {
    marginLeft: "-20%",
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    minWidth: 80,
  },
  amount: {
    color: GlobalStyles.colors.primary500,
    fontWeight: "bold",
  },
  travellerCard: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
    margin: 4,
    padding: 8,
    borderRadius: 16,
    maxWidth: "47%",
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  avatar: {
    minHeight: 20,
    minWidth: 20,
    borderRadius: 60,
    backgroundColor: GlobalStyles.colors.gray500,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: GlobalStyles.colors.primary700,
  },
});
