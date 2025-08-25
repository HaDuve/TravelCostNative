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
import { fetchTripName } from "../util/http";
import LoadingBarOverlay from "../components/UI/LoadingBarOverlay";
import { Checkbox } from "react-native-paper";
import { daysBetween, isToday } from "../util/date";
import { GlobalStyles } from "../constants/styles";
import FlatButton from "../components/UI/FlatButton";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { de, en, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = ((Localization.getLocales()[0]&&Localization.getLocales()[0].languageCode)?Localization.getLocales()[0].languageCode.slice(0,2):'en');
i18n.enableFallback = true;
// i18n.locale = "en";

import {
  ExpenseData,
  Split,
  getAllExpensesData,
  getExpensesSum,
} from "../util/expense";
import { formatExpenseWithCurrency } from "../util/string";
import PropTypes from "prop-types";
import { TripContext, TripData } from "../store/trip-context";
import { ExpensesContext } from "../store/expenses-context";
import safeLogError from "../util/error";
import {
  getMMKVObject,
  getMMKVString,
  setMMKVObject,
  setMMKVString,
} from "../store/mmkv";
import { getTripData } from "../util/trip";
import * as Progress from "react-native-progress";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import ExpenseCountryFlag from "../components/ExpensesOutput/ExpenseCountryFlag";
import GradientButton from "../components/UI/GradientButton";
import { constantScale, dynamicScale, scale } from "../util/scalingUtil";
import { Platform } from "react-native";
import { safelyParseJSON } from "../util/jsonParse";

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
  countries: string[];
  numberOfDays: number;
  totalBudget: number;
  averageCostPerDay?: number;
  averageCostPerMonth?: number;
  averageCostPerYear?: number;
  averageCostPerCountry?: number;
  averageCostPerTrip?: number;
  averageCostPerTraveller: number;
};

