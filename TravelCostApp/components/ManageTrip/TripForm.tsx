import React from "react";
import { useState, useContext, useEffect, useLayoutEffect } from "react";
import { View, Text, Alert, ScrollView } from "react-native";
import { StyleSheet } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../store/auth-context";
import {
  storeTrip,
  storeTripHistory,
  storeTravellerToTrip,
  updateUser,
  fetchTrip,
  updateTripHistory,
  updateTrip,
  deleteTrip,
  getAllExpenses,
} from "../../util/http";
import * as Updates from "expo-updates";

import Input from "../ManageExpense/Input";
import { TripContext, TripData } from "../../store/trip-context";
import { UserContext } from "../../store/user-context";
import Button from "../UI/Button";
import FlatButton from "../UI/FlatButton";
import { ExpensesContext } from "../../store/expenses-context";
import CurrencyPicker from "../Currency/CurrencyPicker";
import CurrencyInput from "react-currency-input-field";
import { asyncStoreSetItem } from "../../store/async-storage";

//localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
// i18n.locale = "en";
i18n.enableFallback = true;

import LoadingOverlay from "../UI/LoadingOverlay";
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
import { MAX_JS_NUMBER } from "../../confAppConstants";
import Animated, { ZoomIn, ZoomOut } from "react-native-reanimated";
import { reloadApp } from "../../util/appState";
import { secureStoreSetItem } from "../../store/secure-storage";
import BackButton from "../UI/BackButton";

