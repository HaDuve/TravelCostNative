import React from "react";
import { useState, useContext, useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  Alert,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { StyleSheet } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import { shadowRegressionStyles } from "../../styles/shadow-regression-styles";
import { AuthContext } from "../../store/auth-context";
import {
  storeTrip,
  storeTripHistory,
  updateUser,
  fetchTrip,
  updateTripHistory,
  updateTrip,
  getAllExpenses,
  getTravellers,
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

import { i18n } from "../../i18n/i18n";
import * as Localization from "expo-localization";

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
import {
  secureStoreGetItem,
  secureStoreSetItem,
} from "../../store/secure-storage";
import { activateTrip } from "../../util/activate-trip";
import { resolveLeaverOpenBalances } from "../../util/leave-trip";
import { promptLeaveTrip } from "../../util/prompt-leave-trip";
import BackButton from "../UI/BackButton";
import { onShare } from "../ProfileOutput/ShareTrip";
import { NetworkContext } from "../../store/network-context";
import { getMMKVObject, MMKV_KEYS, setMMKVObject } from "../../store/mmkv";
import LoadingBarOverlay from "../UI/LoadingBarOverlay";
import { Switch } from "react-native-paper";
import { formatExpenseWithCurrency } from "../../util/string";
import { isPremiumMember } from "../Premium/PremiumConstants";
import Toast from "react-native-toast-message";
import { sleep } from "../../util/appState";
import safeLogError from "../../util/error";
import { dynamicScale } from "../../util/scalingUtil";
import { trackEvent } from "../../util/vexo-tracking";
import { VexoEvents } from "../../util/vexo-constants";
import { getTripData } from "../../util/trip";
import { countableTripsTowardNonPremiumLimit } from "../../util/implicit-default-trip";
import {
  buildTripFormSubmitData,
  hasOptionalTripFormValues,
  resolveTripFormMode,
  shouldConfirmCurrencyChange,
  type TripFormMode,
} from "../../util/trip-form";
import { hasDailyBudget, hasTotalBudget } from "../../util/budget-free";

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
  const windowWidth = dynamicScale(350);
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

  // datepicker states — unset by default (no invented today→+7 window)
  const [showDatePickerRange, setShowDatePickerRange] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travellers, setTravellers] = useState([]);
  const [loadedIsImplicitDefault, setLoadedIsImplicitDefault] = useState(
    false
  );
  const [optionalDetailsOpen, setOptionalDetailsOpen] = useState(false);

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
  const formMode: TripFormMode = resolveTripFormMode(route.params, {
    isImplicitDefault: loadedIsImplicitDefault || tripCtx.isImplicitDefault,
  });
  const isPromote = formMode === "promote";
  const isAddAnother = formMode === "addAnother";

  useLayoutEffect(() => {
    const applyLoadedTrip = (selectedTrip: TripData) => {
      const daily =
        selectedTrip.dailyBudget !== undefined &&
        selectedTrip.dailyBudget !== null
          ? String(selectedTrip.dailyBudget)
          : "";
      const total =
        selectedTrip.totalBudget !== undefined &&
        selectedTrip.totalBudget !== null
          ? String(selectedTrip.totalBudget)
          : "";
      inputChangedHandler("tripName", selectedTrip.tripName ?? "");
      inputChangedHandler("tripCurrency", selectedTrip.tripCurrency);
      inputChangedHandler("dailyBudget", daily === "0" ? "" : daily);
      inputChangedHandler(
        "totalBudget",
        total === "0" || Number(total) >= MAX_JS_NUMBER ? "" : total
      );
      inputChangedHandler(
        "isDynamicDailyBudget",
        selectedTrip.isDynamicDailyBudget
      );
      setStartDate(selectedTrip.startDate ?? "");
      setEndDate(selectedTrip.endDate ?? "");
      setTravellers(selectedTrip.travellers ?? []);
      setLoadedIsImplicitDefault(selectedTrip.isImplicitDefault === true);
      setOptionalDetailsOpen(
        hasOptionalTripFormValues({
          ...selectedTrip,
          dailyBudget: daily,
          totalBudget: total,
        })
      );
    };

    const fetchTripData = async () => {
      try {
        const selectedTrip = await fetchTrip(editedTripId);
        applyLoadedTrip(selectedTrip);
      } catch (error) {
        safeLogError(error);
      }
      setIsLoading(false);
    };
    function loadTripDataFromContext() {
      // if we are editing a trip, we load the data from the context
      // no need to fetch it from the server in that case
      if (tripCtx.tripid == editedTripId) {
        applyLoadedTrip({
          tripName: tripCtx.tripName,
          totalBudget: tripCtx.totalBudget,
          dailyBudget: tripCtx.dailyBudget,
          tripCurrency: tripCtx.tripCurrency,
          isDynamicDailyBudget: tripCtx.isDynamicDailyBudget,
          startDate: tripCtx.startDate,
          endDate: tripCtx.endDate,
          travellers: tripCtx.travellers,
          isImplicitDefault: tripCtx.isImplicitDefault,
        });
        setIsLoading(false);
        return;
      } else {
        setIsLoading(true);
      }
    }

    if (isEditing && editedTripId) {
      loadTripDataFromContext();
      fetchTripData();
    } else if (isAddAnother) {
      setOptionalDetailsOpen(false);
    }
  }, [
    editedTripId,
    isEditing,
    isAddAnother,
    tripCtx.dailyBudget,
    tripCtx.totalBudget,
    tripCtx.tripCurrency,
    tripCtx.tripName,
    tripCtx.tripid,
    tripCtx.isDynamicDailyBudget,
    tripCtx.startDate,
    tripCtx.endDate,
    tripCtx.travellers,
    tripCtx.isImplicitDefault,
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

  function leaverOpenBalancesDeps() {
    return {
      activeTripId: tripCtx.tripid,
      activeExpenses: expenseCtx.expenses ?? [],
      activeTripCurrency: tripCtx.tripCurrency,
      activeIsPaidTimestamp: tripCtx.isPaidTimestamp,
      fallbackTripCurrency: inputs.tripCurrency.value,
      userNameFallback: userCtx.userName,
      getAllExpenses,
      fetchTrip,
    };
  }

  async function leaveAcceptHandler() {
    const uid = authCtx.uid ?? (await secureStoreGetItem("uid"));
    if (!uid || !editedTripId) return;

    Toast.show({
      type: "loading",
      text1: i18n.t("toastSaving1"),
      text2: i18n.t("toastSaving2"),
      autoHide: false,
    });

    try {
      const roster = await getTravellers(editedTripId);
      const openBalances = await resolveLeaverOpenBalances(
        editedTripId,
        uid,
        roster,
        leaverOpenBalancesDeps()
      );
      const result = await tripCtx.leaveTrip(editedTripId, {
        uid,
        tripHistory: userCtx.tripHistory ?? [],
        getTravellers,
        openBalances,
        removeFromTripHistoryLocal: userCtx.removeTripFromHistory,
        restoreTripHistoryLocal: userCtx.restoreTripHistory,
        activate: {
          previousTripSnapshot: tripCtx.getcurrentTrip(),
          previousExpensesSnapshot: expenseCtx.expenses,
          fetchTrip,
          getTravellers,
          getAllExpenses,
          updateUser,
          secureStoreGetItem,
          secureStoreSetItem,
          setCurrentTrip: tripCtx.setCurrentTrip,
          saveTripDataInStorage: tripCtx.saveTripDataInStorage,
          saveTravellersInStorage: tripCtx.saveTravellersInStorage,
          setExpenses: expenseCtx.setExpenses,
          setExpensesCache: (nextExpenses) =>
            setMMKVObject(MMKV_KEYS.EXPENSES, nextExpenses),
          setFreshlyCreatedTo: userCtx.setFreshlyCreatedTo,
        },
      });

      if (!result.performed) {
        Toast.hide();
        Toast.show({
          text1: i18n.t("toastSavingError1"),
          text2: i18n.t("error2"),
          type: "error",
        });
        return;
      }
      // Plain leave: leaveTrip shows Undo toast. Cascade-delete: no Undo.
      navigation.pop();
    } catch (error) {
      safeLogError(error);
      Toast.hide();
      Toast.show({
        text1: i18n.t("toastSavingError1"),
        text2: i18n.t("error2"),
        type: "error",
      });
    }
  }

  async function leaveHandler() {
    if (!editedTripId) return;
    const uid = authCtx.uid ?? (await secureStoreGetItem("uid"));
    if (!uid) return;
    await promptLeaveTrip({
      isConnected,
      tripid: editedTripId,
      uid,
      tripHistory: userCtx.tripHistory ?? [],
      activeTripId: tripCtx.tripid,
      getTravellers,
      openBalancesDeps: leaverOpenBalancesDeps(),
      onConfirm: () => {
        void leaveAcceptHandler();
      },
    });
  }

  async function editingTripData(tripData: TripData, setActive = false) {
    try {
      await updateTrip(editedTripId, tripData);

      // Track trip edit
      trackEvent(VexoEvents.TRIP_EDITED, {
        tripId: editedTripId,
        setActive: setActive,
      });

      setLoadingProgress(1);
      if (editedTripId === tripCtx.tripid || setActive) {
        setLoadingProgress(4);
        await activateTrip(editedTripId, {
          uid,
          tripData,
          previousTripSnapshot: tripCtx.getcurrentTrip(),
          previousExpensesSnapshot: expenseCtx.expenses,
          fetchTrip,
          getTravellers,
          getAllExpenses,
          updateUser,
          secureStoreGetItem,
          secureStoreSetItem,
          setCurrentTrip: tripCtx.setCurrentTrip,
          saveTripDataInStorage: tripCtx.saveTripDataInStorage,
          saveTravellersInStorage: tripCtx.saveTravellersInStorage,
          setExpenses: expenseCtx.setExpenses,
          setExpensesCache: (nextExpenses) =>
            setMMKVObject(MMKV_KEYS.EXPENSES, nextExpenses),
          setFreshlyCreatedTo: userCtx.setFreshlyCreatedTo,
        });
        setLoadingProgress(9);
        return;
      }
      Toast.hide();
      return;
    } catch (error) {
      safeLogError(error);
      navigation.popToTop();
      Toast.hide();
      throw error;
    }
  }

  async function createTripData(tripData: TripData) {
    setLoadingProgress(1);
    const currentCategories = getMMKVObject(MMKV_KEYS.CATEGORY_LIST);
    // auto convert current categories into  new trips data
    // stored online as a stringified array
    if (currentCategories)
      tripData.categories = JSON.stringify(currentCategories);

    const tripid = await storeTrip(tripData);

    // Track trip creation
    trackEvent(VexoEvents.TRIP_CREATED, {
      tripName: tripData.tripName,
      tripCurrency: tripData.tripCurrency,
      hasTotalBudget: !!tripData.totalBudget,
      hasDailyBudget: !!tripData.dailyBudget,
      isDynamicDailyBudget: tripData.isDynamicDailyBudget,
    });

    setLoadingProgress(2);
    await putTravelerInTrip(tripid, { userName: userName, uid: uid });
    setLoadingProgress(4);

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

    // Secure + server + context mirrors + empty ledger via activateTrip.
    await activateTrip(tripid, {
      uid,
      tripData: { ...tripData, tripid },
      previousTripSnapshot: tripCtx.getcurrentTrip(),
      previousExpensesSnapshot: expenseCtx.expenses,
      fetchTrip,
      getTravellers,
      getAllExpenses: async () => [],
      updateUser: async (userId, data) => {
        await updateUser(userId, {
          userName: userName,
          currentTrip: data.currentTrip,
        });
      },
      secureStoreGetItem,
      secureStoreSetItem,
      setCurrentTrip: tripCtx.setCurrentTrip,
      saveTripDataInStorage: tripCtx.saveTripDataInStorage,
      saveTravellersInStorage: tripCtx.saveTravellersInStorage,
      setExpenses: expenseCtx.setExpenses,
      setExpensesCache: (nextExpenses) =>
        setMMKVObject(MMKV_KEYS.EXPENSES, nextExpenses),
      setFreshlyCreatedTo: userCtx.setFreshlyCreatedTo,
    });
    setLoadingProgress(9);

    navigation.navigate("RecentExpenses");
  }

  const isLimitedByPremium = async () => {
    const isPremium = await isPremiumMember();
    if (isPremium) return false;
    const tripHistory = userCtx.tripHistory ?? [];
    const trips = await Promise.all(
      tripHistory.map(async (tripid) => {
        try {
          return await getTripData(tripid);
        } catch (error) {
          safeLogError(error);
          return null;
        }
      })
    );
    return (
      countableTripsTowardNonPremiumLimit(trips) >= MAX_TRIPS_NONPREMIUM
    );
  };

  function checkFormValidity(tripData: TripData) {
    // Tripname should not be empty or spaces
    const tripNameIsValid =
      tripData.tripName && tripData.tripName.trim()?.length > 0;
    // tripCurrency should not be empty
    const tripCurrencyIsValid =
      tripData.tripCurrency && tripData.tripCurrency?.length > 0;
    // Total budget optional; when both set, total must exceed daily
    const hasTotal = hasTotalBudget(tripData);
    const hasDaily = hasDailyBudget(tripData);
    const totalBudgetIsValid =
      !hasTotal ||
      (!isNaN(+tripData.totalBudget) &&
        +tripData.totalBudget >= 0 &&
        +tripData.totalBudget < MAX_JS_NUMBER &&
        (!hasDaily || +tripData.totalBudget > +tripData.dailyBudget));

    const dynamicIsValid =
      !tripData.isDynamicDailyBudget ||
      (tripData.isDynamicDailyBudget && hasTotal);

    // Daily optional (budget-free allowed); when set must be positive
    const dailyBudgetIsValid =
      !hasDaily ||
      (!isNaN(+tripData.dailyBudget) &&
        +tripData.dailyBudget > 0 &&
        +tripData.dailyBudget < MAX_JS_NUMBER &&
        (!hasTotal || +tripData.dailyBudget < +tripData.totalBudget));

    if (!tripNameIsValid) {
      inputs.tripName.isValid = tripNameIsValid;
      Alert.alert(i18n.t("enterNameAlert"));
      setIsLoading(false);
      Toast.hide();
      return false;
    }

    if (!dynamicIsValid) {
      inputs.totalBudget.isValid = dynamicIsValid;
      Alert.alert(i18n.t("error"), i18n.t("enterTotalBudgetNumber"));
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
    if (!isConnected) {
      Alert.alert(i18n.t("noConnection"), i18n.t("checkConnectionError"));
      setIsLoading(false);
      return;
    }
    const wasImplicitDefault =
      loadedIsImplicitDefault ||
      tripCtx.isImplicitDefault === true ||
      isPromote;
    const tripData: TripData = buildTripFormSubmitData({
      mode: formMode,
      tripName: inputs.tripName.value,
      totalBudget: inputs.totalBudget.value,
      tripCurrency: inputs.tripCurrency.value,
      dailyBudget: inputs.dailyBudget.value,
      startDate,
      endDate,
      tripid: editedTripId,
      travellers: travellers,
      isDynamicDailyBudget: inputs.isDynamicDailyBudget.value,
      wasImplicitDefault,
    });

    const formIsValid = checkFormValidity(tripData);
    if (!formIsValid) return;

    navigation.pop();
    Toast.show({
      type: "loading",
      text1: i18n.t("toastSaving1"),
      text2: i18n.t("toastSaving2"),
      autoHide: false,
    });
    try {
      if (isEditing) {
        await editingTripData(tripData, setActive || wasImplicitDefault);
      } else {
        await createTripData(tripData);
      }
    } catch (error) {
      safeLogError(error);
      setIsLoading(false);
      Toast.hide();
      Toast.show({
        text1: i18n.t("toastSavingError1"),
        text2: i18n.t("error2"),
        type: "error",
      });
      if (!isEditing && userCtx.freshlyCreated) {
        authCtx.logout(tripCtx.tripid);
        return;
      }
      navigation.navigate("RecentExpenses");
      return;
    }
    setIsLoading(false);
    Toast.hide();
    // sleep 1 second to let the toast disappear
    await sleep(1000);
    navigation.navigate("RecentExpenses");
  }

  function updateCurrency() {
    if (!countryValue || countryValue.length < 1) return;
    const apply = () => {
      inputChangedHandler("tripCurrency", countryValue?.split(" ")[0]);
    };
    const expenseCount = Array.isArray(expenseCtx.expenses)
      ? expenseCtx.expenses.length
      : 0;
    if (
      !shouldConfirmCurrencyChange({
        isEditing,
        expenseCount,
      })
    ) {
      apply();
      return;
    }
    Alert.alert(
      i18n.t("alertChangeHomeCurrencyTitle"),
      i18n.t("alertChangeHomeCurrencyMessage"),
      [
        {
          text: i18n.t("cancel"),
          style: "cancel",
        },
        {
          text: i18n.t("yes"),
          style: "destructive",
          onPress: apply,
        },
      ]
    );
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

  const titleString =
    formMode === "promote"
      ? i18n.t("tripFormTitlePromote")
      : formMode === "addAnother"
        ? i18n.t("tripFormTitleAddAnother")
        : i18n.t("tripFormTitleEdit");
  const subtitleString =
    formMode === "addAnother" ? i18n.t("tripFormSubtitleAddAnother") : "";
  const currencyView = (
    <View style={styles.currencyPickerContainer}>
      <CurrencyPicker
        placeholder={
          inputs.tripCurrency.value
            ? inputs.tripCurrency.value
            : standardCurrency
        }
        countryValue={countryValue?.split(" ")[0] || ""}
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
        containerStyle={shadowRegressionStyles.toastSurface}
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
              marginHorizontal: dynamicScale(8, false, 0.5),
              marginBottom: dynamicScale(-8, false, 0.5),
            }}
          >
            <BackButton style={{ marginTop: dynamicScale(-8) }}></BackButton>
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
            <Text style={styles.title} testID="trip-form-title">
              {titleString}
            </Text>
            {!!subtitleString && (
              <Text style={styles.subtitle} testID="trip-form-subtitle">
                {subtitleString}
              </Text>
            )}

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

            <Pressable
              testID="trip-form-optional-toggle"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setOptionalDetailsOpen((open) => !open);
              }}
              style={styles.optionalToggle}
            >
              <Text style={styles.optionalToggleText}>
                {i18n.t("tripFormOptionalDetails")}
                {optionalDetailsOpen ? " ▲" : " ▼"}
              </Text>
            </Pressable>

            {optionalDetailsOpen && (
              <View testID="trip-form-optional-section">
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
                      onChangeText: inputChangedHandler.bind(
                        this,
                        "totalBudget"
                      ),
                      value: inputs.totalBudget.value,
                    }}
                    invalid={!inputs.totalBudget.isValid}
                  />
                  {validDailyBudgetEntry &&
                    !inputs.isDynamicDailyBudget.value &&
                    !!startDate &&
                    !!endDate && (
                      <Animated.View
                        entering={ZoomIn}
                        exiting={ZoomOut}
                        style={styles.recalcButtonContainer}
                      >
                        <IconButton
                          icon="git-compare-outline"
                          color={GlobalStyles.colors.primary500}
                          size={dynamicScale(36, false, 0.5)}
                          buttonStyle={styles.recalcButton}
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
                      {validTotalBudgetEntry && !!startDate && !!endDate && (
                        <Animated.View
                          entering={ZoomIn}
                          exiting={ZoomOut}
                          style={styles.recalcButtonContainer}
                        >
                          <IconButton
                            icon="git-compare-outline"
                            color={GlobalStyles.colors.primary500}
                            size={dynamicScale(36, false, 0.5)}
                            buttonStyle={styles.recalcButton}
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
                        onPress={showInfoHandler.bind(
                          this,
                          infoEnum.dailyBudget
                        )}
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
                      if (startDate && endDate) {
                        const calcNewDaily =
                          +inputs.totalBudget.value /
                          daysBetween(new Date(endDate), new Date(startDate));
                        const isAPositiveInt =
                          !isNaN(calcNewDaily) &&
                          calcNewDaily > 0 &&
                          calcNewDaily < MAX_JS_NUMBER;
                        const newDailyBudget =
                          isAPositiveInt && calcNewDaily.toFixed(2);
                        if (
                          !inputs.dailyBudget.value &&
                          inputs.totalBudget.value
                        )
                          inputChangedHandler(
                            "dailyBudget",
                            newDailyBudget ?? ""
                          );
                      }
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
            )}
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
          {isEditing && !isPromote && (
            <GradientButton
              buttonStyle={{}}
              style={[
                styles.button,
                {
                  marginVertical: dynamicScale(8, false, 0.5),
                  marginHorizontal: dynamicScale(24, false, 0.5),
                },
              ]}
              onPress={() => {
                trackEvent(VexoEvents.SET_ACTIVE_TRIP_PRESSED, {
                  tripId: editedTripId,
                });
                submitHandler(true /* setActive */);
              }}
            >
              {i18n.t("setActive")}
            </GradientButton>
          )}
          {isEditing && !isPromote && (userCtx.tripHistory?.length ?? 0) > 1 && (
            <GradientButton
              buttonStyle={{
                backgroundColor: GlobalStyles.colors.error300,
                opacity: isConnected ? 1 : 0.5,
              }}
              style={[
                styles.button,
                {
                  marginBottom: dynamicScale(8, false, 0.5),
                  marginHorizontal: dynamicScale(24, false, 0.5),
                },
              ]}
              onPress={leaveHandler}
              colors={GlobalStyles.gradientErrorButton}
            >
              {i18n.t("leaveTrip")}
            </GradientButton>
          )}
        </KeyboardAvoidingView>
      </Animated.View>
      <View
        style={{
          minHeight: dynamicScale(60, false, 0.5),
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
    fontSize: dynamicScale(12, false, 0.5),
    color: GlobalStyles.colors.textColor,
  },
  recalcButtonContainer: {
    marginRight: "2%",
    marginTop: "-2%",
  },
  recalcButton: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 99,
    ...GlobalStyles.strongShadow,
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
    fontSize: dynamicScale(12, false, 0.5),
    color: GlobalStyles.colors.textColor,
    marginBottom: 4,
  },
  currencyPickerContainer: {
    flex: 1,
    flexDirection: "row",
    marginBottom: "4%",
  },
  title: {
    fontSize: dynamicScale(24, false, 0.5),
    fontWeight: "bold",
    color: GlobalStyles.colors.textColor,
    marginTop: dynamicScale(5, false, 0.5),
    marginBottom: dynamicScale(8, false, 0.5),
    textAlign: "center",
  },
  subtitle: {
    fontSize: dynamicScale(14, false, 0.5),
    color: GlobalStyles.colors.textColor,
    marginBottom: dynamicScale(16, false, 0.5),
    textAlign: "center",
    opacity: 0.8,
  },
  optionalToggle: {
    paddingVertical: dynamicScale(10, false, 0.5),
    marginBottom: dynamicScale(4, false, 0.5),
  },
  optionalToggleText: {
    fontSize: dynamicScale(14, false, 0.5),
    fontWeight: "600",
    color: GlobalStyles.colors.primary500,
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
    margin: dynamicScale(8, false, 0.5),
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
    marginBottom: dynamicScale(40, false, 0.5),
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
    fontSize: dynamicScale(24, false, 0.5),
    fontWeight: "bold",
    color: GlobalStyles.colors.textColor,
    marginTop: dynamicScale(5, false, 0.5),
    marginBottom: dynamicScale(24, false, 0.5),
    textAlign: "center",
  },
  infoContentText: {
    fontSize: dynamicScale(16, false, 0.5),
    color: GlobalStyles.colors.textColor,
    marginBottom: dynamicScale(24, false, 0.5),
    textAlign: "center",
  },
});