const TripSummaryScreen = ({ navigation }) => {
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const expCtx = useContext(ExpensesContext);
  const [isFetching, setIsFetching] = useState(false);
  const [allTrips, setAllTrips] = useState<TripAsObject[]>([]);
  const [tripSummary, setTripSummary] = useState<TripsSummary>(null);
  const [allExpensesList, setAllExpensesList] = useState<ExpenseData[]>([]);
  const progress = tripSummary?.totalCost / tripSummary?.totalBudget || 0;
  const isInBudget = progress <= 1;
  const progressBarColor = isInBudget
    ? GlobalStyles.colors.primary500
    : GlobalStyles.colors.errorGrayed;

  const titleTextTrips =
    tripSummary?.numberOfTrips && tripSummary.numberOfTrips > 1
      ? "Trips"
      : "Trip";
  const titleText = `Summary (${
    tripSummary?.numberOfTrips + " " + titleTextTrips
  })`;
  const numberOfDaysIsANumber =
    tripSummary?.numberOfDays && !isNaN(tripSummary.numberOfDays);
  useEffect(() => {
    async function asyncSetAllTrips() {
      if (!userCtx.tripHistory) {
        setIsFetching(false);
        return;
      }
      setIsFetching(true);
      const allTripsAsObjects: TripAsObject[] = [];
      const lastUpdate = getMMKVString("allTripsAsObject_CacheISODate");
      // check if lastUpdate is a iso string today
      const lastUpdateWasToday = lastUpdate && isToday(new Date(lastUpdate));
      if (lastUpdateWasToday) {
        const allTrips = getMMKVObject("allTripsAsObject");
        setAllTrips(allTrips);
        setIsFetching(false);
        return;
      }

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
    let totalBudget = 0;
    let currency = "";
    const travellers: string[] = [];
    const travellersAndTheirCosts: TravellerAndCost[] = [];
    const countries: string[] = [];
    let travelDays = 0;
    const allExpenses: ExpenseData[] = [];

    for (let i = 0; i < selectedTrips?.length; i++) {
      const trip = selectedTrips[i];
      const isContextTrip = trip.tripid === tripCtx.tripid;

      const tripData: TripData = isContextTrip
        ? tripCtx.getcurrentTrip()
        : await getTripData(trip.tripid);
      if (!tripData) continue;
      if (currency !== "" && currency !== tripData.tripCurrency) {
        // TODO: allow different currencies by calculating for the home currency from tripCtx
        Alert.alert("Please select trips with the same home currency");
        setAllTrips((prevState) => {
          const updatedTrips = prevState.map((trip) => {
            if (trip.tripid === tripData.tripid) {
              trip.selected = false;
            }
            return trip;
          });
          return updatedTrips;
        });
        continue;
      }
      currency = tripData.tripCurrency;
      totalBudget += Number(tripData.totalBudget);

      const expenses = isContextTrip
        ? expCtx.expenses
        : await getAllExpensesData(trip.tripid);

      if (!expenses) {
        safeLogError(
          new Error(
            "expenses is null in " + trip.tripid + " in TripSummaryScreen.tsx"
          )
        );
        continue;
      }
      allExpenses.push(...expenses);

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
          let shallowCopySplitList: Split[] = [];
          try {
            shallowCopySplitList = safelyParseJSON(
              JSON.stringify(expense.splitList)
            );
          } catch (error) {
            safeLogError(error);
          }
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

    const avgCostPerDay = totalCost / travelDays;
    const avgCostPerMonth = avgCostPerDay * 30;
    const avgCostPerYear = avgCostPerDay * 365;

    const avgCostPerCountry = totalCost / countries.length;
    const avgCostPerTrip = totalCost / numberOfTrips;
    const avgCostPerTraveller = totalCost / travellers.length;

    setTripSummary({
      numberOfTrips: numberOfTrips,
      totalCost: +totalCost.toFixed(2),
      currency: currency,
      travellersAndTheirCosts: travellersAndTheirCosts,
      numberOfCountries: countries?.length,
      numberOfDays: travelDays,
      totalBudget: +totalBudget.toFixed(2),
      countries: countries,
      averageCostPerDay: +avgCostPerDay.toFixed(2),
      averageCostPerMonth: +avgCostPerMonth.toFixed(2),
      averageCostPerYear: +avgCostPerYear.toFixed(2),
      averageCostPerCountry: +avgCostPerCountry.toFixed(),
      averageCostPerTrip: +avgCostPerTrip.toFixed(2),
      averageCostPerTraveller: +avgCostPerTraveller.toFixed(2),
    });
    setAllExpensesList(allExpenses);
    setIsFetching(false);
  };

  useEffect(() => {
    if (!tripSummary && allTrips && allTrips.length > 0) {
      summarizeHandler();
    }
  });

  // function exportHandler() {
  // TODO: export to pdf or excel
  // }

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
    <Animated.ScrollView
      entering={FadeIn}
      exiting={FadeOut}
      style={{ marginTop: dynamicScale(12, false, 0.5) }}
    >
      {tripSummary && (
        <View style={[styles.summaryContainer, GlobalStyles.shadow]}>
          <Text style={styles.titleText}>{titleText}</Text>
          <Text style={styles.summaryText}>
            Total Costs:{" "}
            {formatExpenseWithCurrency(
              tripSummary.totalCost,
              tripSummary.currency
            )}{" "}
            /{" "}
            {formatExpenseWithCurrency(
              tripSummary.totalBudget,
              tripSummary.currency
            )}
          </Text>
          <View style={[GlobalStyles.shadow, styles.progressBarContainer]}>
            <Progress.Bar
              color={progressBarColor}
              unfilledColor={GlobalStyles.colors.gray600}
              borderWidth={0}
              borderRadius={dynamicScale(8, false, 0.5)}
              progress={progress}
              height={constantScale(12, 0.5)}
              width={scale(200)}
            ></Progress.Bar>
          </View>
          <View
            style={{
              // center content
              justifyContent: "center",
              alignItems: "center",
              // maxHeight: 60,
            }}
          >
            {tripSummary.countries && tripSummary.countries.length > 0 && (
              <FlatList
                numColumns={Math.min(tripSummary.countries.length, 7)}
                scrollEnabled={false}
                data={tripSummary.countries}
                renderItem={(item) => {
                  const countryFlag = (
                    <ExpenseCountryFlag
                      countryName={item.item}
                      style={GlobalStyles.countryFlagStyle}
                      containerStyle={[
                        { padding: dynamicScale(4, false, 0.5) },
                        GlobalStyles.shadow,
                      ]}
                    ></ExpenseCountryFlag>
                  );
                  return (
                    <View style={{ flexDirection: "row" }}>{countryFlag}</View>
                  );
                }}
              ></FlatList>
            )}
            <Text style={styles.summaryText}>
              Countries: {tripSummary.numberOfCountries}
            </Text>
          </View>

          {!!numberOfDaysIsANumber && !!tripSummary.numberOfDays && (
            <Text style={styles.summaryText}>
              Days: {tripSummary.numberOfDays}
            </Text>
          )}
          {!!allExpensesList && allExpensesList.length > 0 && (
            <Text style={styles.summaryText}>
              Expenses: {allExpensesList.length}
            </Text>
          )}
          {!!tripSummary.averageCostPerDay && (
            <Text style={styles.summaryText}>
              Average Cost Per Day:{" "}
              {formatExpenseWithCurrency(
                tripSummary.averageCostPerDay,
                tripSummary.currency
              )}
            </Text>
          )}
          {!!tripSummary.averageCostPerMonth && (
            <Text style={styles.summaryText}>
              Average Cost Per Month:{" "}
              {formatExpenseWithCurrency(
                tripSummary.averageCostPerMonth,
                tripSummary.currency
              )}
            </Text>
          )}
          {!!tripSummary.averageCostPerYear && (
            <Text style={styles.summaryText}>
              Average Cost Per Year:{" "}
              {formatExpenseWithCurrency(
                tripSummary.averageCostPerYear,
                tripSummary.currency
              )}
            </Text>
          )}
          {!!tripSummary.averageCostPerCountry && (
            <Text style={styles.summaryText}>
              Average Cost Per Country:{" "}
              {formatExpenseWithCurrency(
                tripSummary.averageCostPerCountry,
                tripSummary.currency
              )}
            </Text>
          )}
          {!!tripSummary.averageCostPerTrip && (
            <Text style={styles.summaryText}>
              Average Cost Per Trip:{" "}
              {formatExpenseWithCurrency(
                tripSummary.averageCostPerTrip,
                tripSummary.currency
              )}
            </Text>
          )}
          {!!tripSummary.averageCostPerTraveller && (
            <Text style={styles.summaryText}>
              Average Cost Per Traveller:{" "}
              {formatExpenseWithCurrency(
                tripSummary.averageCostPerTraveller,
                tripSummary.currency
              )}
            </Text>
          )}

          {/* travellers and their costs */}
          {/* <Text style={styles.summaryText}>Travellers And Their Costs</Text> */}
          <FlatList
            data={tripSummary.travellersAndTheirCosts}
            renderItem={(item) => (
              <View style={styles.travellerCostItem}>
                <Text style={styles.summaryText}>{item.item.traveller}</Text>
                <Text style={styles.summaryText}>
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
        <GradientButton
          onPress={() => {
            navigation.navigate("FilteredPieCharts", {
              expenses: allExpensesList,
              dayString: `${titleText}\n${allExpensesList?.length} ${i18n.t(
                "expensesTab"
              )}`,
            });
          }}
        >
          Charts
        </GradientButton>
        {/* {tripSummary && (
          <GradientButton
            style={styles.gradientButtonStyle}
            onPress={exportHandler}
          >
            Export to PDF
          </GradientButton>
        )} */}
      </View>
      <FlatList
        data={allTrips}
        scrollEnabled={false}
        ListHeaderComponent={() => (
          <Text style={styles.titleText}>{i18n.t("myTrips")}</Text>
        )}
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
              <Text style={styles.summaryText}>{item.item.tripname}</Text>
            </TouchableOpacity>
          );
        }}
      ></FlatList>
    </Animated.ScrollView>
  );
};

export default TripSummaryScreen;

TripSummaryScreen.propTypes = {
  navigation: PropTypes.object,
};

const styles = StyleSheet.create({
  titleText: {
    fontSize: dynamicScale(20, false, 0.5),
    fontWeight: "bold",
    textAlign: "center",
    margin: dynamicScale(16, false, 0.5),
  },
  tripItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: dynamicScale(10, false, 0.5),
    margin: dynamicScale(12, false, 0.5),
    marginHorizontal: dynamicScale(16, false, 0.5),
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(10, false, 0.5),
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray600,
  },
  summaryContainer: {
    padding: dynamicScale(10, false, 0.5),
    margin: dynamicScale(16, false, 0.5),
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(10, false, 0.5),
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray600,
  },
  progressBarContainer: {
    paddingHorizontal: dynamicScale(12, false, 0.5),
    paddingVertical: 4,
    marginBottom: 4,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    minWidth: dynamicScale(80, false, 0.5),
    // android styles
    ...Platform.select({
      android: {
        elevation: 0,
      },
    }),
  },
  gradientButtonStyle: {
    margin: dynamicScale(16, false, 0.5),
  },
  buttonContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-evenly",
    margin: dynamicScale(16, false, 0.5),
  },
  summaryTextBig: {
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "bold",
    textAlign: "center",
    margin: dynamicScale(4, false, 0.5),
  },
  summaryText: {
    fontSize: dynamicScale(14, false, 0.5),
    fontWeight: "300",
    textAlign: "center",
    margin: dynamicScale(4, false, 0.5),
  },
  travellerCostItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    margin: dynamicScale(4, false, 0.5),
  },
});
