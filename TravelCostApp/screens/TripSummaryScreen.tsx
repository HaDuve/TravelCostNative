/* eslint-disable react/prop-types */
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../store/user-context";
import { fetchTripName, fetchTrip, getAllExpenses } from "../util/http";
import LoadingBarOverlay from "../components/UI/LoadingBarOverlay";
import { Checkbox } from "react-native-paper";
import GradientButton from "../components/UI/GradientButton";
import { daysBetween, isToday } from "../util/date";
import { GlobalStyles } from "../constants/styles";
import FlatButton from "../components/UI/FlatButton";
import { ExpenseData, Split, getExpensesSum } from "../util/expense";
import { formatExpenseWithCurrency } from "../util/string";
import PropTypes from "prop-types";
import { TripContext } from "../store/trip-context";
import { ExpensesContext } from "../store/expenses-context";
import { getRate } from "../util/currencyExchange";
import safeLogError from "../util/error";
import {
  getMMKVObject,
  getMMKVString,
  setMMKVObject,
  setMMKVString,
} from "../store/mmkv";

export type TripAsObject = {
  tripid: string;
  tripname: string;
  selected: boolean;
};
export type TravellerAndCost = {
  traveller: string;
  cost: number;
};
export type TripsSummary = {
  numberOfTrips: number;
  totalCost: number;
  currency: string;
  travellersAndTheirCosts: TravellerAndCost[];
  numberOfCountries: number;
  numberOfDays: number;
};

