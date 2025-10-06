/* eslint-disable react/prop-types */
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { useContext, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Checkbox } from "react-native-paper";
import * as Progress from "react-native-progress";

import Animated, { FadeIn, FadeInUp, FadeOut } from "react-native-reanimated";
import FlatButton from "../components/UI/FlatButton";
import LoadingBarOverlay from "../components/UI/LoadingBarOverlay";
import { UserContext } from "../store/user-context";
import { daysBetween, isToday } from "../util/date";
import { fetchTripName } from "../util/http";

import { GlobalStyles } from "../constants/styles";

//Localization

import { de, en, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import { ExpensesContext } from "../store/expenses-context";
import {
  getMMKVObject,
  getMMKVString,
  setMMKVObject,
  setMMKVString,
} from "../store/mmkv";
import { TripContext, TripData } from "../store/trip-context";
import safeLogError from "../util/error";
import {
  ExpenseData,
  Split,
  getAllExpensesData,
  getExpensesSum,
} from "../util/expense";
import { safelyParseJSON } from "../util/jsonParse";
import { constantScale, dynamicScale, scale } from "../util/scalingUtil";
import { formatExpenseWithCurrency } from "../util/string";
import { getTripData } from "../util/trip";

import ExpenseCountryFlag from "../components/ExpensesOutput/ExpenseCountryFlag";
import GradientButton from "../components/UI/GradientButton";

import * as Haptics from "expo-haptics";

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
  const [showSummary, setShowSummary] = useState(false);
  const [showTripList, setShowTripList] = useState(true);
  const progress = tripSummary?.totalCost / tripSummary?.totalBudget || 0;
  const isInBudget = progress <= 1;
  const progressBarColor = isInBudget
    ? GlobalStyles.colors.primary500
    : GlobalStyles.colors.errorGrayed;

  const titleTextTrips =
    tripSummary?.numberOfTrips && tripSummary.numberOfTrips > 1
      ? i18n.t("trips")
      : i18n.t("trip");
  const titleText = i18n.t("summary");
  const subtitleText = `(${`${tripSummary?.numberOfTrips} ${titleTextTrips}`})`;
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
          tripid,
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
    const selectedTrips = allTrips.filter(trip => trip.selected);
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
        Alert.alert(i18n.t("alertSameCurrencyTrips"));
        setAllTrips(prevState => {
          const updatedTrips = prevState.map(trip => {
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
            `expenses is null in ${trip.tripid} in TripSummaryScreen.tsx`
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
                  traveller,
                  cost: cost * rate,
                });
            } else {
              // traveller already exists, add costs
              const travellerAndCost = travellersAndTheirCosts.find(
                t => t.traveller === traveller
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
              t => t.traveller === expense.whoPaid
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
      numberOfTrips,
      totalCost: +totalCost.toFixed(2),
      currency,
      travellersAndTheirCosts,
      numberOfCountries: countries?.length,
      numberOfDays: travelDays,
      totalBudget: +totalBudget.toFixed(2),
      countries,
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

  function itemCheckBoxHandler(item) {
    setTripSummary(null);
    setAllTrips(prevState => {
      const updatedTrips = prevState.map(trip => {
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
      style={{
        marginTop: dynamicScale(12, false, 0.5),
        paddingBottom: dynamicScale(48, false, 0.5),
      }}
    >
      {tripSummary && (
        <>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowSummary(!showSummary);
            }}
            style={({ pressed }) => [
              styles.expandableContainer,
              GlobalStyles.shadowGlowPrimary,
              pressed && GlobalStyles.pressedWithShadow,
            ]}
          >
            <Text style={styles.expandableHeaderTitle}>{titleText}</Text>
            <Text style={styles.expandableHeaderSubtitle}>{subtitleText}</Text>
          </Pressable>
          {showSummary && (
            <Animated.View entering={FadeInUp}>
              <View style={[styles.summaryContainer, GlobalStyles.shadow]}>
                <Text
                  style={[
                    styles.summaryText,
                    {
                      textAlign: "center",
                      fontSize: dynamicScale(16, false, 0.5),
                      fontWeight: "600",
                      color: GlobalStyles.colors.gray700,
                      marginBottom: dynamicScale(8, false, 0.5),
                    },
                  ]}
                >
                  {i18n.t("totalCosts")}:{" "}
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
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      GlobalStyles.shadow,
                      { borderRadius: dynamicScale(8, false, 0.5) },
                    ]}
                  >
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
                </View>
                <View
                  style={{
                    // center content
                    justifyContent: "center",
                    alignItems: "center",
                    // maxHeight: 60,
                  }}
                >
                  {tripSummary.countries &&
                    tripSummary.countries.length > 0 && (
                      <FlatList
                        numColumns={Math.min(tripSummary.countries.length, 7)}
                        scrollEnabled={false}
                        data={tripSummary.countries}
                        renderItem={item => {
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
                            <View style={{ flexDirection: "row" }}>
                              {countryFlag}
                            </View>
                          );
                        }}
                      ></FlatList>
                    )}
                  <Text
                    style={[
                      styles.summaryText,
                      {
                        textAlign: "center",
                        marginTop: dynamicScale(8, false, 0.5),
                      },
                    ]}
                  >
                    {i18n.t("countries")}: {tripSummary.numberOfCountries}
                  </Text>
                </View>

                {!!numberOfDaysIsANumber && !!tripSummary.numberOfDays && (
                  <Text style={styles.summaryText}>
                    {i18n.t("days")}: {tripSummary.numberOfDays}
                  </Text>
                )}
                {!!allExpensesList && allExpensesList.length > 0 && (
                  <Text style={styles.summaryText}>
                    {i18n.t("expenses")}: {allExpensesList.length}
                  </Text>
                )}
                {!!tripSummary.averageCostPerDay && (
                  <Text style={styles.summaryText}>
                    {i18n.t("averageCostPerDay")}:{" "}
                    {formatExpenseWithCurrency(
                      tripSummary.averageCostPerDay,
                      tripSummary.currency
                    )}
                  </Text>
                )}
                {!!tripSummary.averageCostPerMonth && (
                  <Text style={styles.summaryText}>
                    {i18n.t("averageCostPerMonth")}:{" "}
                    {formatExpenseWithCurrency(
                      tripSummary.averageCostPerMonth,
                      tripSummary.currency
                    )}
                  </Text>
                )}
                {!!tripSummary.averageCostPerYear && (
                  <Text style={styles.summaryText}>
                    {i18n.t("averageCostPerYear")}:{" "}
                    {formatExpenseWithCurrency(
                      tripSummary.averageCostPerYear,
                      tripSummary.currency
                    )}
                  </Text>
                )}
                {!!tripSummary.averageCostPerCountry && (
                  <Text style={styles.summaryText}>
                    {i18n.t("averageCostPerCountry")}:{" "}
                    {formatExpenseWithCurrency(
                      tripSummary.averageCostPerCountry,
                      tripSummary.currency
                    )}
                  </Text>
                )}
                {!!tripSummary.averageCostPerTrip && (
                  <Text style={styles.summaryText}>
                    {i18n.t("averageCostPerTrip")}:{" "}
                    {formatExpenseWithCurrency(
                      tripSummary.averageCostPerTrip,
                      tripSummary.currency
                    )}
                  </Text>
                )}
                {!!tripSummary.averageCostPerTraveller && (
                  <Text style={styles.summaryText}>
                    {i18n.t("averageCostPerTraveller")}:{" "}
                    {formatExpenseWithCurrency(
                      tripSummary.averageCostPerTraveller,
                      tripSummary.currency
                    )}
                  </Text>
                )}

                {/* travellers and their costs */}
                {tripSummary.travellersAndTheirCosts &&
                  tripSummary.travellersAndTheirCosts.length > 0 && (
                    <View style={{ marginTop: dynamicScale(16, false, 0.5) }}>
                      <Text
                        style={[
                          styles.summaryText,
                          {
                            fontWeight: "600",
                            color: GlobalStyles.colors.gray700,
                            marginBottom: dynamicScale(8, false, 0.5),
                          },
                        ]}
                      >
                        {i18n.t("travellers")} & {i18n.t("costs")}
                      </Text>
                      <FlatList
                        data={tripSummary.travellersAndTheirCosts}
                        renderItem={item => (
                          <View style={styles.travellerCostItem}>
                            <Text
                              style={[
                                styles.summaryText,
                                { fontWeight: "500" },
                              ]}
                            >
                              {item.item.traveller}
                            </Text>
                            <Text
                              style={[
                                styles.summaryText,
                                {
                                  fontWeight: "600",
                                  color: GlobalStyles.colors.primary700,
                                },
                              ]}
                            >
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
              </View>
            </Animated.View>
          )}
        </>
      )}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowTripList(!showTripList);
        }}
        style={({ pressed }) => [
          styles.tripListContainer,
          GlobalStyles.shadowGlowPrimary,
          pressed && GlobalStyles.pressedWithShadow,
        ]}
      >
        <Text style={styles.expandableHeaderTitle}>{i18n.t("myTrips")}</Text>
        {showTripList && (
          <Animated.View entering={FadeInUp}>
            <FlatList
              data={allTrips}
              scrollEnabled={false}
              renderItem={item => {
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
                    <Text
                      style={[
                        styles.tripItemText,
                        {
                          fontWeight: "500",
                          color: GlobalStyles.colors.gray700,
                          flex: 1,
                          marginLeft: dynamicScale(6, false, 0.5),
                        },
                      ]}
                    >
                      {item.item.tripname}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            ></FlatList>
          </Animated.View>
        )}
      </Pressable>
      <View style={styles.buttonContainer}>
        <GradientButton
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowSummary(!showSummary);
            if (!showSummary) {
              summarizeHandler();
            }
          }}
          buttonStyle={styles.fullWidthButtonStyle}
          colors={GlobalStyles.gradientColorsButton}
          darkText
        >
          {i18n.t("summary")}
        </GradientButton>
        <View style={styles.halfWidthButtonContainer}>
          <View style={styles.halfWidthButton}>
            <FlatButton
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.pop();
              }}
              textStyle={{}}
            >
              {i18n.t("back")}
            </FlatButton>
          </View>
          <View style={styles.halfWidthButton}>
            <FlatButton
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("FilteredPieCharts", {
                  expenses: allExpensesList,
                  dayString: `${titleText}\n${allExpensesList?.length} ${i18n.t(
                    "expensesTab"
                  )}`,
                });
              }}
              textStyle={{}}
            >
              {i18n.t("charts")}
            </FlatButton>
          </View>
        </View>
        {/* {tripSummary && (
          <GradientButton
            style={styles.gradientButtonStyle}
            onPress={exportHandler}
          >
            Export to PDF
          </GradientButton>
        )} */}
      </View>
    </Animated.ScrollView>
  );
};

