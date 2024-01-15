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
import { daysBetween } from "../util/date";
import { set } from "react-native-reanimated";
import { GlobalStyles } from "../constants/styles";
import BackButton from "../components/UI/BackButton";
import FlatButton from "../components/UI/FlatButton";
import { ExpenseData, Split } from "../util/expense";
import { formatExpenseWithCurrency } from "../util/string";
import { Traveller } from "../util/traveler";
import { Toast } from "react-native-toast-message/lib/src/Toast";

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
  // console.log("TripSummaryScreen");
  // console.log("userCtx.tripHistory:", userCtx.tripHistory);
  const [isFetching, setIsFetching] = useState(false);
  const [allTrips, setAllTrips] = useState<TripAsObject[]>([]);
  const [tripSummary, setTripSummary] = useState<TripsSummary>(null);
  const titleTextTrips =
    tripSummary?.numberOfTrips && tripSummary.numberOfTrips > 1
      ? "Trips"
      : "Trip";

  useEffect(() => {
    async function asyncSetAllTrips() {
      if (!userCtx.tripHistory) return;
      const allTripsAsObjects: TripAsObject[] = [];

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
      setIsFetching(false);
    }
    asyncSetAllTrips();
  }, [userCtx.tripHistory?.length]);

  const summarizeHandler = async () => {
    setIsFetching(true);
    // get a summary of all selected trips
    const selectedTrips = allTrips.filter((trip) => trip.selected);
    // console.log("selectedTrips:", selectedTrips);
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

      const tripData = await fetchTrip(trip.tripid);
      if (!tripData) continue;
      if (currency !== "" && currency !== tripData.tripCurrency) {
        // we are having diffenrent currencies that we cannot compare yet
        // cant use toast because its a modal
        Alert.alert("Please select trips with the same currency");

        continue;
      }
      currency = tripData.tripCurrency;

      // console log all keys from tripdata
      for (const key in tripData) {
        // console.log("summarizeHandler ~ key:", key);
      }

      const expenses = await getAllExpenses(trip.tripid);
      const sumOfExpenses = expenses.reduce((acc, expense: ExpenseData) => {
        if (isNaN(Number(expense.calcAmount))) return acc;
        return acc + Number(expense.calcAmount);
      }, 0);
      totalCost += sumOfExpenses;

      for (let i = 0; i < expenses?.length; i++) {
        const expense = expenses[i];
        // map countries if not already in array
        if (!countries.includes(expense.country)) {
          countries.push(expense.country);
        }
        if (expense.splitList && expense.splitList.length > 0) {
          // add travellers and their costs
          for (let i = 0; i < expense.splitList.length; i++) {
            const split: Split = expense.splitList[i];
            const traveller = split.userName;
            const cost = Number(split.amount);
            const rate = split.rate ?? 1;
            if (!travellers.includes(traveller)) {
              travellers.push(traveller);
              // add traveller and their costs
              travellersAndTheirCosts.push({
                traveller: traveller,
                cost: cost / rate,
              });
            } else {
              // traveller already exists, add costs
              const travellerAndCost = travellersAndTheirCosts.find(
                (t) => t.traveller === traveller
              );
              travellerAndCost.cost += cost / rate;
            }
          }
        } else {
          if (!travellers.includes(expense.whoPaid)) {
            travellers.push(expense.whoPaid);
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
            travellerAndCost.cost += Number(expense.calcAmount);
          }
        }
      }
      // add number of days from daysBetween in trip
      travelDays += daysBetween(
        new Date(tripData.endDate),
        new Date(tripData.startDate)
      );
    }
    // set state
    // console.log("summarizeHandler ~ totalCost:", totalCost);
    // sum up all travellers costs

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
          <Text style={styles.summaryText}>
            Number of Days: {tripSummary.numberOfDays}
          </Text>
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
