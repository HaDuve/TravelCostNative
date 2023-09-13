import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useLayoutEffect,
  memo,
  useMemo,
} from "react";
import * as Haptics from "expo-haptics";
import {
  Alert,
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { daysBetween } from "../../util/date";
import { useHeaderHeight } from "@react-navigation/elements";

import { Card, SegmentedButtons, Switch } from "react-native-paper";
import Input from "./Input";
import { getFormattedDate } from "../../util/date";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../store/auth-context";
import IconButton from "../UI/IconButton";
import { UserContext } from "../../store/user-context";
import FlatButton from "../UI/FlatButton";
import {
  DEFAULTCATEGORIES,
  getCatString,
  getCatSymbol,
  getCatSymbolAsync,
  mapDescriptionToCategory,
} from "../../util/category";
import { formatExpenseWithCurrency } from "../../util/string";
import DropDownPicker from "react-native-dropdown-picker";
// import CurrencyPicker from "react-native-currency-picker";
import { TripContext } from "../../store/trip-context";
import {
  calcSplitList,
  recalcSplitsLinearly,
  splitTypesDropdown,
  travellerToDropdown,
  validateSplitList,
} from "../../util/split";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import CurrencyPicker from "../Currency/CurrencyPicker";
import { truncateString } from "../../util/string";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  ZoomIn,
  ZoomOut,
  Layout,
  Easing,
  FadeInUp,
  FadeOutUp,
  set,
} from "react-native-reanimated";
import { DateTime } from "luxon";
import DatePickerModal from "../UI/DatePickerModal";
import DatePickerContainer from "../UI/DatePickerContainer";
import PropTypes from "prop-types";
import GradientButton from "../UI/GradientButton";
import { recalcSplitsForExact } from "../../util/split";
import { DuplicateOption, ExpenseData, isPaidString } from "../../util/expense";
import { NetworkContext } from "../../store/network-context";
import { SettingsContext } from "../../store/settings-context";
import Autocomplete from "../UI/Autocomplete";
import { ExpensesContext, RangeString } from "../../store/expenses-context";
import { getCurrencySymbol } from "../../util/currencySymbol";
import { secureStoreSetItem } from "../../store/secure-storage";
import { TouchableOpacity } from "react-native-gesture-handler";
import { ActivityIndicator } from "react-native-paper";
import BackButton from "../UI/BackButton";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import SettingsSwitch from "../UI/SettingsSwitch";
import CountryPicker from "../Currency/CountryPicker";
import { alertDuplSplitString } from "./ExpenseFormUtil";
import { getMMKVObject } from "../../store/mmkv";

