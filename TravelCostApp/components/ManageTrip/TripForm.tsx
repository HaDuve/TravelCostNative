import React from "react";
import { useState, useContext, useEffect, useLayoutEffect } from "react";
import { View, Text, Alert, ScrollView, Platform } from "react-native";
import { StyleSheet } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../store/auth-context";
import {
  storeTrip,
  storeTripHistory,
  updateUser,
  fetchTrip,
  updateTripHistory,
  updateTrip,
  getAllExpenses,
  putTravelerInTrip,
} from "../../util/http";

import { KeyboardAvoidingView } from "react-native";

import Input from "../ManageExpense/Input";
import { TripContext, TripData } from "../../store/trip-context";
import { UserContext } from "../../store/user-context";
import FlatButton from "../UI/FlatButton";
import { ExpensesContext } from "../../store/expenses-context";
import CurrencyPicker from "../Currency/CurrencyPicker";
import { useHeaderHeight } from "@react-navigation/elements";

//localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
// i18n.locale = "en";
i18n.enableFallback = true;

import { daysBetween, getFormattedDate } from "../../util/date";
import { DateTime } from "luxon";
import * as Haptics from "expo-haptics";
import DatePickerModal from "../UI/DatePickerModal";
import IconButton from "../UI/IconButton";
import DatePickerContainer from "../UI/DatePickerContainer";
import GradientButton from "../UI/GradientButton";
import PropTypes from "prop-types";
import InfoButton from "../UI/InfoButton";
import Modal from "react-native-modal";
import { MAX_JS_NUMBER, MAX_TRIPS_NONPREMIUM } from "../../confAppConstants";
import Animated, {
  FadeInDown,
  FadeOut,
  ZoomIn,
  ZoomOut,
} from "react-native-reanimated";
import { secureStoreSetItem } from "../../store/secure-storage";
import BackButton from "../UI/BackButton";
import { onShare } from "../ProfileOutput/ShareTrip";
import { NetworkContext } from "../../store/network-context";
import { getMMKVObject, setMMKVObject } from "../../store/mmkv";
import { useTourGuideController } from "rn-tourguide";
import LoadingBarOverlay from "../UI/LoadingBarOverlay";
import { useWindowDimensions } from "react-native";
import { Switch } from "react-native-paper";
import { formatExpenseWithCurrency } from "../../util/string";
import { isPremiumMember } from "../Premium/PremiumConstants";
import Toast from "react-native-toast-message";
import { sleep } from "../../util/appState";
import safeLogError from "../../util/error";