const TripSummaryScreen = ({ navigation }) => {
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const expCtx = useContext(ExpensesContext);
  const [isFetching, setIsFetching] = useState(false);
  const [allTrips, setAllTrips] = useState<TripAsObject[]>([]);
  const [tripSummary, setTripSummary] = useState<TripsSummary>(null);
  const titleTextTrips =
    tripSummary?.numberOfTrips && tripSummary.numberOfTrips > 1
      ? "Trips"
      : "Trip";
  const numberOfDaysIsANumber =
    tripSummary?.numberOfDays && !isNaN(tripSummary.numberOfDays);
  useEffect(() => {
    async function asyncSetAllTrips() {
      if (!userCtx.tripHistory) return;
      const allTripsAsObjects: TripAsObject[] = [];
      const lastUpdate = getMMKVString("allTripsAsObject_CacheISODate");
      // check if lastUpdate is a iso string today
      const lastUpdateWasToday = lastUpdate && isToday(new Date(lastUpdate));
      if (lastUpdateWasToday) {
        const allTrips = getMMKVObject("allTripsAsObject");
        setAllTrips(allTrips);
        return;
      }

      setIsFetching(true);
      for (let i = 0; i < userCtx.tripHistory.length; i++) {
        const tripid = userCtx.tripHistory[i];
        const tripName = await fetchTripName(tripid);
        allTripsAsObjects.push({
          tripid: tripid,
          tripname: tripName,
          selected: true,
        });
      }
      setAllTrips(allTripsAsObjects);
      setMMKVObject("allTripsAsObject", allTripsAsObjects);
      const allTripsISODate = new Date().toISOString();
      setMMKVString("allTripsAsObject_CacheISODate", allTripsISODate);
      setIsFetching(false);
    }
    asyncSetAllTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCtx.tripHistory?.length]);

  const summarizeHandler = async () => {
    setIsFetching(true);

    // get a summary of all selected trips
    const selectedTrips = allTrips.filter((trip) => trip.selected);
    // gather all the data for tripssummary
    const numberOfTrips = selectedTrips?.length;
    let totalCost = 0;
    let currency = "";
    const travellers: string[] = [];
    const travellersAndTheirCosts: TravellerAndCost[] = [];
    const countries: string[] = [];
    let travelDays = 0;
    for (let i = 0; i < selectedTrips?.length; i++) {
      const trip = selectedTrips[i];
      const isContextTrip = trip.tripid === tripCtx.tripid;

      const tripData = isContextTrip
        ? tripCtx.getcurrentTrip()
        : await fetchTrip(trip.tripid);
      if (!tripData) continue;
      if (currency !== "" && currency !== tripData.tripCurrency) {
        // we are having diffenrent currencies that we cannot compare yet
        // cant use toast because its a modal
        Alert.alert("Please select trips with the same currency");

        continue;
      }
      currency = tripData.tripCurrency;

      const lastUpdate = getMMKVString(
        "lastUpdateISO_allExpenses_tripid" + trip.tripid
      );
      const lastUpdateWasToday = lastUpdate && isToday(new Date(lastUpdate));
      const cachedExpenses = getMMKVObject("allExpenses_tripid_" + trip.tripid);

      const expenses = isContextTrip
        ? expCtx.expenses
        : lastUpdateWasToday && cachedExpenses
        ? cachedExpenses
        : await getAllExpenses(trip.tripid);

      if (!lastUpdateWasToday) {
        // update cache
        setMMKVString(
          "lastUpdateISO_allExpenses_tripid" + trip.tripid,
          new Date().toISOString()
        );
        setMMKVObject("allExpenses_tripid_" + trip.tripid, expenses);
      }

      if (!expenses) {
        safeLogError(
          new Error(
            "expenses is null in " + trip.tripid + " in TripSummaryScreen.tsx"
          )
        );
        continue;
      }

      const sumOfExpenses = getExpensesSum(expenses);
      if (!isNaN(sumOfExpenses)) totalCost += sumOfExpenses;

      for (let i = 0; i < expenses?.length; i++) {
        const expense: ExpenseData = expenses[i];
        // map countries if not already in array
        const countryFormatted = expense.country?.toLowerCase().trim();
        if (countryFormatted && !countries.includes(countryFormatted)) {
          countries.push(countryFormatted);
        }
        if (expense.splitList && expense.splitList.length > 0) {
          const shallowCopySplitList = JSON.parse(
            JSON.stringify(expense.splitList)
          );
          // add travellers and their costs
          for (let i = 0; i < shallowCopySplitList.length; i++) {
            const split: Split = shallowCopySplitList[i];
            const traveller = split.userName;
            const travellerFormatted = traveller?.toLowerCase().trim();
            const cost = Number(split.amount);
            const calcRate = expense.calcAmount / expense.amount;
            const rate = calcRate || split.rate || 1;
            if (!travellers.includes(travellerFormatted)) {
              travellers.push(travellerFormatted);
              // add traveller and their costs
              if (!isNaN(cost * rate))
                travellersAndTheirCosts.push({
                  traveller: traveller,
                  cost: cost * rate,
                });
            } else {
              // traveller already exists, add costs
              const travellerAndCost = travellersAndTheirCosts.find(
                (t) => t.traveller === traveller
              );
              if (!isNaN(cost * rate)) travellerAndCost.cost += cost * rate;
            }
          }
        } else {
          const whoPaidFormatted = expense.whoPaid?.toLowerCase().trim();
          if (!travellers.includes(whoPaidFormatted)) {
            travellers.push(whoPaidFormatted);
            // add traveller and their costs
            travellersAndTheirCosts.push({
              traveller: expense.whoPaid,
              cost: Number(expense.calcAmount),
            });
          } else {
            // traveller already exists, add costs
            const travellerAndCost = travellersAndTheirCosts.find(
              (t) => t.traveller === expense.whoPaid
            );
            if (!isNaN(Number(expense.calcAmount)))
              travellerAndCost.cost += Number(expense.calcAmount);
          }
        }
      }
      // add number of days from daysBetween in trip
      const endDateIsFuture = new Date() < new Date(tripData.endDate);
      const startDateIsFuture = new Date() < new Date(tripData.startDate);
      const countDays = daysBetween(
        endDateIsFuture ? new Date() : new Date(tripData.endDate),
        startDateIsFuture ? new Date() : new Date(tripData.startDate)
      );
      travelDays += countDays;
    }

    setTripSummary({
      numberOfTrips: numberOfTrips,
      totalCost: +totalCost.toFixed(2),
      currency: currency,
      travellersAndTheirCosts: travellersAndTheirCosts,
      numberOfCountries: countries?.length,
      numberOfDays: travelDays,
    });
    setIsFetching(false);
  };

  function exportHandler() {
    // export to pdf or excel
  }

  function itemCheckBoxHandler(item) {
    setTripSummary(null);
    setAllTrips((prevState) => {
      const updatedTrips = prevState.map((trip) => {
        if (trip.tripid === item.item.tripid) {
          trip.selected = !trip.selected;
        }
        return trip;
      });
      return updatedTrips;
    });
  }
  if (isFetching) return <LoadingBarOverlay></LoadingBarOverlay>;
  return (
    <View>
      <Text style={styles.titleText}>Choose Trips:</Text>
      <FlatList
        data={allTrips}
        renderItem={(item) => {
          return (
            <TouchableOpacity
              onPress={itemCheckBoxHandler.bind(this, item)}
              style={[
                styles.tripItemContainer,
                item.item.selected
                  ? GlobalStyles.shadowPrimary
                  : GlobalStyles.shadow,
              ]}
            >
              <Checkbox
                color={GlobalStyles.colors.primary700}
                status={item.item.selected ? "checked" : "unchecked"}
                // onPress={itemCheckBoxHandler.bind(this, item)}
              ></Checkbox>
              <Text>{item.item.tripname}</Text>
            </TouchableOpacity>
          );
        }}
      ></FlatList>
      {tripSummary && (
        <View style={[styles.summaryContainer, GlobalStyles.shadow]}>
          <Text style={styles.titleText}>
            Summary ({tripSummary.numberOfTrips + " " + titleTextTrips})
          </Text>

          <Text style={styles.summaryText}>
            Total Costs:{" "}
            {formatExpenseWithCurrency(
              tripSummary.totalCost,
              tripSummary.currency
            )}
          </Text>
          {/* <Text style={styles.summaryText}>
            currency: {tripSummary.currency}
          </Text> */}
          <Text style={styles.summaryText}>
            Number of Countries: {tripSummary.numberOfCountries}
          </Text>
          {!!numberOfDaysIsANumber && !!tripSummary.numberOfDays && (
            <Text style={styles.summaryText}>
              Number of Days: {tripSummary.numberOfDays}
            </Text>
          )}
          {/* travellers and their costs */}
          {/* <Text style={styles.summaryText}>Travellers And Their Costs</Text> */}
          <FlatList
            data={tripSummary.travellersAndTheirCosts}
            renderItem={(item) => (
              <View style={styles.travellerCostItem}>
                <Text style={styles.summaryText}>{item.item.traveller}</Text>
                <Text>
                  {formatExpenseWithCurrency(
                    item.item.cost.toFixed(2),
                    tripSummary.currency
                  )}
                </Text>
              </View>
            )}
          ></FlatList>
        </View>
      )}
      <View style={styles.buttonContainer}>
        <FlatButton onPress={() => navigation.pop()}>Back</FlatButton>
        {!tripSummary && (
          <GradientButton
            style={styles.gradientButtonStyle}
            onPress={summarizeHandler}
          >
            Summary
          </GradientButton>
        )}
        {/* {tripSummary && (
          <GradientButton
            style={styles.gradientButtonStyle}
            onPress={exportHandler}
          >
            Export to PDF
          </GradientButton>
        )} */}
      </View>
    </View>
  );
};

export default TripSummaryScreen;

TripSummaryScreen.propTypes = {
  navigation: PropTypes.object,
};

const styles = StyleSheet.create({
  titleText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    margin: 16,
  },
  tripItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    margin: 12,
    marginHorizontal: 16,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray600,
  },
  summaryContainer: {
    padding: 10,
    margin: 16,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray600,
  },
  gradientButtonStyle: {
    margin: 16,
  },
  buttonContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  summaryText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    margin: 4,
  },
  travellerCostItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    margin: 4,
  },
});