const ExpenseForm = ({
  onCancel,
  onSubmit,
  submitButtonLabel,
  isEditing,
  defaultValues,
  pickedCat,
  navigation,
  editedExpenseId,
  newCat,
  iconName,
}) => {
  // set context
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const netCtx = useContext(NetworkContext);
  const expCtx = useContext(ExpensesContext);
  const { settings } = useContext(SettingsContext);
  const hideSpecial = settings.hideSpecialExpenses;
  const alwaysShowAdvancedSetting = settings.alwaysShowAdvanced || isEditing;
  const editingValues: ExpenseData = defaultValues;
  const lastCurrency = userCtx.lastCurrency
    ? userCtx.lastCurrency
    : tripCtx.tripCurrency;
  const lastCountry = userCtx.lastCountry ? userCtx.lastCountry : "";
  const currencyPlaceholder = isEditing
    ? editingValues.currency + " | " + getCurrencySymbol(editingValues.currency)
    : lastCurrency + " | " + getCurrencySymbol(lastCurrency);
  const countryPlaceholder = isEditing
    ? editingValues.country
    : userCtx.lastCountry ?? "";
  const [hideAdvanced, sethideAdvanced] = useState(true);
  const [currencyPickerValue, setCurrencyPickerValue] = useState(
    isEditing ? editingValues.currency : lastCurrency
  );
  const [countryPickerValue, setCountryPickerValue] = useState(
    isEditing ? editingValues.country : userCtx.lastCountry
  );
  const [loadingTravellers, setLoadingTravellers] = useState(
    !tripCtx.travellers && tripCtx.travellers.length < 1
  );

  const [confirmedRange, setConfirmedRange] = useState(false);
  const [helperStateForDividing, setHelperStateForDividing] = useState(false);
  const [inputs, setInputs] = useState({
    amount: {
      value: editingValues ? editingValues.amount?.toString() : "",
      isValid: true,
    },
    date: {
      value: editingValues
        ? getFormattedDate(editingValues.date)
        : getFormattedDate(DateTime.now().toJSDate()),
      isValid: true,
    },
    description: {
      value: editingValues ? editingValues.description : "",
      isValid: true,
    },
    category: {
      value: editingValues
        ? newCat
          ? pickedCat
          : editingValues.category
        : pickedCat,
      isValid: true,
    },
    country: {
      value: editingValues
        ? editingValues.country
        : userCtx.lastCountry
        ? userCtx.lastCountry
        : "",
      isValid: true,
    },
    currency: {
      value: editingValues
        ? editingValues.currency
        : userCtx.lastCurrency
        ? userCtx.lastCurrency
        : tripCtx.tripCurrency,
      isValid: true,
    },
    whoPaid: {
      value: editingValues ? editingValues.whoPaid : "",
      isValid: true,
    },
  });
  const iconString = iconName ? iconName : getCatSymbol(pickedCat);
  const [icon, setIcon] = useState(iconString);
  const getSetCatIcon = async (catString: string) => {
    const icon = await getCatSymbolAsync(catString);
    setIcon(icon);
  };
  useEffect(() => {
    if (pickedCat) getSetCatIcon(pickedCat);
    else if (editingValues?.category) getSetCatIcon(editingValues?.category);
    else if (editingValues?.iconName) setIcon(editingValues.iconName);
  }, [pickedCat, editingValues?.category, editingValues?.iconName]);

  useEffect(() => {
    const hideAdvanceByDefault = isEditing || alwaysShowAdvancedSetting;
    sethideAdvanced(!hideAdvanceByDefault);
  }, [isEditing, alwaysShowAdvancedSetting, iconName]);

  useEffect(() => {
    if (!tripCtx.travellers || tripCtx.travellers.length < 1)
      setLoadingTravellers(true);
    async function asyncSetTravellers() {
      await tripCtx.fetchAndSetTravellers(tripCtx.tripid);
      setLoadingTravellers(false);
    }
    asyncSetTravellers();
  }, []);

  useEffect(() => {
    // setlistequal with tripcontext.travellers
    if (tripCtx.travellers) setListEQUAL(tripCtx.travellers);
  }, [tripCtx.travellers.length]);

  // datepicker states
  const [showDatePickerRange, setShowDatePickerRange] = useState(false);
  const [startDate, setStartDate] = useState(
    editingValues
      ? getFormattedDate(
          editingValues.startDate
          // DateTime.fromJSDate(editingValues.startDate).toJSDate()
        )
      : getFormattedDate(DateTime.now())
  );
  const [endDate, setEndDate] = useState(
    editingValues
      ? getFormattedDate(editingValues.endDate)
      : // DateTime.fromJSDate(editingValues.endDate).toJSDate())
        getFormattedDate(DateTime.now())
  );
  const [daysBetweenState, setDaysBetweenState] = useState(
    startDate &&
      endDate &&
      daysBetween(new Date(endDate), new Date(startDate)) + 1
  );
  useEffect(() => {
    setDaysBetweenState(
      startDate &&
        endDate &&
        daysBetween(new Date(endDate), new Date(startDate)) + 1
    );
  }, [startDate, endDate]);

  const openDatePickerRange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePickerRange(true);
  };
  const onCancelRange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePickerRange(false);
  };

  const [isPaid, setIsPaid] = useState(
    editingValues?.isPaid ?? isPaidString.notPaid
  );
  const [isSpecialExpense, setIsSpecialExpense] = useState(
    editingValues?.isSpecialExpense ?? false
  );
  // console.log("rerender: special:", isSpecialExpense);

  useEffect(() => {
    // console.log("useEffect ~ tripCtx.isPaidDate", tripCtx?.isPaidDate);
    // console.log("useEffect ~ startDate", startDate);
    // console.log("useEffect ~ editingValues.date", editingValues?.date);
    if (
      tripCtx.isPaidDate &&
      (new Date(tripCtx.isPaidDate) > new Date(startDate) ||
        new Date(tripCtx.isPaidDate) > editingValues.date)
    ) {
      console.log("paid by tripctx");
      setIsPaid(isPaidString.paid);
    }
  }, [tripCtx.isPaidDate, startDate]);

  // duplOrSplit enum:  1 is dupl, 2 is split, 0 is null
  const [duplOrSplit, setDuplOrSplit] = useState<DuplicateOption>(
    editingValues ? Number(editingValues.duplOrSplit) : DuplicateOption.null
  );
  const expenseString = `${formatExpenseWithCurrency(
    Number(inputs.amount.value),
    inputs.currency.value
  )}`;
  const expenseTimesDaysString = formatExpenseWithCurrency(
    Number(inputs.amount.value) * daysBetweenState,
    inputs.currency.value
  );
  const expenseDividedByDaysString = formatExpenseWithCurrency(
    Number(inputs.amount.value) / daysBetweenState,
    inputs.currency.value
  );
  const duplString = `Duplicating ${expenseString} over ${daysBetweenState} days. \nResulting in a ${expenseTimesDaysString} ${i18n.t(
    "total"
  )}`;

  const newExpenseSplitString = `Splitting up the ${expenseString}\nover ${daysBetweenState} days, each ${expenseDividedByDaysString}`;

  const editedSplitString = `Splitting up the ${expenseTimesDaysString}\nover ${daysBetweenState} days, each ${expenseString}`;

  let alreadyDividedAmountByDays = isEditing && duplOrSplit === 2;
  if (helperStateForDividing) alreadyDividedAmountByDays = false;

  const splitString = alreadyDividedAmountByDays
    ? editedSplitString
    : newExpenseSplitString;

  const duplOrSplitString = useCallback(
    (duplOrSplitNum: number) => {
      return duplOrSplitNum === 1
        ? duplString
        : duplOrSplitNum === 2
        ? splitString
        : "";
    },
    [duplString, splitString]
  );

  const onConfirmRange = (expenseOut) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePickerRange(false);
    // hotfixing datebug for asian countries
    const startDate = DateTime.fromJSDate(expenseOut.startDate).toJSDate();
    const endDate = DateTime.fromJSDate(expenseOut.endDate).toJSDate();
    const startDateFormat = getFormattedDate(startDate);
    const endDateFormat = getFormattedDate(endDate);
    setStartDate(startDateFormat);
    setEndDate(endDateFormat);

    setDaysBetweenState(daysBetween(endDate, startDate) + 1);

    // no range
    if (startDateFormat === endDateFormat) {
      inputChangedHandler("date", startDateFormat);
      // multiply amount by number of days to get total
      if (duplOrSplit === DuplicateOption.split) {
        inputChangedHandler(
          "amount",
          (Number(inputs.amount.value) * daysBetweenState).toFixed(2).toString()
        );
      }
      if (
        duplOrSplit === DuplicateOption.split &&
        !alreadyDividedAmountByDays
      ) {
        // divide amount by number of days
        inputChangedHandler(
          "amount",
          (Number(inputs.amount.value) / daysBetweenState).toFixed(2).toString()
        );
      }
      setDuplOrSplit(DuplicateOption.null);
      return;
    }
    if (duplOrSplit == DuplicateOption.null) setConfirmedRange(true);

    // TODO: make this structured
    console.log(daysBetweenState);
  };
  useLayoutEffect(() => {
    if (!confirmedRange) return;
    setConfirmedRange(false);
    Alert.alert(
      `${i18n.t("duplicateExpenses")} / ${i18n.t("splitUpExpenses")}`, //i18n.t("duplOrSplit"),
      `${i18n.t("duplicateExpenses")}: ${duplOrSplitString(1)}\n\n ${i18n.t(
        "splitUpExpenses"
      )}: ${duplOrSplitString(2)}`, //i18n.t("duplOrSplitText"),
      [
        {
          text: "Duplicate", //i18n.t("duplicate"),
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setDuplOrSplit(DuplicateOption.duplicate);
          },
        },
        {
          text: "Split", //i18n.t("split"),
          onPress: () => {
            if (duplOrSplit !== 2) setHelperStateForDividing(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setDuplOrSplit(DuplicateOption.split);
          },
        },
      ],
      { cancelable: false }
    );
  }, [
    startDate,
    endDate,
    inputs.amount.value,
    inputs.currency.value,
    daysBetweenState,
    duplOrSplit,
    confirmedRange,
    duplOrSplitString,
  ]);

  function toggleDuplOrSplit() {
    if (duplOrSplit == 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (duplOrSplit) {
      case DuplicateOption.duplicate: // from dupl to split
        setDuplOrSplit(2);
        break;
      case DuplicateOption.split: // from split to dupl
        setDuplOrSplit(1);
        break;
    }
  }

  // list of all splits owed
  const [splitList, setSplitList] = useState(
    editingValues ? editingValues.splitList : []
  );
  const [splitListValid, setSplitListValid] = useState(true);

  // dropdown for whoPaid picker
  const [currentTravellers, setCurrentTravellers] = useState(
    tripCtx.travellers
  );
  useEffect(() => {
    if (netCtx.strongConnection) {
      console.log("~~ currentTravellers:", tripCtx.travellers);
      setCurrentTravellers(tripCtx.travellers);
    }
  }, [tripCtx.travellers, netCtx.strongConnection]);

  const IsSoloTraveller = currentTravellers.length === 1;
  const [currentTravellersAsItems, setCurrentTravellersAsItems] = useState(
    travellerToDropdown(currentTravellers)
  );

  const [items, setItems] = useState(currentTravellersAsItems);
  const [open, setOpen] = useState(false);
  const [whoPaid, setWhoPaid] = useState(
    editingValues ? editingValues.whoPaid : null
  );

  // dropdown for split/owe picker
  const splitTypesItems = splitTypesDropdown();
  const [splitItems, setSplitTypeItems] = useState(splitTypesItems);
  const [openSplitTypes, setOpenSplitTypes] = useState(false);
  const [splitType, setSplitType] = useState(
    editingValues ? editingValues.splitType : "SELF"
  );

  // dropdown for EQUAL share picker
  const [splitItemsEQUAL, setSplitItemsEQUAL] = useState(
    currentTravellersAsItems
  );
  useEffect(() => {
    setSplitItemsEQUAL(currentTravellersAsItems);
  }, [currentTravellersAsItems.length]);
  const [openEQUAL, setOpenEQUAL] = useState(false);
  const [splitTravellersList, setListEQUAL] = useState(
    editingValues ? editingValues.listEQUAL : currentTravellers
  );

  function autoExpenseLinearSplitAdjust(
    inputIdentifier: string,
    value: string
  ) {
    // calc splitList from amount
    if (
      inputIdentifier === "amount" &&
      (splitType === "EXACT" || splitType === "EQUAL")
    ) {
      // split into equal parts if we are splitting over a ranged date and are editing
      if (duplOrSplit === 2 && isEditing) {
        const newSplitList = recalcSplitsLinearly(
          splitList,
          +inputs.amount.value / daysBetweenState
        );
        setSplitList(newSplitList);
        const isValidSplit = validateSplitList(
          newSplitList,
          splitType,
          +inputs.amount.value
        );
        setSplitListValid(isValidSplit);
      }
      const newSplitList = recalcSplitsLinearly(splitList, +value);
      setSplitList(newSplitList);
      const isValidSplit = validateSplitList(newSplitList, splitType, +value);
      setSplitListValid(isValidSplit);
    }
  }
  const last500Daysexpenses = useMemo(
    () =>
      expCtx.expenses.filter(
        (expense) =>
          expense.date > DateTime.now().minus({ days: 500 }).toJSDate()
      ),
    [expCtx.expenses.length]
  );
  // extract suggestions from all the descriptions of expense state into an array of strings
  const suggestionData = last500Daysexpenses.map(
    (expense) => expense.description
  );

  function autoCategory(inputIdentifier: string, enteredValue: string) {
    // calc category from description
    if (inputIdentifier === "description" && pickedCat === "undefined") {
      const mappedCategory = mapDescriptionToCategory(
        enteredValue,
        // TODO: PUT ALL CATEGORIES
        getMMKVObject("categoryList") ?? DEFAULTCATEGORIES,
        last500Daysexpenses
      );
      if (mappedCategory) {
        setInputs((curInputs) => {
          return {
            ...curInputs,
            ["category"]: { value: mappedCategory, isValid: true },
          };
        });
        const symbol = getCatSymbol(mappedCategory);
        setIcon(symbol);
      }
    }
  }
  useEffect(() => {
    // if Icon is changed, asyncGetCatSymbol
    getCatSymbolAsync(inputs.category.value).then((symbol) => {
      setIcon(symbol);
    });
  }, [inputs.category.value]);

  function inputChangedHandler(inputIdentifier: string, enteredValue: string) {
    setInputs((curInputs) => {
      return {
        ...curInputs,
        [inputIdentifier]: { value: enteredValue, isValid: true },
      };
    });
    autoCategory(inputIdentifier, enteredValue);
    autoExpenseLinearSplitAdjust(inputIdentifier, enteredValue);
  }

  if (splitType === "SELF" || IsSoloTraveller) {
    if (openEQUAL) {
      setOpenEQUAL(false);
    }
  }

  if (splitType === "EQUAL" && openEQUAL) {
    splitHandler();
    setOpenEQUAL(false);
  }

  function openTravellerMultiPicker() {
    console.log("splitType", splitType);
    // add whole traveling group who paid automatically to shared list
    if (!editingValues) {
      setListEQUAL([...currentTravellers]);
    }
    setOpenEQUAL(true);
  }

  function inputSplitListHandler(index, props, value) {
    if (splitType === "EQUAL") return;
    const tempList = [...splitList];
    const tempValue = { amount: value, userName: props.userName };
    tempList[index] = tempValue;
    setSplitList(tempList);
    setSplitListValid(
      validateSplitList(tempList, splitType, +inputs.amount.value)
    );
  }

  function splitHandler() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const splitTravellers = splitTravellersList;
    // calculate splits
    const listSplits = calcSplitList(
      splitType,
      +inputs.amount.value,
      whoPaid,
      splitTravellers
    );
    if (listSplits) {
      setSplitList(listSplits);
    }
  }

  async function resetSplitHandler() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const splitTravellers = splitTravellersList;
    console.log("resetSplitHandler ~ splitTravellers:", splitTravellers);
    // calculate splits
    const listSplits = calcSplitList(
      "EQUAL",
      +inputs.amount.value,
      whoPaid,
      splitTravellers
    );
    if (listSplits) {
      setSplitList(listSplits);
      setSplitListValid(
        validateSplitList(listSplits, splitType, +inputs.amount.value)
      );
    }
  }

  async function submitHandler() {
    const expenseData = {
      uid: authCtx.uid,
      amount: +inputs.amount.value,
      date: DateTime.fromISO(inputs.date.value).toJSDate(),
      startDate: DateTime.fromISO(startDate).toJSDate(),
      endDate: DateTime.fromISO(endDate).toJSDate(),
      description: inputs.description.value,
      category: newCat ? pickedCat : inputs.category.value,
      country: inputs.country.value,
      currency: inputs.currency.value,
      whoPaid: whoPaid, // TODO: convert this to uid
      splitType: splitType,
      listEQUAL: splitTravellersList,
      splitList: splitList,
      duplOrSplit: duplOrSplit,
      iconName: iconName,
      isPaid: isPaid,
      isSpecialExpense: isSpecialExpense,
      alreadyDividedAmountByDays: alreadyDividedAmountByDays,
    };

    // SoloTravellers always pay for themselves
    if (IsSoloTraveller || expenseData.whoPaid === null)
      expenseData.whoPaid = userCtx.userName;
    // If left completely empty, set to  placeholder
    if (expenseData.description === "")
      expenseData.description = getCatString(expenseData.category);

    // validate the expenseData
    const amountIsValid =
      !isNaN(expenseData.amount) &&
      expenseData.amount > 0 &&
      expenseData.amount < 34359738368;
    const dateIsValid = expenseData.date?.toString() !== "Invalid Date";
    const descriptionIsValid = expenseData.description.trim().length > 0;
    const whoPaidIsValid = true;
    const categoryIsValid = true;
    const countryIsValid = true;
    const currencyIsValid = true;

    // split into equal parts if we are splitting over a ranged date and are editing
    if (duplOrSplit === 2 && !isEditing) {
      const newSplitList = recalcSplitsLinearly(
        splitList,
        +inputs.amount.value / daysBetweenState
      );
      setSplitList(newSplitList);
      const isValidSplit = validateSplitList(
        newSplitList,
        splitType,
        +inputs.amount.value
      );
      setSplitListValid(isValidSplit);
    }

    if (
      !amountIsValid ||
      !dateIsValid ||
      !descriptionIsValid ||
      !categoryIsValid ||
      !countryIsValid ||
      !currencyIsValid ||
      !whoPaidIsValid ||
      !splitListValid
    ) {
      setInputs((curInputs) => {
        return {
          amount: {
            value: curInputs.amount.value,
            isValid: amountIsValid,
          },
          date: { value: curInputs.date.value, isValid: dateIsValid },
          description: {
            value: curInputs.description.value,
            isValid: descriptionIsValid,
          },
          category: {
            value: curInputs.category.value,
            isValid: categoryIsValid,
          },
          country: {
            value: curInputs.country.value,
            isValid: countryIsValid,
          },
          currency: {
            value: curInputs.currency.value,
            isValid: currencyIsValid,
          },
          whoPaid: {
            value: curInputs.whoPaid.value,
            isValid: whoPaidIsValid,
          },
        };
      });
      addDefaultValues(pickedCat);
      return;
    }

    // update lastcountry and lastcurrency
    if (inputs.country.value && inputs.country.value !== "") {
      userCtx.setLastCountry(inputs.country.value);
      await secureStoreSetItem("lastCountry", inputs.country.value);
    }
    if (inputs.currency.value && inputs.currency.value !== "") {
      console.log("submitHandler ~ secureStoreSetItem:", "last Currency");
      userCtx.setLastCurrency(inputs.currency.value);
      await secureStoreSetItem("lastCurrency", inputs.currency.value);
    }
    await onSubmit(expenseData);
  }

  async function fastSubmit() {
    const expenseData = {
      uid: authCtx.uid,
      amount: +inputs.amount.value,
      date: DateTime.fromISO(startDate).toJSDate(),
      startDate: DateTime.fromISO(startDate).toJSDate(),
      endDate: DateTime.fromISO(endDate).toJSDate(),
      description: getCatString(pickedCat),
      category: pickedCat,
      country: userCtx.lastCountry ? userCtx.lastCountry : "",
      currency: lastCurrency,
      whoPaid: userCtx.userName,
      splitType: splitType,
      listEQUAL: currentTravellers,
      splitList: splitList,
      iconName: iconName,
      isPaid: isPaid,
      isSpecialExpense: isSpecialExpense,
      duplOrSplit: duplOrSplit,
    };
    await onSubmit(expenseData);
  }

  function addDefaultValues(arg) {
    if (!inputs.description.isValid) {
      inputChangedHandler("description", arg);
    }
    if (!inputs.category.isValid) {
      inputChangedHandler("category", arg);
    }
    if (!inputs.country.isValid) {
      inputChangedHandler("country", userCtx.lastCountry);
    }
    if (!inputs.currency.isValid) {
      inputChangedHandler("currency", userCtx.lastCurrency);
    }
    if (!inputs.whoPaid.isValid) {
      setWhoPaid(userCtx.userName);
    }
  }

  function toggleAdvancedHandler() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (hideAdvanced) {
      sethideAdvanced(false);
    } else {
      sethideAdvanced(true);
    }
  }

  function handleRecalculationSplits() {
    {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newSplitList = recalcSplitsForExact(
        splitList,
        +inputs.amount.value
      );

      setSplitList(newSplitList);
      const isValidSplit = validateSplitList(
        newSplitList,
        splitType,
        +inputs.amount.value
      );
      setSplitListValid(isValidSplit);
      if (!isValidSplit) {
        Alert.alert(i18n.t("sorry"), i18n.t("sorrySplitList"));
      }
    }
  }

  const recalcJSX = splitType == "EXACT" && !splitListValid && (
    <Animated.View
      style={{
        marginTop: -8,
        paddingTop: 8,
        marginLeft: 8,
        // borderWidth: 1,
        // center the content
        flex: 1,
        alignContent: "center",
        justifyContent: "center",
        alignItems: "center",
      }}
      entering={ZoomIn}
      exiting={ZoomOut.duration(100)}
    >
      <Text style={styles.dateLabelDuplSplitText}>{"(Re)-Calculate"}</Text>
      <IconButton
        icon="ios-git-compare-outline"
        color={GlobalStyles.colors.primary500}
        onPressStyle={{ transform: [{ scale: 0.9 }] }}
        buttonStyle={[
          {
            flex: 1,
            flexDirection: "column",
            alignContent: "center",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 8,
            marginLeft: 4,
            borderRadius: 8,
            minHeight: 50,
            minWidth: 90,
            marginRight: 8,
            backgroundColor: GlobalStyles.colors.backgroundColor,
            borderWidth: 1,
            borderColor: GlobalStyles.colors.gray700,
          },
          GlobalStyles.strongShadow,
        ]}
        size={44}
        onPress={() => handleRecalculationSplits()}
        onLongPress={() => resetSplitHandler()}
      />
    </Animated.View>
  );
  const advancedSubmitHandler = async () => {
    // setIsSubmitting(true);
    Toast.show({
      type: "loading",
      text1: i18n.t("toastSaving1"),
      text2: i18n.t("toastSaving2"),
      autoHide: false,
    });
    navigation.popToTop();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    hideAdvanced ? await fastSubmit() : await submitHandler();
    Toast.hide();
  };

  const backButtonJsx = <BackButton />;

  const confirmButtonJSX = (
    <TouchableOpacity
      style={GlobalStyles.backButton}
      onPress={advancedSubmitHandler}
    >
      <IconButton
        icon="checkmark-outline"
        color={GlobalStyles.colors.textColor}
        size={26}
      ></IconButton>
    </TouchableOpacity>
  );

  const isPaidJSX = (
    <View style={styles.isPaidContainer}>
      <SegmentedButtons
        value={isPaid}
        onValueChange={(value: string) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsPaid(value);
        }}
        buttons={[
          {
            label: i18n.t("notPaidLabel"),
            value: isPaidString.notPaid,
            // checkedColor: GlobalStyles.colors.accent500,
            showSelectedCheck: true,
            style: [
              {
                backgroundColor:
                  isPaid == isPaidString.paid
                    ? GlobalStyles.colors.gray500
                    : GlobalStyles.colors.gray300,
              },
              isPaid == isPaidString.paid ? GlobalStyles.strongShadow : null,
            ],
          },
          {
            label: i18n.t("paidLabel"),
            value: isPaidString.paid,
            showSelectedCheck: true,
            style: [
              {
                backgroundColor:
                  isPaid == isPaidString.notPaid
                    ? GlobalStyles.colors.gray500
                    : GlobalStyles.colors.gray300,
              },
              isPaid == isPaidString.notPaid ? GlobalStyles.strongShadow : null,
            ],
            // checkedColor: GlobalStyles.colors.primary500,
          },
        ]}
      ></SegmentedButtons>
    </View>
  );
  const hideSpecialTooltip = hideSpecial
    ? "(hidden)"
    : "\n(can be hidden via settings)";
  const isSpecialExpenseJSX = (
    <View style={styles.isSpecialContainer}>
      <SettingsSwitch
        toggleState={() => setIsSpecialExpense(!isSpecialExpense)}
        label={
          isSpecialExpense
            ? "Special Expense " + hideSpecialTooltip
            : "Special Expense?"
        }
        state={isSpecialExpense}
      ></SettingsSwitch>
    </View>
  );

  const askChatGPTHandler = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("GPTDeal", {
      price: inputs.amount.value,
      currency: inputs.currency.value,
      country: inputs.country.value,
      product: inputs.description.value,
    });
  };

  function updateCurrency() {
    // split the countryValue into country and currency
    const currency = currencyPickerValue?.split("- ")[0]?.split(" ")[0]?.trim();
    // const country = currencyPickerValue?.split("- ")[1].trim();
    inputChangedHandler("currency", currency);
  }

  function updateCountry() {
    const country_EN = countryPickerValue?.split("- ")[0].trim();
    inputChangedHandler("country", country_EN);
  }

  const formIsInvalid =
    !inputs.amount.isValid ||
    !inputs.description.isValid ||
    !inputs.currency.isValid;
  const showWhoPaid = inputs.amount.value !== "";
  const whoPaidValid = whoPaid !== null;
  const splitTypeEqual = splitType === "EQUAL";
  const splitTypeSelf = splitType === "SELF";
  const splitListHasNonZeroEntries = splitList?.some(
    (item) => item.amount !== 0
  );
  const hidePickers = true;
  // console log all 3 dates
  // console.log("startDate", startDate);
  // console.log("endDate", endDate);
  // console.log("date", inputs.date.value);
  let dateIsRanged =
    startDate?.toString().slice(0, 10) !== endDate?.toString().slice(0, 10);
  // if no startDate or no endDate, then date is not ranged
  if (!startDate || !endDate) {
    dateIsRanged = false;
  }
  const datepickerJSX = DatePickerModal({
    showDatePickerRange,
    onCancelRange,
    onConfirmRange,
  });

  const tempValues: ExpenseData = {
    uid: authCtx.uid,
    amount: +inputs.amount.value,
    date: DateTime.fromISO(inputs.date.value).toJSDate(),
    startDate: DateTime.fromISO(startDate).toJSDate(),
    endDate: DateTime.fromISO(endDate).toJSDate(),
    description: inputs.description.value,
    category: newCat ? pickedCat : inputs.category.value,
    country: inputs.country.value,
    currency: inputs.currency.value,
    whoPaid: whoPaid,
    splitType: splitType,
    listEQUAL: splitTravellersList,
    splitList: splitList,
    duplOrSplit: duplOrSplit,
    iconName: iconName,
    categoryString: "",
    calcAmount: 0,
  };

  const headerHeight = useHeaderHeight();
  const hideBottomBorder = duplOrSplit == 1 || duplOrSplit == 2;
  return (
    <>
      {datepickerJSX}
      <Animated.View layout={Layout}>
        <Animated.View layout={Layout} style={styles.container}>
          <View
            style={{
              // horizontal
              flexDirection: "row",
              // space between
              justifyContent: "space-between",
              // align items in the center
              alignItems: "center",
              // padding
              paddingHorizontal: "2%",
              // margin
              marginBottom: "-2%",
              ...Platform.select({
                android: {
                  marginTop: "8%",
                },
              }),
            }}
          >
            {backButtonJsx}
            {Platform.OS == "ios" && confirmButtonJSX}
          </View>
          <Animated.View layout={Layout} style={styles.form}>
            <View style={styles.inputsRow}>
              <Input
                inputStyle={[styles.amountInput, GlobalStyles.strongShadow]}
                label={
                  i18n.t("priceIn") + getCurrencySymbol(inputs.currency.value)
                }
                textInputConfig={{
                  keyboardType: "decimal-pad",
                  onChangeText: inputChangedHandler.bind(this, "amount"),
                  value: inputs.amount.value,
                }}
                invalid={!inputs.amount.isValid}
                autoFocus={!isEditing ?? false}
              />
              <IconButton
                buttonStyle={[styles.iconButton, GlobalStyles.strongShadow]}
                icon={icon}
                color={GlobalStyles.colors.primary500}
                size={48}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate("CategoryPick", {
                    editedExpenseId: editedExpenseId,
                    tempValues: tempValues,
                  });
                }}
              />
            </View>
            {/* always show more options when editing */}
            {!alwaysShowAdvancedSetting && (
              <Pressable onPress={toggleAdvancedHandler}>
                <Animated.View style={styles.advancedRow}>
                  <Ionicons
                    name={
                      hideAdvanced
                        ? "arrow-down-circle-outline"
                        : "arrow-forward-circle-outline"
                    }
                    size={28}
                    color={GlobalStyles.colors.primary500}
                  />
                  {hideAdvanced && (
                    <Text style={styles.advancedText}>
                      {i18n.t("showMoreOptions")}
                    </Text>
                  )}
                  {!hideAdvanced && (
                    <Text style={styles.advancedText}>
                      {i18n.t("showLessOptions")}
                    </Text>
                  )}
                </Animated.View>
              </Pressable>
            )}
            {/* toggleable content */}
            {!hideAdvanced && (
              <Animated.View
                entering={FadeInUp.duration(1000)
                  .easing(Easing.out(Easing.exp))
                  .delay(100)}
                exiting={FadeOutUp.duration(50)}
              >
                <Autocomplete
                  value={inputs.description.value}
                  containerStyle={styles.descriptionContainer}
                  onChange={inputChangedHandler.bind(this, "description")}
                  label={i18n.t("descriptionLabel")}
                  data={suggestionData}
                  style={styles.autoCompleteStyle}
                  menuStyle={styles.autoCompleteMenuStyle}
                ></Autocomplete>
                {/* <Input
                label={i18n.t("descriptionLabel")}
                style={{ marginTop: "6%" }}
                placeholder={pickedCat}
                textInputConfig={{
                  onChangeText: inputChangedHandler.bind(this, "description"),
                  value: inputs.description.value,
                  // multiline: true,
                }}
                invalid={!inputs.description.isValid}
              /> */}

                <View style={styles.currencyContainer}>
                  {/* <Text style={styles.currencyLabel}>
                  {i18n.t("currencyLabel")}
                </Text> */}
                  <CurrencyPicker
                    countryValue={currencyPickerValue}
                    setCountryValue={setCurrencyPickerValue}
                    onChangeValue={updateCurrency}
                    placeholder={currencyPlaceholder}
                  ></CurrencyPicker>
                </View>
                <View style={[styles.inputsRowSecond]}>
                  <View style={styles.countryContainer}>
                    <CountryPicker
                      countryValue={countryPickerValue}
                      setCountryValue={setCountryPickerValue}
                      onChangeValue={updateCountry}
                      placeholder={countryPlaceholder}
                    ></CountryPicker>
                  </View>
                </View>
                <View style={styles.dateLabel}>
                  <Text style={styles.dateLabelText}>
                    {i18n.t("dateLabel")}
                  </Text>
                </View>

                {DatePickerContainer({
                  openDatePickerRange,
                  startDate,
                  endDate,
                  dateIsRanged,
                  hideBottomBorder,
                })}

                <Pressable
                  style={
                    duplOrSplit !== 0 && {
                      paddingBottom: 5,
                      marginHorizontal: "5%",
                      borderBottomColor: GlobalStyles.colors.textColor,
                      borderBottomWidth: 1,
                    }
                  }
                  onPress={() => {
                    // toggleDuplOrSplit();
                  }}
                >
                  {duplOrSplit !== 0 && (
                    <View style={styles.duplOrSplitContainer}>
                      <Text style={styles.dateLabelDuplSplitText}>
                        {duplOrSplitString(duplOrSplit)}
                      </Text>
                      {/* <Switch
                        style={[
                          // { marginLeft: "10%" },
                          GlobalStyles.shadowPrimary,
                        ]}
                        trackColor={{
                          false: GlobalStyles.colors.gray500,
                          true: GlobalStyles.colors.primary500,
                        }}
                        thumbColor={
                          duplOrSplit == 2
                            ? GlobalStyles.colors.backgroundColor
                            : GlobalStyles.colors.gray500Accent
                        }
                        value={duplOrSplit == 2}
                        onChange={() => {
                          toggleDuplOrSplit();
                        }}
                      ></Switch> */}
                    </View>
                  )}
                </Pressable>

                <View style={styles.inputsRowSecond}>
                  {/* !IsSoloTraveller && */}
                  {showWhoPaid && !IsSoloTraveller && (
                    <View style={styles.whoPaidContainer}>
                      <Text
                        style={[
                          styles.currencyLabel,
                          !inputs.whoPaid.isValid && styles.invalidLabel,
                        ]}
                      >
                        {i18n.t("whoPaid")}
                      </Text>
                      {loadingTravellers && (
                        <ActivityIndicator
                          size={"large"}
                          color={GlobalStyles.colors.backgroundColor}
                        ></ActivityIndicator>
                      )}
                      {!loadingTravellers && (
                        <DropDownPicker
                          open={open}
                          value={whoPaid}
                          items={items}
                          setOpen={setOpen}
                          setValue={setWhoPaid}
                          setItems={setItems}
                          onClose={setOpenSplitTypes}
                          onOpen={() => {
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light
                            );
                          }}
                          onSelectItem={() => {
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light
                            );
                          }}
                          listMode="MODAL"
                          modalProps={{
                            animationType: "slide",
                            presentationStyle: "pageSheet",
                          }}
                          searchable={false}
                          modalTitle={i18n.t("whoPaid")}
                          modalContentContainerStyle={{
                            backgroundColor:
                              GlobalStyles.colors.backgroundColor,
                            marginTop: "2%",
                            elevation: 2,
                            shadowColor: GlobalStyles.colors.textColor,
                            shadowOffset: { width: 1, height: 1 },
                            shadowOpacity: 0.35,
                            shadowRadius: 4,
                          }}
                          placeholder={userCtx.userName}
                          containerStyle={styles.dropdownContainer}
                          style={
                            !inputs.whoPaid.isValid
                              ? [styles.dropdown, styles.invalidInput]
                              : styles.dropdown
                          }
                          textStyle={styles.dropdownTextStyle}
                        />
                      )}
                    </View>
                  )}
                  {whoPaidValid && (
                    <DropDownPicker
                      open={openSplitTypes}
                      value={splitType}
                      items={splitItems}
                      setOpen={setOpenSplitTypes}
                      setValue={setSplitType}
                      setItems={setSplitTypeItems}
                      onClose={openTravellerMultiPicker}
                      onOpen={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      onSelectItem={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      listMode="MODAL"
                      modalProps={{
                        animationType: "slide",
                        presentationStyle: "pageSheet",
                      }}
                      searchable={false}
                      modalTitle={i18n.t("howShared")}
                      modalContentContainerStyle={{
                        backgroundColor: GlobalStyles.colors.backgroundColor,
                      }}
                      placeholder="Shared expense?"
                      containerStyle={[
                        styles.dropdownContainer,
                        hidePickers && styles.hidePickersStyle,
                      ]}
                      style={[
                        styles.dropdown,
                        hidePickers && styles.hidePickersStyle,
                      ]}
                      textStyle={styles.dropdownTextStyle}
                    />
                  )}
                </View>
                {!loadingTravellers && !splitTypeSelf && (
                  <DropDownPicker
                    open={openEQUAL}
                    value={splitTravellersList}
                    items={splitItemsEQUAL}
                    setOpen={setOpenEQUAL}
                    onOpen={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    onSelectItem={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    setValue={setListEQUAL}
                    setItems={setSplitItemsEQUAL}
                    onClose={splitHandler}
                    listMode="MODAL"
                    multiple={true}
                    CloseIconComponent={() => (
                      <Text
                        style={{
                          color: GlobalStyles.colors.textColor,
                          fontSize: 24,
                          fontWeight: "bold",
                          padding: 4,
                        }}
                      >
                        {i18n.t("confirm2")}
                      </Text>
                    )}
                    min={1}
                    max={99}
                    labelProps={{ style: { padding: 40 } }}
                    modalProps={{
                      animationType: "slide",
                      presentationStyle: "pageSheet",
                    }}
                    searchable={false}
                    modalTitle={i18n.t("whoShared")}
                    modalContentContainerStyle={{
                      backgroundColor: GlobalStyles.colors.backgroundColor,
                    }}
                    placeholder="Shared between ... ?"
                    containerStyle={[
                      styles.dropdownContainer,
                      hidePickers && styles.hidePickersStyle,
                    ]}
                    style={[
                      styles.dropdown,
                      hidePickers && styles.hidePickersStyle,
                    ]}
                    textStyle={styles.dropdownTextStyle}
                  />
                )}
                <View
                  style={[
                    styles.advancedRowSplit,
                    { marginTop: 12, marginLeft: 12 },
                  ]}
                >
                  {!splitTypeSelf &&
                    whoPaidValid &&
                    !IsSoloTraveller &&
                    splitListHasNonZeroEntries && (
                      <Text
                        style={[
                          styles.currencyLabel,
                          { marginTop: 20, marginBottom: 20 },
                        ]}
                      >
                        {i18n.t("whoShared")}
                      </Text>
                    )}
                </View>

                {!splitTypeSelf && (
                  <KeyboardAvoidingView
                    behavior={Platform.select({
                      android: undefined,
                      ios: "position",
                    })}
                    keyboardVerticalOffset={Platform.select({
                      android: headerHeight,
                      ios: 0,
                    })}
                    contentContainerStyle={{
                      flex: 1,
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      overflow: "visible",
                      backgroundColor: GlobalStyles.colors.gray500,
                    }}
                  >
                    <FlatList
                      // numColumns={2}
                      data={splitList}
                      horizontal={true}
                      contentContainerStyle={{
                        flex: 1,
                        minWidth: "110%",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        overflow: "visible",
                      }}
                      ListHeaderComponent={recalcJSX}
                      ListFooterComponent={<View style={{ width: 100 }}></View>}
                      renderItem={(itemData) => {
                        const splitValue = itemData.item.amount.toString();
                        return (
                          <View
                            style={[
                              GlobalStyles.strongShadow,
                              {
                                // flex: 1,
                                minWidth: 100,
                                // maxWidth: 100,
                                marginTop: 14,
                                marginBottom: 8,
                                borderWidth: 1,
                                borderRadius: 12,
                                padding: 8,
                                margin: 8,
                                backgroundColor:
                                  GlobalStyles.colors.backgroundColor,
                                borderColor: GlobalStyles.colors.gray700,
                                //centering content
                                justifyContent: "center",
                                alignItems: "center",
                                overflow: "visible",
                              },
                            ]}
                          >
                            <Text
                              style={{
                                color: splitListValid
                                  ? GlobalStyles.colors.textColor
                                  : GlobalStyles.colors.error500,
                                textAlign: "left",
                                marginLeft: 8,
                                paddingTop: 2,
                                marginBottom: -16,
                              }}
                            >
                              {truncateString(itemData.item.userName, 10)}
                            </Text>
                            {/* Horizontal container  */}
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "flex-start",
                                alignItems: "flex-end",
                                overflow: "visible",
                                // borderWidth: 1,
                                marginLeft: -16,
                                marginRight: -8,
                              }}
                            >
                              <Input
                                inputStyle={[
                                  splitTypeEqual && {
                                    color: GlobalStyles.colors.textColor,
                                  },
                                  { paddingBottom: 4 },
                                  {
                                    backgroundColor:
                                      GlobalStyles.colors.backgroundColor,
                                  },
                                ]}
                                textInputConfig={{
                                  onFocus: () => {
                                    if (splitType === "EQUAL")
                                      Keyboard.dismiss();
                                  },
                                  keyboardType: "decimal-pad",
                                  onChangeText: inputSplitListHandler.bind(
                                    this,
                                    itemData.index,
                                    itemData.item
                                  ),
                                  value: splitValue ? splitValue : "",
                                }}
                              ></Input>
                              <Text
                                style={{
                                  paddingBottom: 11,
                                  marginLeft: -18,
                                  marginRight: 8,
                                }}
                              >
                                {getCurrencySymbol(inputs.currency.value)}
                              </Text>
                            </View>
                          </View>
                        );
                      }}
                    ></FlatList>
                  </KeyboardAvoidingView>
                )}
                {!splitTypeSelf && splitListHasNonZeroEntries && isPaidJSX}
                {isSpecialExpenseJSX}
              </Animated.View>
            )}
            {formIsInvalid && !hideAdvanced && (
              <Text style={styles.errorText}>{i18n.t("invalidInput")} </Text>
            )}
          </Animated.View>
          <View
            style={[
              styles.spacerViewAdvanced,
              hideAdvanced && styles.spacerView,
            ]}
          ></View>
          <View style={styles.buttonContainer}>
            <FlatButton onPress={onCancel}>{i18n.t("cancel")}</FlatButton>
            <GradientButton
              style={styles.button}
              onPress={async () => await advancedSubmitHandler()}
            >
              {submitButtonLabel}
            </GradientButton>
          </View>
          {/* Commented out ChatGPT Button */}
          {!hideAdvanced &&
            inputs.description.value &&
            inputs.currency.value &&
            inputs.country.value && (
              <View style={[styles.buttonContainer, { marginBottom: "5%" }]}>
                <GradientButton
                  style={[styles.button, { marginTop: 28, minWidth: "80%" }]}
                  colors={GlobalStyles.gradientColorsButton}
                  onPress={askChatGPTHandler}
                  darkText
                >
                  {/* {!inputs.amount.value && i18n.t("askChatGptPre")} */}
                  {!inputs.amount.value &&
                    "AskGPT: What would be a good Price?"}
                  {inputs.amount.value && isEditing && i18n.t("askChatGptPost")}
                  {inputs.amount.value && !isEditing && i18n.t("askChatGptPre")}
                </GradientButton>
              </View>
            )}
        </Animated.View>
      </Animated.View>
    </>
  );
};