const TripForm = ({ navigation, route }) => {
  const tripCtx = useContext(TripContext);
  const locales = Localization.getLocales();
  // get the most fitting currency from the list of locales
  const currencyList = locales.map((locale) => locale.currencyCode);
  const standardCurrency = currencyList[0];
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const netCtx = useContext(NetworkContext);
  const expenseCtx = useContext(ExpensesContext);
  const isOnline = netCtx.isConnected;
  const isFast = netCtx.strongConnection;
  const [isConnected, setIsConnected] = useState(isOnline && isFast);
  useEffect(() => {
    setIsConnected(isOnline && isFast);
  }, [isOnline, isFast]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [infoIsVisible, setInfoIsVisible] = useState(false);
  const windowWidth = useWindowDimensions().width;
  const {
    canStart, // a boolean indicate if you can start tour guide
    start, // a function to start the tourguide
    // stop, // a function  to stopping it
    eventEmitter, // an object for listening some events
  } = useTourGuideController();

  const [inputs, setInputs] = useState({
    tripName: {
      value: "",
      isValid: true,
    },
    totalBudget: {
      value: "",
      isValid: true,
    },
    tripCurrency: {
      value: standardCurrency,
      isValid: true,
    },
    dailyBudget: {
      value: "",
      isValid: true,
    },
    isDynamicDailyBudget: {
      value: false,
      isValid: true,
    },
  });

  // datepicker states
  const [showDatePickerRange, setShowDatePickerRange] = useState(false);
  const [startDate, setStartDate] = useState(
    // defaultValues
    // ? getFormattedDate(DateTime.fromJSDate(defaultValues.date).toJSDate())
    // :
    getFormattedDate(DateTime.now())
  );
  const [endDate, setEndDate] = useState(
    // defaultValues
    //   ? getFormattedDate(DateTime.fromJSDate(defaultValues.date).toJSDate())
    //   :
    getFormattedDate(DateTime.now().plus({ days: 7 }))
  );
  const [travellers, setTravellers] = useState([]);

  const openDatePickerRange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePickerRange(true);
  };
  const onCancelRange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePickerRange(false);
  };

  const onConfirmRange = (output) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePickerRange(false);
    // hotfixing datebug for asian countries
    const startDate = DateTime.fromJSDate(output.startDate).toJSDate();
    const endDate = DateTime.fromJSDate(output.endDate).toJSDate();
    const startDateFormat = getFormattedDate(startDate);
    const endDateFormat = getFormattedDate(endDate);
    setStartDate(startDateFormat);
    setEndDate(endDateFormat);
  };
  const datepickerJSX = DatePickerModal({
    showDatePickerRange,
    onCancelRange,
    onConfirmRange,
  });

  const editedTripId = route.params?.tripId;
  const isEditing = !!editedTripId;

  useLayoutEffect(() => {
    const fetchTripData = async () => {
      try {
        const selectedTrip = await fetchTrip(editedTripId);
        inputChangedHandler("tripName", selectedTrip.tripName);
        inputChangedHandler("tripCurrency", selectedTrip.tripCurrency);
        inputChangedHandler("dailyBudget", selectedTrip.dailyBudget.toString());
        inputChangedHandler(
          "totalBudget",
          selectedTrip.totalBudget?.toString()
        );
        inputChangedHandler(
          "isDynamicDailyBudget",
          selectedTrip.isDynamicDailyBudget
        );
        setStartDate(selectedTrip.startDate);
        setEndDate(selectedTrip.endDate);
        setTravellers(selectedTrip.travellers);
      } catch (error) {
        safeLogError(error);
      }
      setIsLoading(false);
    };
    function loadTripDataFromContext() {
      // if we are editing a trip, we load the data from the context
      // no need to fetch it from the server in that case
      if (tripCtx.tripid == editedTripId) {
        inputChangedHandler("tripName", tripCtx.tripName);
        inputChangedHandler("totalBudget", tripCtx.totalBudget);
        inputChangedHandler("dailyBudget", tripCtx.dailyBudget);
        inputChangedHandler("tripCurrency", tripCtx.tripCurrency);
        inputChangedHandler(
          "isDynamicDailyBudget",
          tripCtx.isDynamicDailyBudget
        );
        setIsLoading(false);
        return;
      } else {
        setIsLoading(true);
      }
    }

    if (isEditing && editedTripId) {
      loadTripDataFromContext();
      fetchTripData();
    }
  }, [
    editedTripId,
    isEditing,
    tripCtx.dailyBudget,
    tripCtx.totalBudget,
    tripCtx.tripCurrency,
    tripCtx.tripName,
    tripCtx.tripid,
    tripCtx.isDynamicDailyBudget,
  ]);

  const [countryValue, setCountryValue] = useState(
    inputs?.tripCurrency ? inputs.tripCurrency.value : standardCurrency
  );

  const uid = authCtx.uid;
  const userName = userCtx.userName;
  // let currencyPickerRef = undefined;

  function inputChangedHandler(inputIdentifier, enteredValue) {
    setInputs((curInputs) => {
      return {
        ...curInputs,
        [inputIdentifier]: { value: enteredValue, isValid: true },
      };
    });
  }
  function cancelHandler() {
    navigation.pop();
  }

  // async function deleteAcceptHandler() {
  // const trips = route.params.trips;
  // if triplist?.length == 1 await userCtx.setFreshlyCreatedTo(true);
  // await deleteTrip(editedTripId);
  // }
  // function deleteHandler() {
  //   Alert.alert(
  //     i18n.t("deleteTrip"),
  //     i18n.t("deleteTripSure"),
  //     [
  //       {
  //         text: i18n.t("cancel"),
  //         style: "cancel",
  //       },
  //       {
  //         // text: i18n.t("delete"),
  //         text: i18n.t("delete"),
  //         style: "destructive",
  //         onPress: async () => {
  //           deleteAcceptHandler();
  //           navigation.pop();
  //         },
  //       },
  //     ],
  //     { cancelable: false }
  //   );
  // }

  async function editingTripData(tripData: TripData, setActive = false) {
    try {
      await updateTrip(editedTripId, tripData);
      setLoadingProgress(1);
      if (editedTripId === tripCtx.tripid || setActive) {
        await secureStoreSetItem("currentTripId", editedTripId);
        await tripCtx.saveTripDataInStorage(tripData);
        setLoadingProgress(2);
        await tripCtx.setCurrentTrip(editedTripId, tripData);
        setLoadingProgress(4);
        await updateUser(uid, {
          currentTrip: editedTripId,
        });
        setLoadingProgress(5);
        await tripCtx.fetchAndSetTravellers(editedTripId);
        setLoadingProgress(7);
        await userCtx.setFreshlyCreatedTo(false);
        setLoadingProgress(8);
        const expenses = await getAllExpenses(editedTripId, uid);
        setLoadingProgress(9);
        expenseCtx.setExpenses([...expenses]);
        setMMKVObject("expenses", expenses);
        tripCtx.setdailyBudget(tripData.dailyBudget);
        return;
      }
      tripCtx.refresh();
      Toast.hide();
      return;
    } catch (error) {
      safeLogError(error);
      navigation.popToTop();
      Toast.hide();
    }
  }

  async function createTripData(tripData: TripData) {
    setLoadingProgress(1);
    const currentCategories = getMMKVObject("categoryList");
    // auto convert current categories into  new trips data
    // stored online as a stringified array
    if (currentCategories)
      tripData.categories = JSON.stringify(currentCategories);

    const tripid = await storeTrip(tripData);

    setLoadingProgress(2);
    await putTravelerInTrip(tripid, { userName: userName, uid: uid });
    setLoadingProgress(4);

    await secureStoreSetItem("currentTripId", tripid);
    // await asyncStoreSetObject("expenses", []);
    setMMKVObject("expenses", []);

    // the following context state functions are unnecessary as long as we reload
    try {
      await tripCtx.setCurrentTrip(tripid, tripData);
      setLoadingProgress(5);

      expenseCtx.setExpenses([]);
      if (userCtx.freshlyCreated) {
        userCtx.setNeedsTour(true);
      }
    } catch (error) {
      safeLogError(error);
    }

    try {
      if (userCtx.tripHistory?.length > 0)
        userCtx.setTripHistory([...userCtx.tripHistory, tripid]);
      else userCtx.setTripHistory([tripid]);
    } catch (error) {
      safeLogError(error);
    }

    // if fresh store TripHistory else update TripHistory
    try {
      if (userCtx.freshlyCreated) {
        await storeTripHistory(uid, [tripid]);
      } else {
        await updateTripHistory(uid, tripid);
      }
    } catch (error) {
      safeLogError(error);
    }
    setLoadingProgress(7);
    await updateUser(uid, {
      userName: userName,
      currentTrip: tripid,
    });
    setLoadingProgress(9);
    expenseCtx.setExpenses([]);
    setMMKVObject("expenses", []);

    // Tourguide
    await userCtx.setFreshlyCreatedTo(false);
    if (canStart && userCtx.needsTour) {
      start();
    }
    navigation.navigate("RecentExpenses");
  }

  const isLimitedByPremium = async () => {
    const isPremium = await isPremiumMember();
    if (isPremium) return false;
    const tripHistory = userCtx.tripHistory;
    const tripHistoryLength = tripHistory?.length || 0;
    const tooManyTrips = tripHistoryLength >= MAX_TRIPS_NONPREMIUM;
    return tooManyTrips;
  };

  function checkFormValidity(tripData: TripData) {
    // Tripname should not be empty or spaces
    const tripNameIsValid =
      tripData.tripName && tripData.tripName.trim()?.length > 0;
    // tripCurrency should not be empty
    const tripCurrencyIsValid =
      tripData.tripCurrency && tripData.tripCurrency?.length > 0;
    // Total budget should be a number between 0 and 3B
    const totalBudgetIsValid =
      !tripData.totalBudget ||
      tripData.totalBudget === "0" ||
      (tripData.totalBudget &&
        !isNaN(+tripData.totalBudget) &&
        +tripData.totalBudget >= 0 &&
        +tripData.totalBudget < MAX_JS_NUMBER &&
        +tripData.totalBudget > +tripData.dailyBudget);

    const dynamicIsValid =
      !tripData.isDynamicDailyBudget ||
      (tripData.isDynamicDailyBudget && totalBudgetIsValid);

    const dailyBudgetIsValid =
      !isNaN(+tripData.dailyBudget) &&
      +tripData.dailyBudget > 0 &&
      +tripData.dailyBudget < MAX_JS_NUMBER &&
      (!tripData.totalBudget ||
        tripData.totalBudget === "0" ||
        +tripData.dailyBudget < +tripData.totalBudget);

    if (!tripNameIsValid) {
      inputs.tripName.isValid = tripNameIsValid;
      Alert.alert(i18n.t("enterNameAlert"));
      setIsLoading(false);
      Toast.hide();
      return false;
    }

    if (!dynamicIsValid) {
      inputs.totalBudget.isValid = dynamicIsValid;
      Alert.alert(i18n.t("error"), "Please enter a total Budget number!"); //(i18n.t("enterBudgetAlert"));
      setIsLoading(false);
      Toast.hide();
      return false;
    }

    if (!totalBudgetIsValid || !dailyBudgetIsValid) {
      inputs.totalBudget.isValid = totalBudgetIsValid;
      inputs.dailyBudget.isValid = dailyBudgetIsValid;
      Alert.alert(i18n.t("error"), i18n.t("enterBudgetAlert"));
      setIsLoading(false);
      Toast.hide();
      return false;
    }

    if (!tripCurrencyIsValid) {
      inputs.tripCurrency.isValid = tripCurrencyIsValid;
      Alert.alert(i18n.t("error"), i18n.t("selectCurrencyAlert"));
      setIsLoading(false);
      Toast.hide();
      return false;
    }
    return true;
  }

  async function submitHandler(setActive = false) {
    if (!isEditing) {
      if (await isLimitedByPremium()) {
        navigation.navigate("Paywall");
        return;
      }
    }
    navigation.pop();
    Toast.show({
      type: "loading",
      text1: i18n.t("toastSaving1"),
      text2: i18n.t("toastSaving2"),
      autoHide: false,
    });
    if (!isConnected) {
      Alert.alert(i18n.t("noConnection"), i18n.t("checkConnectionError"));
      setIsLoading(false);
      Toast.hide();
      return;
    }
    const tripData: TripData = {
      tripName: inputs.tripName.value,
      totalBudget: inputs.totalBudget.value,
      tripCurrency: inputs.tripCurrency.value,
      dailyBudget: inputs.dailyBudget.value,
      startDate: startDate,
      endDate: endDate,
      tripid: editedTripId,
      travellers: travellers,
      isDynamicDailyBudget: inputs.isDynamicDailyBudget.value,
    };

    const formIsValid = checkFormValidity(tripData);
    if (!formIsValid) return;
    // if isEditing update Trip, else store
    if (!tripData.totalBudget) tripData.totalBudget = "0";
    try {
      if (isEditing) {
        await editingTripData(tripData, setActive);
      } else {
        await createTripData(tripData);
      }
    } catch (error) {
      safeLogError(error);
      setIsLoading(false);
      Toast.hide();
      Alert.alert(
        "Sorry! We got an unexpected Error, please try again!",
        error.message
      );
      if (!isEditing) authCtx.logout();
      return;
    }
    setIsLoading(false);
    Toast.hide();
    // sleep 1 second to let the toast disappear
    await sleep(1000);
    navigation.navigate("RecentExpenses");
  }

  function updateCurrency() {
    inputChangedHandler("tripCurrency", countryValue.split(" ")[0]);
  }

  const [infoTitleText, setInfoTitleText] = useState("");
  const [infoContentText, setInfoContentText] = useState("");

  enum infoEnum {
    homeCurrency = 1,
    totalBudget = 2,
    dailyBudget = 3,
    datePicker = 4,
    dynamicDailyBudget = 5,
  }
  function showInfoHandler(infoEnu: infoEnum) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let titleText = "";
    let contentText = "";
    const diffDays = daysBetween(new Date(endDate), new Date(startDate)) + 1;
    const calcDailyBudget = (
      Number(inputs.totalBudget.value) / diffDays
    ).toFixed(2);
    const totalBudget = inputs.totalBudget.value;
    const currency = inputs.tripCurrency.value;
    switch (infoEnu) {
      case infoEnum.homeCurrency:
        titleText = i18n.t("infoHomeCurrencyTitle");
        contentText = i18n.t("infoHomeCurrencyText");
        break;
      case infoEnum.totalBudget:
        titleText = i18n.t("infoTotalBudgetTitle");
        contentText = i18n.t("infoTotalBudgetText");
        break;
      case infoEnum.dailyBudget:
        titleText = i18n.t("infoDailyBudgetTitle");
        contentText = i18n.t("infoDailyBudgetText");
        break;
      case infoEnum.datePicker:
        titleText = i18n.t("infoTripDatesTitle");
        contentText = i18n.t("infoTripDatesText");
        break;
      case infoEnum.dynamicDailyBudget:
        titleText = "Dynamic Budget"; //i18n.t("infoDynamicDailyBudgetTitle");
        contentText =
          "See automatically how much you could spend daily for the rest of your trip to stay in your budget ! The dynamic budget will change with every expense that you enter." +
          ` At the moment your daily Budget would be ${formatExpenseWithCurrency(
            totalBudget,
            currency
          )}/ ${diffDays} days = ${formatExpenseWithCurrency(
            calcDailyBudget,
            currency
          )}`; //i18n.t("infoDynamicDailyBudgetText");
        break;
      default:
        break;
    }
    setInfoTitleText(titleText);
    setInfoContentText(contentText);
    setInfoIsVisible(true);
  }

  const titleString = isEditing
    ? i18n.t("tripFormTitleEdit")
    : i18n.t("tripFormTitleNew");
  const currencyView = isEditing ? (
    <></>
  ) : (
    <View style={styles.currencyPickerContainer}>
      <CurrencyPicker
        placeholder={
          inputs.tripCurrency.value
            ? inputs.tripCurrency.value
            : standardCurrency
        }
        countryValue={countryValue.split(" ")[0]}
        setCountryValue={setCountryValue}
        onChangeValue={updateCurrency}
        valid={inputs.tripCurrency.isValid}
      ></CurrencyPicker>
      <InfoButton
        onPress={showInfoHandler.bind(this, infoEnum.homeCurrency)}
        containerStyle={{ marginTop: "7%" }}
      ></InfoButton>
    </View>
  );

  const validTotalBudgetEntry =
    !isNaN(+inputs.totalBudget.value) &&
    +inputs.totalBudget.value > 0 &&
    +inputs.totalBudget.value < MAX_JS_NUMBER;

  const validDailyBudgetEntry =
    !isNaN(+inputs.dailyBudget.value) &&
    +inputs.dailyBudget.value > 0 &&
    +inputs.dailyBudget.value < MAX_JS_NUMBER;

  const handleClose = () => {
    setInfoIsVisible(false);
  };

  const modalJSX = (
    <Modal
      isVisible={infoIsVisible}
      style={styles.modalStyle}
      backdropOpacity={0.5}
      // animationInTiming={400}
      // animationOutTiming={800}
      onSwipeComplete={handleClose}
      swipeDirection={["up", "left", "right", "down"]}
      onBackdropPress={handleClose}
      onBackButtonPress={handleClose}
    >
      <View style={styles.infoModalContainer}>
        <Text style={styles.infoTitleText}>{infoTitleText}</Text>
        <Text style={styles.infoContentText}>{infoContentText}</Text>
        <FlatButton onPress={setInfoIsVisible.bind(this, false)}>
          {i18n.t("confirm")}
        </FlatButton>
      </View>
    </Modal>
  );

  const headerHeight = useHeaderHeight();
  if (isLoading) {
    return (
      <LoadingBarOverlay
        customText={i18n.t("loadingYourTrip")}
        containerStyle={GlobalStyles.wideStrongShadow}
        progress={loadingProgress == 0 ? null : loadingProgress / 9}
        // progressMax={10}
        // progressAt={loadingProgress}
        barWidth={windowWidth * 0.8}
      />
    );
  }
  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: GlobalStyles.colors.backgroundColor,
      }}
    >
      {datepickerJSX}
      {modalJSX}
      <Animated.View
        entering={FadeInDown.duration(300)}
        exiting={FadeOut}
        style={Platform.select({
          ios: { flex: 1, overflow: "visible" },
          android: {
            flex: 1,
          },
        })}
      >
        <KeyboardAvoidingView
          style={styles.form}
          behavior={Platform.select({ android: undefined, ios: "position" })}
          enabled={Platform.select({ android: true, ios: true })}
          keyboardVerticalOffset={Platform.select({
            android: headerHeight,
            ios: -100,
          })}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginHorizontal: 8,
              marginBottom: -8,
            }}
          >
            <BackButton style={{ marginTop: -8 }}></BackButton>
            {!isEditing && (
              <FlatButton
                onPress={() => {
                  navigation.navigate("Join");
                }}
              >
                {i18n.t("joinTripLabel")}
              </FlatButton>
            )}
            {isEditing && (
              <FlatButton
                onPress={() => {
                  onShare(editedTripId, navigation);
                }}
              >
                {i18n.t("shareTripLabel")}
              </FlatButton>
            )}
          </View>
          <View
            style={[
              styles.card,
              { minHeight: "80%" },
              isEditing && { minHeight: "70%" },
            ]}
          >
            <Text style={styles.title}>{titleString}</Text>

            <Input
              label={i18n.t("tripNameLabel")}
              style={{ flex: 1 }}
              inputStyle={{}}
              textInputConfig={{
                onChangeText: inputChangedHandler.bind(this, "tripName"),
                value: inputs.tripName.value,
              }}
              invalid={!inputs.tripName.isValid}
              autoFocus={false}
            />

            {currencyView}

            <View style={styles.categoryRow}>
              {/* TODO: add recalculate button */}
              <Input
                label={`${i18n.t("totalBudgetLabel")} ${
                  inputs.tripCurrency.value
                }`}
                style={{ flex: 1, marginTop: "-2%" }}
                inputStyle={{}}
                autoFocus={false}
                textInputConfig={{
                  keyboardType: "decimal-pad",
                  onChangeText: inputChangedHandler.bind(this, "totalBudget"),
                  value: inputs.totalBudget.value,
                }}
                invalid={!inputs.totalBudget.isValid}
              />
              {validDailyBudgetEntry && !inputs.isDynamicDailyBudget.value && (
                <Animated.View
                  entering={ZoomIn}
                  exiting={ZoomOut}
                  style={styles.recalcButtonContainer}
                >
                  <IconButton
                    icon="ios-git-compare-outline"
                    color={GlobalStyles.colors.primary500}
                    size={36}
                    buttonStyle={[
                      styles.recalcButton,
                      GlobalStyles.strongShadow,
                    ]}
                    onPressStyle={GlobalStyles.pressedWithShadow}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const diffDays =
                        daysBetween(new Date(endDate), new Date(startDate)) + 1;
                      const calcTotalBudget =
                        Number(inputs.dailyBudget.value) * diffDays;
                      inputChangedHandler(
                        "totalBudget",
                        calcTotalBudget.toString()
                      );
                    }}
                  />
                </Animated.View>
              )}
              <InfoButton
                onPress={showInfoHandler.bind(this, infoEnum.totalBudget)}
                containerStyle={{ marginTop: "-3%" }}
              ></InfoButton>
            </View>

            {!inputs.isDynamicDailyBudget.value && (
              <View>
                <View style={styles.categoryRow}>
                  <Input
                    style={{ flex: 1 }}
                    inputStyle={{}}
                    autoFocus={false}
                    label={`${i18n.t("dailyBudgetLabel")} ${
                      inputs.tripCurrency.value
                    }`}
                    textInputConfig={{
                      keyboardType: "decimal-pad",
                      onChangeText: inputChangedHandler.bind(
                        this,
                        "dailyBudget"
                      ),
                      value: inputs.dailyBudget.value,
                    }}
                    invalid={!inputs.dailyBudget.isValid}
                  />
                  {validTotalBudgetEntry && (
                    <Animated.View
                      entering={ZoomIn}
                      exiting={ZoomOut}
                      style={styles.recalcButtonContainer}
                    >
                      <IconButton
                        icon="ios-git-compare-outline"
                        color={GlobalStyles.colors.primary500}
                        size={36}
                        buttonStyle={[
                          styles.recalcButton,
                          GlobalStyles.strongShadow,
                        ]}
                        onPressStyle={GlobalStyles.pressedWithShadow}
                        onPress={() => {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light
                          );
                          const diffDays =
                            daysBetween(
                              new Date(endDate),
                              new Date(startDate)
                            ) + 1;
                          const calcDailyBudget = (
                            Number(inputs.totalBudget.value) / diffDays
                          ).toFixed(2);
                          inputChangedHandler(
                            "dailyBudget",
                            calcDailyBudget.toString()
                          );
                        }}
                      />
                    </Animated.View>
                  )}
                  <InfoButton
                    onPress={showInfoHandler.bind(this, infoEnum.dailyBudget)}
                    containerStyle={{ marginTop: "-3%" }}
                  ></InfoButton>
                </View>
              </View>
            )}
            <View style={styles.dynamicDailyContainer}>
              <Text style={styles.dynamicDailyLabel}>
                Calculate Daily Budget dynamically
              </Text>
              <Switch
                value={inputs.isDynamicDailyBudget.value}
                style={{ marginRight: "5%" }}
                color={GlobalStyles.colors.primary500}
                onValueChange={(value) => {
                  const calcNewDaily =
                    +inputs.totalBudget.value /
                    daysBetween(new Date(endDate), new Date(startDate));
                  const isAPositiveInt =
                    !isNaN(calcNewDaily) &&
                    calcNewDaily > 0 &&
                    calcNewDaily < MAX_JS_NUMBER;
                  const newDailyBudget =
                    isAPositiveInt && calcNewDaily.toFixed(2);
                  if (!inputs.dailyBudget.value && inputs.totalBudget.value)
                    inputChangedHandler("dailyBudget", newDailyBudget ?? "");
                  inputChangedHandler("isDynamicDailyBudget", value);
                }}
              ></Switch>
              <InfoButton
                onPress={showInfoHandler.bind(
                  this,
                  infoEnum.dynamicDailyBudget
                )}
                containerStyle={{ marginLeft: "-4%" }}
              ></InfoButton>
            </View>
            <Text
              style={[
                styles.label,
                { marginLeft: "5%", marginTop: "2%", marginBottom: "-4%" },
              ]}
            >
              {i18n.t("datePickerLabel")}
            </Text>
            <View style={{ flexDirection: "row" }}>
              {DatePickerContainer({
                openDatePickerRange,
                startDate,
                endDate,
                dateIsRanged: true,
              })}
              <InfoButton
                onPress={showInfoHandler.bind(this, infoEnum.datePicker)}
                containerStyle={{ marginLeft: "-4%" }}
              ></InfoButton>
            </View>
          </View>
          {/* Add Currency Input field */}
          <View style={styles.buttonContainer}>
            <FlatButton onPress={cancelHandler}>{i18n.t("cancel")}</FlatButton>
            {!isEditing ? (
              <GradientButton
                buttonStyle={{}}
                style={styles.button}
                onPress={submitHandler.bind(this, true /* setActive */)}
              >
                {i18n.t("confirm2")}
              </GradientButton>
            ) : (
              <FlatButton
                onPress={submitHandler.bind(this, false /* setActive */)}
              >
                {i18n.t("saveChanges")}
              </FlatButton>
            )}
          </View>
          {/* Horizontal container */}
          {isEditing && (
            <GradientButton
              buttonStyle={{}}
              style={[
                styles.button,
                { marginVertical: 8, marginHorizontal: 24 },
              ]}
              onPress={submitHandler.bind(this, true /* setActive */)}
            >
              {i18n.t("setActive")}
            </GradientButton>
          )}
          {/* {isEditing && (
            <GradientButton
              buttonStyle={{ backgroundColor: GlobalStyles.colors.error300 }}
              style={[styles.button, { marginBottom: 8, marginHorizontal: 24 }]}
              onPress={deleteHandler}
              colors={GlobalStyles.gradientErrorButton}
            >
              {i18n.t("deleteTrip")}
            </GradientButton>
          )} */}
        </KeyboardAvoidingView>
      </Animated.View>
      <View
        style={{
          minHeight: 60,
          zIndex: -10,
          backgroundColor: GlobalStyles.colors.backgroundColor,
        }}
      ></View>
    </ScrollView>
  );
};

