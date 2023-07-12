import {
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
  Alert,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { GlobalStyles } from "../../constants/styles";
import * as Progress from "react-native-progress";
import React, { useContext, useEffect, useState } from "react";
import { TripContext } from "../../store/trip-context";
import { formatExpenseWithCurrency, truncateString } from "../../util/string";
import {
  fetchTrip,
  fetchTripName,
  getAllExpenses,
  getTravellers,
  putTravelerInTrip,
  updateTripHistory,
  updateUser,
} from "../../util/http";
import LoadingOverlay from "../UI/LoadingOverlay";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import { ExpensesContext } from "../../store/expenses-context";
import { UserContext } from "../../store/user-context";
import { AuthContext } from "../../store/auth-context";
import PropTypes from "prop-types";
import { NetworkContext } from "../../store/network-context";
import { MAX_JS_NUMBER } from "../../confAppConstants";
import { getCurrencySymbol } from "../../util/currencySymbol";
import { ExpenseData } from "../../util/expense";
import { isForeground } from "../../util/appState";
import LoadingBarOverlay from "../UI/LoadingBarOverlay";

function TripHistoryItem({ tripid, setRefreshing, trips }) {
  const navigation = useNavigation();
  const tripCtx = useContext(TripContext);
  const expenseCtx = useContext(ExpensesContext);
  const netCtx = useContext(NetworkContext);
  const [travellers, setTravellers] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [tripName, setTripName] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [dailyBudget, setDailyBudget] = useState("");
  const [tripCurrency, setTripCurrency] = useState("");
  const [sumOfExpenses, setSumOfExpenses] = useState(0);
  const [progress, setProgress] = useState(0.5);
  const [allLoaded, setAllLoaded] = useState(false);

  // TODO: make a async store entry for tripid+all the data and preload the async data before fetching online

  useEffect(() => {
    if (allLoaded) return;
    if (!tripid) {
      console.log("no tripid in tripITEM");
      return;
    }
    async function getTrip() {
      try {
        const trip = await fetchTrip(tripid);
        // console.log("getTrip ~ trip", trip);
        const _dailyBudget = trip.dailyBudget;
        const _totalBudget = trip.totalBudget ?? MAX_JS_NUMBER.toString();
        const _tripCurrency = trip.tripCurrency;
        const _expenses = await getAllExpenses(tripid);
        const sumOfExpenses = _expenses.reduce((acc, expense: ExpenseData) => {
          if (isNaN(Number(expense.calcAmount))) return acc;
          return acc + Number(expense.calcAmount);
        }, 0);
        setTotalBudget(_totalBudget);
        setDailyBudget(_dailyBudget);
        setTripCurrency(_tripCurrency);
        setSumOfExpenses(sumOfExpenses);
        setProgress(sumOfExpenses / Number(_totalBudget));
        setIsFetching(false);
      } catch (error) {
        return;
      }
    }
    async function getTripTravellers() {
      try {
        const listTravellers = await getTravellers(tripid);
        console.log("getTripTravellers ~ listTravellers:", listTravellers);
        const objTravellers = [];
        listTravellers.forEach((traveller) => {
          objTravellers.push({ userName: traveller });
        });
        setTravellers(objTravellers);
      } catch (error) {
        return;
      }
    }
    async function getTripName() {
      try {
        const name = await fetchTripName(tripid);
        setTripName(name);
      } catch (error) {
        return;
      }
    }
    if (tripCtx.tripid == tripid) {
      setTripName(tripCtx.tripName);
      setTotalBudget(tripCtx.totalBudget);
      setDailyBudget(tripCtx.dailyBudget);
      setTripCurrency(tripCtx.tripCurrency);
      setIsFetching(false);
    }
    if (netCtx.isConnected && netCtx.strongConnection) {
      getTripName();
      getTrip();
      getTripTravellers();
      setIsFetching(false);
      setAllLoaded(true);
    }
  }, [
    tripid,
    tripName,
    expenseCtx.expenses,
    netCtx.isConnected,
    netCtx.strongConnection,
    tripCtx.tripid,
    tripCtx.travellers,
    tripCtx.tripName,
    tripCtx.totalBudget,
    tripCtx.dailyBudget,
    tripCtx.tripCurrency,
    allLoaded,
  ]);

  const totalBudgetString = formatExpenseWithCurrency(
    Number(totalBudget),
    tripCurrency
  );
  const dailyBudgetString = formatExpenseWithCurrency(
    Number(dailyBudget),
    tripCurrency
  );
  const sumOfExpensesString = formatExpenseWithCurrency(
    Number(sumOfExpenses),
    tripCurrency
  );

  const { fontScale } = useWindowDimensions();
  const megaLongText =
    dailyBudgetString.length + sumOfExpensesString.length > 22;
  const isScaledUp = fontScale > 1 || megaLongText;
  // console.log("TripHistoryItem ~ isScaledUp:", isScaledUp);

  function tripPressHandler() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!netCtx.isConnected || !netCtx.strongConnection) {
      Alert.alert(i18n.t("noConnection"), i18n.t("checkConnectionError"));
      return;
    }
    // NOTE: Android can only handle alert with 2 actions, so this needs to be changed or actions will go missing
    console.log("pressed: ", tripid);
    navigation.navigate("ManageTrip", { tripId: tripid, trips: trips });
  }

  const activeBorder =
    tripid === tripCtx.tripid
      ? { borderWidth: 1, borderColor: GlobalStyles.colors.primary400 }
      : {};

  const activeProgress = progress;
  const isOverBudget = Number(sumOfExpenses) > Number(totalBudget);

  if (!tripid) return <Text>no id</Text>;
  if (isFetching || (tripid && !totalBudget)) {
    return (
      <Pressable
        onPress={tripPressHandler}
        style={({ pressed }) => pressed && GlobalStyles.pressed}
      >
        <View
          style={[styles.tripItem, GlobalStyles.wideStrongShadow, activeBorder]}
        >
          <View style={[styles.topRow]}>
            <View>
              {/* <Text style={[styles.textBase, styles.description]}>{"..."}</Text> */}
              <LoadingBarOverlay
                size="small"
                customText=" "
                containerStyle={{
                  backgroundColor: "transparent",
                  maxHeight: 0,
                  maxWidth: 0,
                }}
              ></LoadingBarOverlay>
              <Text style={styles.textBase}>
                {i18n.t("daily")}
                {": "}
              </Text>
            </View>
            <View style={styles.amountContainer}>
              <Text
                style={[
                  styles.amount,
                  isOverBudget && { color: GlobalStyles.colors.errorGrayed },
                ]}
              >
                {"0"}/{"0"}
              </Text>
              <Progress.Bar
                color={GlobalStyles.colors.errorGrayed}
                unfilledColor={GlobalStyles.colors.gray600}
                borderWidth={0}
                borderRadius={8}
                progress={activeProgress}
                height={12}
                width={150}
              />
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  function renderTravellers(item) {
    if (!item.item?.userName) return <></>;
    return (
      <View style={[styles.travellerCard, GlobalStyles.strongShadow]}>
        <View style={[styles.avatar, GlobalStyles.shadowPrimary]}>
          <Text style={styles.avatarText}>
            {/* TODO: Profile Picture for now replaced with first char of the name */}
            {item.item?.userName?.charAt(0)}
          </Text>
        </View>
        <Text>{truncateString(item.item.userName, 10)}</Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={tripPressHandler}
      style={({ pressed }) => pressed && GlobalStyles.pressed}
    >
      <View
        style={[styles.tripItem, GlobalStyles.wideStrongShadow, activeBorder]}
      >
        <View
          style={[styles.topRow, isScaledUp && { flexDirection: "column" }]}
        >
          <View>
            <Text
              style={[
                styles.textBase,
                styles.description,
                isScaledUp && { textAlign: "center" },
              ]}
            >
              {truncateString(tripName, megaLongText ? 30 : 11)}
            </Text>
            <Text
              style={[styles.textBase, isScaledUp && { textAlign: "center" }]}
            >
              {i18n.t("daily")}
              {": " + dailyBudgetString}
            </Text>
          </View>
          <View style={styles.amountContainer}>
            <Text
              style={[
                styles.amount,
                isOverBudget && { color: GlobalStyles.colors.errorGrayed },
              ]}
            >
              {sumOfExpensesString}/{totalBudgetString}
            </Text>
            <Progress.Bar
              color={
                isOverBudget
                  ? GlobalStyles.colors.errorGrayed
                  : GlobalStyles.colors.primary500
              }
              unfilledColor={GlobalStyles.colors.gray600}
              borderWidth={0}
              borderRadius={8}
              progress={activeProgress}
              height={12}
              width={150}
            />
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

export default TripHistoryItem;

TripHistoryItem.propTypes = {
  tripid: PropTypes.string,
  setRefreshing: PropTypes.func,
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
  textBase: {
    color: GlobalStyles.colors.textColor,
    fontSize: 14,
    fontWeight: "300",
  },
  description: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: "300",
    fontStyle: "italic",
  },
  amountContainer: {
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