export default ExpenseForm;

ExpenseForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  setIsSubmitting: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  defaultValues: PropTypes.shape({
    amount: PropTypes.number,
    date: PropTypes.instanceOf(Date),
    description: PropTypes.string,
    category: PropTypes.string,
    country: PropTypes.string,
    currency: PropTypes.string,
    whoPaid: PropTypes.string,
    splitType: PropTypes.string,
    listEQUAL: PropTypes.arrayOf(
      PropTypes.shape({
        userName: PropTypes.string,
        amount: PropTypes.number,
      })
    ),
    splitList: PropTypes.arrayOf(
      PropTypes.shape({
        userName: PropTypes.string,
        amount: PropTypes.number,
      })
    ),
    duplOrSplit: PropTypes.number,
  }),
  pickedCat: PropTypes.string,
  submitButtonLabel: PropTypes.string,
  navigation: PropTypes.object,
  editedExpenseId: PropTypes.string,
  newCat: PropTypes.bool,
  iconName: PropTypes.string,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: "20%",
    overflow: "visible",
  },
  form: {
    flex: 1,
    margin: "4.5%",
    padding: "2%",
    paddingBottom: "5%",
    marginTop: "5%",
    backgroundColor: GlobalStyles.colors.gray500,
    borderRadius: 5,
    borderWidth: 1,
    elevation: 3,
    borderColor: GlobalStyles.colors.gray600,
    shadowColor: GlobalStyles.colors.gray600,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.75,
    // justifyContent: "space-around",
    // alignContent: "stretch",
  },
  amountInput: {
    minWidth: "50%",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray700,
    padding: 8,
    marginTop: 8,
  },

  iconButton: {
    borderWidth: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderColor: GlobalStyles.colors.gray700,
    borderRadius: 8,
    padding: 8,
    margin: 8,
  },
  descriptionContainer: {
    flex: 1,
    marginTop: "5%",

    marginHorizontal: "3.5%",
    marginLeft: "5%",
  },
  autoCompleteStyle: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.gray500,
    borderRadius: 5,
    // marginLeft: -8,
  },
  autoCompleteMenuStyle: {
    marginLeft: 8,
    marginBottom: -1,
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.primaryGrayed,
  },
  countryFlagContainer: {
    marginRight: "5%",
    marginTop: 20,
  },
  countryFlag: {
    width: 60,
    height: 40,
    borderRadius: 4,
  },

  topCurrencyPressableContainer: {
    padding: 8,
    marginLeft: -120,
  },
  topCurrencyText: {
    fontSize: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: GlobalStyles.colors.backgroundColor,
    marginTop: 5,
    marginBottom: 24,
    textAlign: "center",
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  inputsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputsRowSecond: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  advancedRow: {
    marginTop: "6%",
    marginLeft: "2%",
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  errorText: {
    textAlign: "center",
    color: GlobalStyles.colors.error500,
    margin: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "baseline",
  },
  currencyContainer: {
    maxWidth: "100%",
    marginBottom: "2%",
    // borderBottomWidth: 1,
    // borderBottomColor: GlobalStyles.colors.gray700,
  },
  countryContainer: {
    maxWidth: "100%",
    marginLeft: "1%",
  },
  currencyLabel: {
    fontSize: 13,
    color: GlobalStyles.colors.textColor,
    marginBottom: 4,
  },
  whoPaidContainer: {
    marginTop: 12,
    marginHorizontal: 16,
  },
  button: {
    minWidth: 200,
    marginHorizontal: 0,
    marginVertical: 4,
  },
  advancedText: {
    marginTop: 9,
    marginLeft: 12,
    fontSize: 12,
    fontStyle: "italic",
    fontWeight: "300",
  },
  dateLabel: {
    marginTop: "4%",
    marginHorizontal: "5.5%",
    // row
    flexDirection: "row",
    // justifyContent: "space-between",
  },
  dateLabelText: {
    fontSize: 12,
    fontWeight: "400",
    color: GlobalStyles.colors.textColor,
  },
  dateLabelDuplSplitText: {
    fontSize: 12,
    fontWeight: "300",
    fontStyle: "italic",
    marginLeft: "2%",
    color: GlobalStyles.colors.textColor,
  },

  dateIconContainer: {
    marginLeft: "2.5%",
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomColor: GlobalStyles.colors.gray700,
    borderBottomWidth: 1,
    marginHorizontal: "5%",
    marginTop: "4%",
    paddingBottom: 4,
  },
  dropdownContainer: {
    marginTop: -12,
    maxWidth: Dimensions.get("screen").width / 1.27,
    marginRight: 12,
  },
  dropdown: {
    backgroundColor: GlobalStyles.colors.gray500,
    borderWidth: 0,
    marginTop: 12,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderRadius: 0,
    borderBottomColor: GlobalStyles.colors.gray700,
  },
  dropdownTextStyle: {
    fontSize: 18,
    color: GlobalStyles.colors.textColor,
    padding: 4,
  },
  hidePickersStyle: {
    maxHeight: 0,
    maxWidth: 0,
    opacity: 0,
  },
  advancedRowSplit: {
    marginLeft: 36,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  invalidLabel: {
    color: GlobalStyles.colors.error500,
  },
  invalidInput: {
    backgroundColor: GlobalStyles.colors.error50,
  },
  spacerView: {
    flex: 1,
    minHeight: "55%",
  },
  spacerViewAdvanced: {
    flex: 1,
    minHeight: "4%",
  },
  isPaidContainer: {
    marginTop: "4%",
    marginHorizontal: "3%",
  },
  isSpecialContainer: {
    marginTop: "8%",
    marginHorizontal: "6%",
  },
  duplOrSplitContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch",
    padding: 8,
    margin: 4,
    overflow: "visible",
  },
});
