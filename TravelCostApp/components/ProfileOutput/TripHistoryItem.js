import {
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
  Alert,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Updates from "expo-updates";
import * as Haptics from "expo-haptics";

import { GlobalStyles } from "../../constants/styles";
import * as Progress from "react-native-progress";
import React, { useContext, useEffect, useState } from "react";
import { TripContext } from "../../store/trip-context";
import { formatExpenseString, truncateString } from "../../util/string";
import {
  fetchTrip,
  fetchTripName,
  getAllExpenses,
  getTravellers,
  storeTravellerToTrip,
  updateTripHistory,
  updateUser,
} from "../../util/http";
import { onShare } from "./ShareTrip";
import { calcOpenSplitsTable } from "../../util/split";
import LoadingOverlay from "../UI/LoadingOverlay";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../../i18n/supportedLanguages";
import { ExpensesContext } from "../../store/expenses-context";
import { UserContext } from "../../store/user-context";
import { AuthContext } from "../../store/auth-context";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

function TripHistoryItem({ tripid, setRefreshing }) {
  const navigation = useNavigation();
  const tripCtx = useContext(TripContext);
  const expenseCtx = useContext(ExpensesContext);
  const userCtx = useContext(UserContext);
  const authCtx = useContext(AuthContext);
  const uid = authCtx.uid;
  const [travellers, setTravellers] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [tripName, setTripName] = useState(tripid);
  const [totalBudget, setTotalBudget] = useState("100");
  const [dailyBudget, setDailyBudget] = useState("10");
  const [tripCurrency, setTripCurrency] = useState("EUR");

  useEffect(() => {
    if (!tripid) return;
    async function getTrip() {
      setIsFetching(true);
      const trip = await fetchTrip(tripid);
      // console.log("getTrip ~ trip", trip);
      const _dailyBudget = trip.dailyBudget;
      const _totalBudget = trip.totalBudget;
      const _tripCurrency = trip.tripCurrency;
      setTotalBudget(_totalBudget);
      setDailyBudget(_dailyBudget);
      setTripCurrency(_tripCurrency);
      setIsFetching(false);
    }
    async function getTripTravellers() {
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
    async function getTripName() {
      const name = await fetchTripName(tripid);
      setTripName(name);
    }
    getTrip(tripid);
    getTripName();
    getTripTravellers();
  }, [tripid]);

  if (!tripid) return <Text>no id</Text>;
  if (tripid === tripCtx.tripid) {
    return <></>;
  }

  async function joinRoutine(tripid) {
    setRefreshing(true);
    setIsFetching(true);
    const trip = await fetchTrip(tripid);
    const tripData = trip;
    await updateTripHistory(uid, tripid);
    await storeTravellerToTrip(tripid, {
      userName: userCtx.userName,
      uid: uid,
    });
    updateUser(uid, {
      currentTrip: tripid,
    });
    tripCtx.setCurrentTrip(tripid, tripData);
    tripCtx.setCurrentTravellers(tripid);
    userCtx.setFreshlyCreatedTo(false);
    const expenses = await getAllExpenses(tripid, uid);
    expenseCtx.setExpenses(expenses);
    setIsFetching(false);
    setRefreshing(false);
    tripCtx.refresh();
  }

  function tripPressHandler() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (userCtx.isOnline === false) {
      Alert.alert("You are offline", "Please go online to manage your trip");
      return;
    }
    // NOTE: Android can only handle alert with 2 actions, so this needs to be changed or actions will go missing
    console.log("pressed: ", tripid);
    navigation.navigate("ManageTrip", { tripId: tripid });
  }

  const activeBorder =
    tripName === tripCtx.tripName
      ? { borderWidth: 1, borderColor: GlobalStyles.colors.primary400 }
      : {};

  // TODO: get sum
  // const activeProgress = tripCtx.totalSum / totalBudget;
  const activeProgress = 0;

  if (isFetching || (tripid && !totalBudget)) {
    return <LoadingOverlay />;
  }

  function renderTravellers(item) {
    return (
      <View style={[styles.travellerCard, GlobalStyles.strongShadow]}>
        <View style={[styles.avatar, GlobalStyles.shadowPrimary]}>
          <Text style={styles.avatarText}>
            {/* TODO: Profile Picture for now replaced with first char of the name */}
            {item.item.userName.charAt(0)}
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
      <View style={[styles.tripItem, activeBorder]}>
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.textBase, styles.description]}>
              {truncateString(tripName, 11)}
            </Text>
            <Text style={styles.textBase}>
              {i18n.t("daily")}
              {": " + dailyBudget}
              {" " + tripCurrency}
            </Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amount}>
              {totalBudget}
              {" " + tripCurrency}
            </Text>
            <Progress.Bar
              color={GlobalStyles.colors.primary500}
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

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.75,
  },
  tripItem: {
    flex: 1,
    padding: 12,
    margin: 12,
    backgroundColor: GlobalStyles.colors.gray500,
    borderRadius: 6,
    elevation: 2,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  topRow: {
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  textBase: {
    color: GlobalStyles.colors.primary500,
  },
  description: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: "bold",
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
  travellerText: {
    fontSize: 12,
    color: GlobalStyles.colors.textColor,
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