export default TripSummaryScreen;

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: "center",
    flexDirection: "column",
    margin: dynamicScale(20, false, 0.5),
    paddingHorizontal: dynamicScale(16, false, 0.5),
  },
  buttonContent: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: dynamicScale(-2, true),
    paddingTop: dynamicScale(2, true),
  },
  buttonIcon: {
    height: dynamicScale(18, false, 0.5),
    marginRight: dynamicScale(6, false, 0.5),
    width: dynamicScale(18, false, 0.5),
  },
  buttonText: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(16, false, 0.5),
    fontStyle: "italic",
    fontWeight: "300",
  },
  expandableContainer: {
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: 24,
    justifyContent: "center",
    margin: constantScale(12, 0.5),
    minHeight: constantScale(80, 0.5),
    padding: constantScale(24, 0.5),
    paddingBottom: constantScale(12, 0.5),
    paddingTop: constantScale(12, 0.5),
  },
  expandableHeaderSubtitle: {
    color: GlobalStyles.colors.textColor,
    fontSize: constantScale(16, 0.5),
    fontWeight: "400",
    lineHeight: constantScale(20, 0.5),
    opacity: 0.8,
    textAlign: "center",
  },
  expandableHeaderTitle: {
    color: GlobalStyles.colors.textColor,
    fontSize: constantScale(24, 0.5),
    fontStyle: "italic",
    fontWeight: "900",
    lineHeight: constantScale(30, 0.5),
    marginBottom: dynamicScale(4, false, 0.5),
    textAlign: "center",
  },
  fullWidthButtonStyle: {
    marginBottom: dynamicScale(24, false, 0.5),
    width: "100%",
  },
  gradientButtonStyle: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 0, // Override GradientButton's default margin
  },
  halfWidthButton: {
    flex: 1,
  },
  halfWidthButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: dynamicScale(16, false, 0.5),
    width: "100%",
  },
  progressBarContainer: {
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.gray300,
    borderRadius: dynamicScale(8, false, 0.5),
    justifyContent: "center",
    marginVertical: dynamicScale(12, false, 0.5),
    minWidth: dynamicScale(100, false, 0.5),
    paddingHorizontal: dynamicScale(16, false, 0.5),
    paddingVertical: dynamicScale(8, false, 0.5),
    // android styles
    ...Platform.select({
      android: {
        elevation: 0,
      },
    }),
  },
  summaryContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderColor: GlobalStyles.colors.gray300,
    borderRadius: dynamicScale(16, false, 0.5),
    borderWidth: 1,
    elevation: 4,
    margin: dynamicScale(16, false, 0.5),
    padding: dynamicScale(20, false, 0.5),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  summaryText: {
    color: GlobalStyles.colors.gray700,
    fontSize: dynamicScale(14, false, 0.5),
    fontWeight: "400",
    lineHeight: dynamicScale(20, false, 0.5),
    marginVertical: dynamicScale(6, false, 0.5),
    textAlign: "left",
  },
  summaryTextBig: {
    color: GlobalStyles.colors.gray700,
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "600",
    marginVertical: dynamicScale(6, false, 0.5),
    textAlign: "center",
  },
  titleText: {
    color: GlobalStyles.colors.gray700,
    fontSize: dynamicScale(22, false, 0.5),
    fontWeight: "700",
    letterSpacing: 0.5,
    marginHorizontal: dynamicScale(16, false, 0.5),
    marginVertical: dynamicScale(20, false, 0.5),
    textAlign: "center",
  },
  travellerCostItem: {
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.gray300,
    borderRadius: dynamicScale(8, false, 0.5),
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: dynamicScale(8, false, 0.5),
    paddingHorizontal: dynamicScale(8, false, 0.5),
    paddingVertical: dynamicScale(4, false, 0.5),
  },
  tripItemContainer: {
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderColor: GlobalStyles.colors.gray300,
    borderRadius: dynamicScale(8, false, 0.5),
    borderWidth: 1,
    elevation: 1,
    flexDirection: "row",
    gap: dynamicScale(8, false, 0.5),
    marginHorizontal: dynamicScale(8, false, 0.5),
    marginVertical: dynamicScale(4, false, 0.5),
    padding: dynamicScale(12, false, 0.5),
    paddingHorizontal: dynamicScale(16, false, 0.5),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tripItemText: {
    color: GlobalStyles.colors.gray700,
    fontSize: dynamicScale(14, false, 0.5),
    fontWeight: "400",
    lineHeight: dynamicScale(18, false, 0.5),
  },
  tripListContainer: {
    alignItems: "stretch",
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderRadius: 24,
    gap: constantScale(8, 0.5),
    justifyContent: "flex-start",
    margin: constantScale(12, 0.5),
    minHeight: constantScale(80, 0.5),
    padding: constantScale(16, 0.5),
  },
});
