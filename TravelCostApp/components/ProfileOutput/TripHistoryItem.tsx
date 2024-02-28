import {
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
  Alert,
  useWindowDimensions,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { GlobalStyles } from "../../constants/styles";
import * as Progress from "react-native-progress";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { TripContext } from "../../store/trip-context";
import {
  formatExpenseWithCurrency,
  truncateString,
  truncateNumber,
} from "../../util/string";
import {
  TravellerNames,
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
import { daysBetween } from "../../util/date";
import set from "react-native-reanimated";
import { getMMKVObject, setMMKVObject } from "../../store/mmkv";
import safeLogError from "../../util/error";

export type TripHistoryItem = {
  tripid: string;
  tripName: string;
  totalBudget: string;
  dailyBudget: string;
  tripCurrency: string;
  isDynamicDailyBudget: boolean;
  startDate: string;
  endDate: string;
  travellers: TravellerNames[];
  sumOfExpenses: number;
  progress: number;
  days: number;
};

function TripHistoryItem({ tripid, trips }) {
  const navigation = useNavigation();
  const tripCtx = useContext(TripContext);
  const expenseCtx = useContext(ExpensesContext);
  const contextTrip = tripCtx.tripid == tripid;
  const netCtx = useContext(NetworkContext);
  // list of objects containing the userName key
  const [travellers, setTravellers] = useState<TravellerNames[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [tripName, setTripName] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [dailyBudget, setDailyBudget] = useState("");
  const [tripCurrency, setTripCurrency] = useState("");
  const [sumOfExpenses, setSumOfExpenses] = useState(0);
  const [progress, setProgress] = useState(0);
  const [allLoaded, setAllLoaded] = useState(false);
  const [isDynamicDailyBudget, setIsDynamicDailyBudget] = useState(false);
  const [days, setDays] = useState(0);

  const storeTripHistoryItem = useCallback(
    (tripid: string) => {
      if (!tripid) return;
      const trip: TripHistoryItem = {
        tripid: tripid,
        tripName: tripName,
        totalBudget: totalBudget,
        dailyBudget: dailyBudget,
        tripCurrency: tripCurrency,
        isDynamicDailyBudget: isDynamicDailyBudget,
        startDate: tripCtx.startDate,
        endDate: tripCtx.endDate,
        travellers: travellers,
        sumOfExpenses: sumOfExpenses,
        progress: progress,
        days: days,
      };
      setMMKVObject("tripHistoryItem" + `_${tripid}`, trip);
    },
    [
      dailyBudget,
      days,
      isDynamicDailyBudget,
      progress,
      sumOfExpenses,
      totalBudget,
      travellers.length,
      tripCtx.endDate,
      tripCtx.startDate,
      tripCurrency,
      tripName,
    ]
  );

  function loadTripHistoryItem(tripid: string) {
    const trip: TripHistoryItem = getMMKVObject(
      "tripHistoryItem" + `_${tripid}`
    );
    if (trip) {
      setTripName(trip.tripName);
      setTotalBudget(trip.totalBudget);
      setDailyBudget(trip.dailyBudget);
      setTripCurrency(trip.tripCurrency);
      setIsDynamicDailyBudget(trip.isDynamicDailyBudget);
      setSumOfExpenses(trip.sumOfExpenses);
      setProgress(trip.progress);
      setDays(trip.days);
      const travellers = [];
      trip.travellers?.forEach((traveller) => {
        travellers.push(traveller);
      });
      if (travellers.length > 0) setTravellers(travellers);
      setIsFetching(false);
    }
  }

  useEffect(() => {
    if (!days || !isDynamicDailyBudget) return;
    let calcDynamicBudget = (Number(totalBudget) - sumOfExpenses) / days;
    if (isNaN(calcDynamicBudget) || calcDynamicBudget < 0)
      calcDynamicBudget = 0.01;
    setDailyBudget(calcDynamicBudget.toFixed(2));
    if (contextTrip) tripCtx.setdailyBudget(calcDynamicBudget.toFixed(2));
  }, [
    sumOfExpenses,
    totalBudget,
    days,
    isDynamicDailyBudget,
    tripCtx.dailyBudget,
    tripCtx.tripid,
    tripid,
  ]);

  useEffect(() => {
    if (tripid != tripCtx.tripid) return;
    // calc expenses sum
    const _expenses = expenseCtx.expenses;
    const _expensesSum = _expenses.reduce(
      (sum: number, expense: ExpenseData) => {
        if (isNaN(Number(expense.calcAmount))) return sum;
        return sum + Number(expense.calcAmount);
      },
      0
    );
    const newProgress = _expensesSum / Number(tripCtx.totalBudget);
    if (isNaN(newProgress) || newProgress > 1) {
      setProgress(1);
    } else {
      setProgress(newProgress);
    }
    setSumOfExpenses(_expensesSum);
  }, [expenseCtx.expenses.length, tripCtx.tripid, tripCtx.totalBudget, tripid]);

  useEffect(() => {
    if (!tripid) {
      safeLogError("no tripid");
      return;
    }

    // FUNCTION DEFINITIONS

    async function getTrip() {
      try {
        const trip = await fetchTrip(tripid);
        const _dailyBudget = trip.dailyBudget;
        const _totalBudget = trip.totalBudget ?? MAX_JS_NUMBER.toString();
        const _tripCurrency = trip.tripCurrency;
        const _expenses = await getAllExpenses(tripid);
        const sumOfExpenses = _expenses.reduce((acc, expense: ExpenseData) => {
          if (isNaN(Number(expense.calcAmount))) return acc;
          return acc + Number(expense.calcAmount);
        }, 0);
        const isDynamic = trip.isDynamicDailyBudget;
        setIsDynamicDailyBudget(isDynamic);
        const startDate = trip.startDate;
        const endDate = trip.endDate;
        const days = daysBetween(new Date(endDate), new Date(startDate));
        setDays(days);

        setTotalBudget(_totalBudget);
        setDailyBudget(_dailyBudget);
        setTripCurrency(_tripCurrency);
        setSumOfExpenses(sumOfExpenses);
        const newProgress = sumOfExpenses / Number(_totalBudget);
        if (isNaN(newProgress) || newProgress > 1) {
          setProgress(1);
        } else {
          setProgress(newProgress);
        }

        setIsFetching(false);
      } catch (error) {
        return;
      }
    }
    async function getTripTravellers() {
      try {
        const listTravellers: TravellerNames = await getTravellers(tripid);
        const objTravellers = [];
        listTravellers.forEach((traveller) => {
          objTravellers.push({ userName: traveller });
        });
        if (objTravellers.length > 0) setTravellers(objTravellers);
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

    async function fetchAndSetTripData() {
      await getTripName();
      await getTrip();
      await getTripTravellers();
    }

    function handleContextTrip() {
      const isDynamic = tripCtx.isDynamicDailyBudget;
      setIsDynamicDailyBudget(isDynamic);
      setTripName(tripCtx.tripName);
      setTotalBudget(tripCtx.totalBudget);

      setTripCurrency(tripCtx.tripCurrency);
      const _expenses = expenseCtx.expenses;
      const sumOfExpenses = _expenses.reduce((acc, expense: ExpenseData) => {
        if (isNaN(Number(expense.calcAmount))) return acc;
        return acc + Number(expense.calcAmount);
      }, 0);
      const newProgress = sumOfExpenses / Number(tripCtx.totalBudget);
      if (isNaN(newProgress) || newProgress > 1) {
        setProgress(1);
      } else {
        setProgress(newProgress);
      }
      const days = daysBetween(
        new Date(tripCtx.endDate),
        new Date(tripCtx.startDate)
      );
      setDays(days);
      setSumOfExpenses(sumOfExpenses);
      const dynamicDailyBudget = (
        (+tripCtx.totalBudget - sumOfExpenses) /
        days
      ).toFixed(2);
      // dont allow negative daily budget
      if (isDynamic && Number(dynamicDailyBudget) < 0) setDailyBudget("0.01");
      else setDailyBudget(isDynamic ? dynamicDailyBudget : tripCtx.dailyBudget);
      const objTravellers = [];
      tripCtx.travellers.forEach((traveller) => {
        objTravellers.push({ userName: traveller });
      });
      if (objTravellers.length > 0) setTravellers(objTravellers);

      setIsFetching(false);
    }

    // START OF EFFECT

    loadTripHistoryItem(tripid);
    if (contextTrip) handleContextTrip();
    if (allLoaded || contextTrip) return;
    if (netCtx.isConnected && netCtx.strongConnection) {
      try {
        fetchAndSetTripData();
        setAllLoaded(true);
      } catch (error) {
        safeLogError(error);
      }
      setIsFetching(false);
    }
  }, [
    tripid,
    tripName,
    expenseCtx.expenses.length,
    netCtx.isConnected,
    tripCtx.tripid,
    tripCtx.travellers.length,
    tripCtx.tripName,
    tripCtx.totalBudget,
    tripCtx.dailyBudget,
    tripCtx.tripCurrency,
    tripCtx.isDynamicDailyBudget,
    tripCtx.startDate,
    tripCtx.endDate,
    allLoaded,
    contextTrip,
    netCtx.strongConnection,
  ]);

  useEffect(() => {
    if (allLoaded) storeTripHistoryItem(tripid);
  }, [allLoaded, storeTripHistoryItem, tripid]);

  const noTotalBudget =
    !totalBudget ||
    totalBudget == "0" ||
    totalBudget == "" ||
    isNaN(Number(totalBudget)) ||
    totalBudget >= MAX_JS_NUMBER.toString();
  const totalBudgetString = noTotalBudget
    ? "∞"
    : formatExpenseWithCurrency(
        truncateNumber(Number(totalBudget)),
        tripCurrency
      );
  const dailyBudgetString = formatExpenseWithCurrency(
    truncateNumber(Number(dailyBudget)),
    tripCurrency
  );
  const sumOfExpensesString = formatExpenseWithCurrency(
    truncateNumber(Number(sumOfExpenses)),
    tripCurrency
  );

  const { fontScale } = useWindowDimensions();
  const megaLongText =
    dailyBudgetString?.length + sumOfExpensesString?.length > 22;
  const isScaledUp = fontScale > 1 || megaLongText;

  function tripPressHandler() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!netCtx.isConnected || !netCtx.strongConnection) {
      Alert.alert(i18n.t("noConnection"), i18n.t("checkConnectionError"));
      return;
    }
    navigation.navigate("ManageTrip", { tripId: tripid, trips: trips });
  }

  const activeBorder = contextTrip
    ? { borderWidth: 1, borderColor: GlobalStyles.colors.primary400 }
    : {};

  const activeProgress = progress;
  const isOverBudget = noTotalBudget
    ? false
    : Number(sumOfExpenses) > Number(totalBudget);

  if (!tripid) return <Text>no id</Text>;
  if (isFetching || (tripid && !totalBudget)) {
    return (
      <Pressable
        onPress={tripPressHandler}
        style={({ pressed }) => pressed && GlobalStyles.pressed}
      >
        <View
          style={[
            styles.tripItem,
            GlobalStyles.wideStrongShadow,
            !contextTrip && styles.inactive,
            activeBorder,
          ]}
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

  const dimensionChars = Dimensions.get("window").width / 20;

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
        style={[
          styles.tripItem,
          !contextTrip && styles.inactive,
          GlobalStyles.wideStrongShadow,
          activeBorder,
        ]}
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
              {truncateString(tripName, dimensionChars)}
            </Text>
            <Text
              style={[styles.textBase, isScaledUp && { textAlign: "center" }]}
            >
              {i18n.t("daily") + (isDynamicDailyBudget ? "*" : "")}
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
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: 12,
  },
  inactive: {
    opacity: 0.7,
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
