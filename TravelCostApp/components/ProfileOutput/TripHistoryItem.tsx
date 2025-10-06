import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";

const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import PropTypes from "prop-types";
import { useCallback, useContext, useEffect, useState } from "react";
import * as Progress from "react-native-progress";
import { MAX_JS_NUMBER } from "../../confAppConstants";
import { GlobalStyles } from "../../constants/styles";
import { de, en, fr, ru } from "../../i18n/supportedLanguages";
import { ExpensesContext } from "../../store/expenses-context";
import { getMMKVObject, setMMKVObject } from "../../store/mmkv";
import { NetworkContext } from "../../store/network-context";
import { TripContext } from "../../store/trip-context";
import { RootNavigationProp } from "../../types/navigation";
import { daysBetween } from "../../util/date";
import safeLogError from "../../util/error";
import {
  ExpenseData,
  getAllExpensesData,
  getExpensesSum,
} from "../../util/expense";
import { TravellerNames, fetchTripName, getTravellers } from "../../util/http";
import { constantScale, dynamicScale } from "../../util/scalingUtil";
import {
  formatExpenseWithCurrency,
  truncateNumber,
  truncateString,
} from "../../util/string";
import { getTripData } from "../../util/trip";
import LoadingBarOverlay from "../UI/LoadingBarOverlay";

export type TripHistoryItemType = {
  tripid: string;
  tripName: string;
  totalBudget: string;
  dailyBudget: string;
  tripCurrency: string;
  isDynamicDailyBudget: boolean;
  startDate: string;
  endDate: string;
  travellers: string[];
  sumOfExpenses: number;
  progress: number;
  days: number;
};