const TripForm = ({ navigation, route }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [infoIsVisible, setInfoIsVisible] = useState(false);

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
      value: "",
      isValid: true,
    },
    dailyBudget: {
      value: "",
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
    const setEditedTrip = async () => {
      setIsLoading(true);
      try {
        const selectedTrip = await fetchTrip(editedTripId);
        inputChangedHandler("tripName", selectedTrip.tripName);
        inputChangedHandler("tripCurrency", selectedTrip.tripCurrency);
        inputChangedHandler("dailyBudget", selectedTrip.dailyBudget.toString());
        inputChangedHandler(
          "totalBudget",
          selectedTrip.totalBudget?.toString()
        );
        setStartDate(selectedTrip.startDate);
        setEndDate(selectedTrip.endDate);
      } catch (error) {
        console.error(error);
      }
      setIsLoading(false);
    };
    if (isEditing) {
      setEditedTrip();
    }
  }, [editedTripId, isEditing]);

  const tripCtx = useContext(TripContext);
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const expenseCtx = useContext(ExpensesContext);

  const [countryValue, setCountryValue] = useState(
    inputs?.tripCurrency ? inputs.tripCurrency.value : i18n.t("currencyLabel")
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

  async function deleteAcceptHandler() {
    const trips = route.params.trips;
    console.log("deleteAcceptHandler ~ trips:", trips);
    // if triplist.length == 1 userCtx.setFreshlyCreatedTo(true);
    // await deleteTrip(editedTripId);
  }
  function deleteHandler() {
    Alert.alert(
      i18n.t("deleteTrip"),
      i18n.t("deleteTripSure"),
      [
        {
          text: i18n.t("cancel"),
          style: "cancel",
        },
        {
          // text: i18n.t("delete"),
          text: i18n.t("delete"),
          style: "destructive",
          onPress: async () => {
            deleteAcceptHandler();
            navigation.pop();
          },
        },
      ],
      { cancelable: false }
    );
  }

  async function submitHandler(setActive = false) {
    const tripData: TripData = {
      tripName: inputs.tripName.value,
      totalBudget: inputs.totalBudget.value,
      tripCurrency: inputs.tripCurrency.value,
      dailyBudget: inputs.dailyBudget.value,
      startDate: startDate,
      endDate: endDate,
      tripid: "",
      travellers: {},
    };

    // Tripname should not be empty
    const tripNameIsValid =
      tripData.tripName !== "" && tripData.tripName.length > 0;
    // tripCurrency should not be empty
    const tripCurrencyIsValid =
      tripData.tripCurrency !== "" && tripData.tripCurrency.length > 0;
    // Total budget should be a number between 0 and 3B
    const totalBudgetIsValid =
      !inputs.totalBudget.value ||
      (!isNaN(+tripData.totalBudget) &&
        +tripData.totalBudget >= 0 &&
        +tripData.totalBudget < MAX_JS_NUMBER &&
        tripData.totalBudget > tripData.dailyBudget);

    const dailyBudgetIsValid =
      !isNaN(+tripData.dailyBudget) &&
      +tripData.dailyBudget > 0 &&
      +tripData.dailyBudget < MAX_JS_NUMBER &&
      (!inputs.totalBudget.value ||
        tripData.dailyBudget < tripData.totalBudget);

    if (!tripNameIsValid) {
      inputs.tripName.isValid = tripNameIsValid;
      Alert.alert(i18n.t("enterNameAlert"));
      return;
    }

    if (!totalBudgetIsValid || !dailyBudgetIsValid) {
      inputs.totalBudget.isValid = totalBudgetIsValid;
      inputs.dailyBudget.isValid = dailyBudgetIsValid;
      Alert.alert(i18n.t("enterBudgetAlert"));
      return;
    }

    if (!tripCurrencyIsValid) {
      inputs.tripCurrency.isValid = tripCurrencyIsValid;
      Alert.alert(i18n.t("selectCurrencyAlert"));
      return;
    }
    // if isEditing update Trip, else store
    console.log("submitHandler ~ setActive:", setActive);
    if (isEditing) {
      await updateTrip(editedTripId, tripData);
      if (editedTripId === tripCtx.tripid || setActive) {
        updateUser(uid, {
          currentTrip: editedTripId,
        });
        tripCtx.setCurrentTrip(editedTripId, tripData);
        await tripCtx.setCurrentTravellers(editedTripId);
        userCtx.setFreshlyCreatedTo(false);
        const expenses = await getAllExpenses(editedTripId, uid);
        expenseCtx.setExpenses(expenses);
        const r = await reloadApp();
        if (r === -1) navigation.popToTop();
      }
      tripCtx.refresh();
      navigation.pop();
      return;
    }
    const tripid = await storeTrip(tripData);
    console.log("TripForm ~ tripid before setItem:", tripid);
    await secureStoreSetItem("currentTripId", tripid);
    await storeTravellerToTrip(tripid, { userName: userName, uid: uid });

    const newTripData = await fetchTrip(tripid);

    tripCtx.setCurrentTrip(tripid, newTripData);
    // if fresh store TripHistory else update TripHistory
    if (userCtx.freshlyCreated) {
      await storeTripHistory(uid, [tripid]);
    } else {
      await updateTripHistory(uid, tripid);
    }

    updateUser(uid, {
      userName: userName,
      currentTrip: tripid,
    });

    if (userCtx.freshlyCreated) {
      userCtx.setNeedsTour(true);
    }
    userCtx.setFreshlyCreatedTo(false);
    // restart app with Updates
    const r = await reloadApp();
    if (r === -1) navigation.popToTop();
    // expenseCtx.setExpenses([]);

    // tripCtx.refresh();
    // navigation.navigate("Profile");
  }

  function updateCurrency() {
    inputChangedHandler("tripCurrency", countryValue.split(" ")[2]);
  }

  const [infoTitleText, setInfoTitleText] = useState("");
  const [infoContentText, setInfoContentText] = useState("");

  enum infoEnum {
    homeCurrency = 1,
    totalBudget = 2,
    dailyBudget = 3,
    datePicker = 4,
  }
  function showInfoHandler(infoEnu: infoEnum) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let titleText = "";
    let contentText = "";
    switch (infoEnu) {
      case infoEnum.homeCurrency:
        titleText = "Home Currency Info"; //i18n.t("currencyInfoTitle");
        contentText =
          "Setup your home currency here (e.g. the currency from the country in which you live)." +
          "\n\n The country will not be saved and is only helpful for finding your currency." +
          "\n\n This currency will be presented in the app and all other currencies you use on your trip will be converted into this one."; //i18n.t("currencyInfoContent");
        break;
      case infoEnum.totalBudget:
        titleText = "Total Budget Info";
        contentText =
          "Setup your total budget here (e.g. the amount of money for the entire trip)." +
          "\n\n You can press the calculate button to auto-calculate the Total Budget from the Daily Budget * Trip Start and End Date." + //i18n.t("currencyInfoContent");
          "\n\n The total Budget is optional.";
        break;
      case infoEnum.dailyBudget:
        titleText = "Daily Budget Info";
        contentText =
          "Setup your Daily budget here (e.g. the average amount of money to spend per day)." +
          "If you don't know how much exactly you want to spend, just write down an estimate." +
          "\n\n You can press the calculate button to auto-calculate the Daily Budget from the Total Budget / Trip Start and End Date."; //i18n.t("currencyInfoContent");
        break;
      case infoEnum.datePicker:
        titleText = "Trip Start and End Info";
        contentText =
          "Setup your Trip Start and End Date here (e.g. the dates of your trip)." +
          "\n\n The trip start and end is optional.";
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
            : i18n.t("baseCurrency")
        }
        countryValue={countryValue.split(" ")[0]}
        setCountryValue={setCountryValue}
        onChangeValue={updateCurrency}
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
          Okay
        </FlatButton>
      </View>
    </Modal>
  );

  if (isLoading) {
    return <LoadingOverlay />;
  }
  return (
    <>
      {datepickerJSX}
      {modalJSX}
      <ScrollView style={{ flex: 1, overflow: "visible" }}>
        <View style={styles.form}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginHorizontal: 8,
              marginBottom: -8,
            }}
          >
            <BackButton style={{ marginTop: -8 }}></BackButton>
            <FlatButton
              onPress={() => {
                navigation.navigate("Join");
              }}
            >
              {i18n.t("joinTripLabel")}
            </FlatButton>
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
              {validDailyBudgetEntry && (
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
                      console.log("recalculate");
                      console.log("Start Date:", startDate);
                      console.log("End Date:", endDate);
                      const diffDays =
                        daysBetween(new Date(endDate), new Date(startDate)) + 1;
                      console.log("Days:", diffDays);
                      const calcTotalBudget =
                        Number(inputs.dailyBudget.value) * diffDays;
                      console.log("Total calc:", calcTotalBudget);
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
                  onChangeText: inputChangedHandler.bind(this, "dailyBudget"),
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
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      console.log("recalculate");
                      console.log("Start Date:", startDate);
                      console.log("End Date:", endDate);
                      const diffDays =
                        daysBetween(new Date(endDate), new Date(startDate)) + 1;
                      console.log("Days:", diffDays);
                      const calcDailyBudget = (
                        Number(inputs.totalBudget.value) / diffDays
                      ).toFixed(2);
                      console.log("Daily calc:", calcDailyBudget);
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
        </View>
      </ScrollView>
      <View
        style={{
          minHeight: 60,
          zIndex: -10,
          backgroundColor: GlobalStyles.colors.backgroundColor,
        }}
      ></View>
    </>
  );
};

export default TripForm;

TripForm.propTypes = {
  navigation: PropTypes.object,
  route: PropTypes.object,
};

const styles = StyleSheet.create({
  form: {
    flex: 1,
    minHeight: "100%",
    padding: "2%",
    backgroundColor: GlobalStyles.colors.backgroundColor,
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