export default TripForm;

TripForm.propTypes = {
  navigation: PropTypes.object,
  route: PropTypes.object,
};

const styles = StyleSheet.create({
  form: {
    // flex: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    ...Platform.select({
      ios: {
        padding: "2%",
        minHeight: "100%",
      },
      android: {
        padding: "3%",
        // minHeight: "105%",
      },
    }),
  },
  dynamicDailyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "5%",
    marginTop: "2%",
    justifyContent: "space-between",
  },
  dynamicDailyLabel: {
    fontSize: 12,
    color: GlobalStyles.colors.textColor,
  },
  recalcButtonContainer: {
    marginRight: "2%",
    marginTop: "-2%",
  },
  recalcButton: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 99,
    // minHeight: 36,
    // marginRight: "3%",
    // marginBottom: "5%",
    // paddingHorizontal: "2%",
    // paddingTop: "1%",
    // paddingLeft: "3%",
  },
  card: {
    flex: 1,
    margin: "4%",
    padding: "4%",
    backgroundColor: GlobalStyles.colors.gray500,
    borderRadius: 10,
    borderWidth: 1,
    elevation: 3,
    borderColor: GlobalStyles.colors.gray600,
    shadowColor: GlobalStyles.colors.gray600,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 10,
  },
  label: {
    fontSize: 12,
    color: GlobalStyles.colors.textColor,
    marginBottom: 4,
  },
  currencyPickerContainer: {
    flex: 1,
    flexDirection: "row",
    marginBottom: "4%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: GlobalStyles.colors.textColor,
    marginTop: 5,
    marginBottom: 24,
    textAlign: "center",
  },
  categoryRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  inputsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  errorText: {
    textAlign: "center",
    color: GlobalStyles.colors.error500,
    margin: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",

    marginTop: "4%",
    marginBottom: "2%",
    marginHorizontal: "4%",
  },
  button: {
    minWidth: "35%",
    marginHorizontal: 0,
  },
  modalStyle: {
    justifyContent: "center",
    marginBottom: 40,
  },
  infoModalContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 10,
    padding: "4%",
    margin: "4%",
  },
  infoTitleText: {
    fontSize: 24,
    fontWeight: "bold",
    color: GlobalStyles.colors.textColor,
    marginTop: 5,
    marginBottom: 24,
    textAlign: "center",
  },
  infoContentText: {
    fontSize: 16,
    color: GlobalStyles.colors.textColor,
    marginBottom: 24,
    textAlign: "center",
  },
});