function TripHistoryItem({ tripid, trips }) {
  const navigation = useNavigation<RootNavigationProp>();
  const tripCtx = useContext(TripContext);
  const expenseCtx = useContext(ExpensesContext);
  const contextTrip = tripCtx.tripid == tripid;
  const netCtx = useContext(NetworkContext);
  // list of objects containing the userName key
  const [travellers, setTravellers] = useState<{ userName: string }[]>([]);
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
      const trip: TripHistoryItemType = {
        tripid,
        tripName,
        totalBudget,
        dailyBudget,
        tripCurrency,
        isDynamicDailyBudget,
        startDate: tripCtx.startDate,
        endDate: tripCtx.endDate,
        travellers: travellers.map(t => t.userName),
        sumOfExpenses,
        progress,
        days,
      };
      setMMKVObject("tripHistoryItem" + `_${tripid}`, trip);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const trip: TripHistoryItemType = getMMKVObject(
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
      trip.travellers?.forEach(traveller => {
        travellers.push({ userName: traveller });
      });
      if (travellers.length > 0) setTravellers(travellers);
      setIsFetching(false);
    }
  }

  const handleContextTrip = useCallback(() => {
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
    tripCtx.travellers.forEach(traveller => {
      objTravellers.push({ userName: traveller });
    });
    if (objTravellers.length > 0) setTravellers(objTravellers);

    setIsFetching(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    expenseCtx.expenses.length,
    tripCtx.dailyBudget,
    tripCtx.endDate,
    tripCtx.isDynamicDailyBudget,
    tripCtx.startDate,
    tripCtx.totalBudget,
    tripCtx.travellers,
    tripCtx.tripCurrency,
    tripCtx.tripName,
  ]);

  useEffect(() => {
    if (!days || !isDynamicDailyBudget) return;
    let calcDynamicBudget = (Number(totalBudget) - sumOfExpenses) / days;
    if (isNaN(calcDynamicBudget) || calcDynamicBudget < 0)
      calcDynamicBudget = 0.01;
    setDailyBudget(calcDynamicBudget.toFixed(2));
    if (contextTrip) tripCtx.setdailyBudget(calcDynamicBudget.toFixed(2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseCtx.expenses.length, tripCtx.tripid, tripCtx.totalBudget, tripid]);

  useEffect(() => {
    if (!tripid) {
      safeLogError("no tripid");
      return;
    }

    // FUNCTION DEFINITIONS

    async function getTrip() {
      try {
        const trip = await getTripData(tripid);

        const _dailyBudget = trip.dailyBudget;
        const _totalBudget = trip.totalBudget ?? MAX_JS_NUMBER.toString();
        const _tripCurrency = trip.tripCurrency;
        const _expenses = await getAllExpensesData(tripid);
        const sumOfExpenses = getExpensesSum(_expenses);

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
        listTravellers.forEach(traveller => {
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
      setAllLoaded(true);
      setIsFetching(false);
    }

    // START OF EFFECT

    loadTripHistoryItem(tripid);
    if (contextTrip) handleContextTrip();
    if (allLoaded || contextTrip) {
      setIsFetching(false);
      return;
    }
    if (netCtx.isConnected) {
      try {
        fetchAndSetTripData();
      } catch (error) {
        safeLogError(error);
      }
    }
  }, [allLoaded, contextTrip, handleContextTrip, netCtx.isConnected, tripid]);

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
    navigation.navigate("ManageTrip", { tripId: tripid, trips });
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
            GlobalStyles.wideStrongShadow,
            styles.tripItem,
            !contextTrip && styles.inactive,
            activeBorder,
          ]}
        >
          <View style={styles.topRow}>
            <View>
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
                borderRadius={dynamicScale(8, false, 0.5)}
                progress={activeProgress}
                height={constantScale(12, 0.5)}
                width={dynamicScale(150, true, 1)}
              />
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  const dimensionChars = dynamicScale(25, false, 0.4);

  function renderTravellers(item) {
    if (!item.item?.userName) return <></>;
    return (
      <View style={[GlobalStyles.strongShadow, styles.travellerCard]}>
        <View style={[styles.avatar, GlobalStyles.shadowPrimary]}>
          <Text style={styles.avatarText}>
            {/* TODO: Profile Picture for now replaced with first char of the name */}
            {item.item?.userName?.charAt(0)}
          </Text>
        </View>
        <Text style={styles.travellerNameText}>
          {truncateString(item.item.userName, 10)}
        </Text>
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
              {`: ${dailyBudgetString}`}
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
              borderRadius={dynamicScale(8, false, 0.5)}
              progress={activeProgress}
              height={constantScale(12, 0.5)}
              width={dynamicScale(150, true, 1)}
            />
          </View>
        </View>
        <FlatList
          data={travellers}
          renderItem={renderTravellers}
          numColumns={2}
          keyExtractor={(item: { userName: string }) => {
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
  amount: {
    color: GlobalStyles.colors.primary500,
    fontSize: dynamicScale(12, false, 0.5),
    fontWeight: "bold",
  },
  amountContainer: {
    alignItems: "center",
    borderRadius: dynamicScale(4, false, 0.5),
    justifyContent: "center",
    minWidth: dynamicScale(80),
    paddingHorizontal: dynamicScale(12),
    paddingVertical: dynamicScale(4, true),
  },
  avatar: {
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.gray500,
    borderRadius: dynamicScale(60, false, 0.5),
    justifyContent: "center",
    marginRight: dynamicScale(14, false, 0.5),
    minHeight: dynamicScale(20, false, 0.5),
    minWidth: dynamicScale(20, false, 0.5),
  },
  avatarText: {
    color: GlobalStyles.colors.primary700,
    fontSize: dynamicScale(14, false, 0.5),
    fontWeight: "bold",
  },
  description: {
    fontSize: dynamicScale(16, false, 0.5),
    fontStyle: "italic",
    fontWeight: "300",
    marginBottom: dynamicScale(4, true),
    width: dynamicScale(110),
  },
  inactive: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.75,
  },
  textBase: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(14, false, 0.5),
    fontWeight: "300",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: dynamicScale(8, true),
  },
  travellerCard: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(16, false, 0.5),
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
    margin: dynamicScale(4),
    maxWidth: "45%",
    padding: dynamicScale(8, false, 0.5),
    // android styles
    ...Platform.select({
      android: {
        elevation: 0,
        backgroundColor: GlobalStyles.colors.gray300,
      },
    }),
  },
  travellerNameText: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(14, false, 0.5),
    fontWeight: "300",
  },
  tripItem: {
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: dynamicScale(12, false, 0.5),
    flex: 1,
    margin: dynamicScale(12),
    padding: dynamicScale(12),
    // android styles
    ...Platform.select({
      android: {
        elevation: 0,
      },
    }),
  },
});
