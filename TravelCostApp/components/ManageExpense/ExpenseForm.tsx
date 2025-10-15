import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useLayoutEffect,
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
  KeyboardAvoidingView,
  InputAccessoryView,
  Image,
} from "react-native";
import { daysBetween } from "../../util/date";
import { useHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect } from "@react-navigation/native";

import { SegmentedButtons } from "react-native-paper";
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
  getCatSymbolMMKV,
  mapDescriptionToCategory,
} from "../../util/category";
import { formatExpenseWithCurrency } from "../../util/string";
import DropDownPicker from "react-native-dropdown-picker";
// import CurrencyPicker from "react-native-currency-picker";
import { TripContext } from "../../store/trip-context";
import {
  calcSplitList,
  recalcSplitsLinearly,
  splitType,
  splitTypesDropdown,
  travellerToDropdown,
  validateSplitList,
} from "../../util/split";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import CurrencyPicker from "../Currency/CurrencyPicker";
import { truncateString } from "../../util/string";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  ZoomIn,
  ZoomOut,
  Easing,
  FadeInUp,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";
import { DateTime } from "luxon";
import DatePickerModal from "../UI/DatePickerModal";
import DatePickerContainer from "../UI/DatePickerContainer";
import GradientButton from "../UI/GradientButton";
import { recalcSplitsForExact } from "../../util/split";
import { DuplicateOption, ExpenseData, isPaidString } from "../../util/expense";
import { NetworkContext } from "../../store/network-context";
import { SettingsContext } from "../../store/settings-context";
import Autocomplete from "../UI/Autocomplete";
import { ExpensesContext } from "../../store/expenses-context";
import { getCurrencySymbol } from "../../util/currencySymbol";
import { secureStoreSetItem } from "../../store/secure-storage";
import { ActivityIndicator } from "react-native-paper";
import BackButton from "../UI/BackButton";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import SettingsSwitch from "../UI/SettingsSwitch";
import CountryPicker from "../Currency/CountryPicker";
import {
  getMMKVObject,
  setExpenseCat,
  getExpenseCat,
  setExpenseDraft,
  getExpenseDraft,
  clearExpenseDraft,
  IDCat,
  clearExpenseCat,
} from "../../store/mmkv";
import ExpenseCountryFlag from "../ExpensesOutput/ExpenseCountryFlag";
import { Platform } from "react-native";
import { isPremiumMember } from "../Premium/PremiumConstants";
import { MAX_EXPENSES_PERTRIP_NONPREMIUM } from "../../confAppConstants";
import { constantScale, dynamicScale } from "../../util/scalingUtil";
import { getRate } from "../../util/currencyExchange";
import { OrientationContext } from "../../store/orientation-context";
import { callDebounced } from "../Hooks/useDebounce";
import { NavigationProp } from "@react-navigation/native";

// Modal state machine for cascading flows
const modalStates = {
  NONE: "none",
  WHO_PAID: "whoPaid",
  HOW_SHARED: "howShared",
  EXACT_SHARING: "exactSharing",
};

const splitTypes: { [key: string]: splitType } & {
  EQUAL: splitType;
  EXACT: splitType;
  PERCENT: splitType;
  SELF: splitType;
} = {
  EQUAL: "EQUAL",
  EXACT: "EXACT",
  PERCENT: "PERCENT",
  SELF: "SELF",
} as const;

export type ExpenseFormProps = {
  onCancel: () => void;
  onSubmit: (expenseData: ExpenseData) => Promise<void>;
  submitButtonLabel: string;
  isEditing: boolean;
  defaultValues: ExpenseData;
  pickedCat: string;
  navigation: NavigationProp<any>;
  editedExpenseId: string;
  newCat: boolean;
  iconName: string;
  dateISO: string;
};

const ExpenseForm: React.FC<ExpenseFormProps> = ({
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
  dateISO,
}) => {
  // set context
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const netCtx = useContext(NetworkContext);
  const expCtx = useContext(ExpensesContext);
  const { settings } = useContext(SettingsContext);
  const { isPortrait, isTablet } = useContext(OrientationContext);
  const hideSpecial = settings.hideSpecialExpenses;
  const alwaysShowAdvancedSetting = settings.alwaysShowAdvanced || isEditing;
  const editingValues: ExpenseData = defaultValues;

  // Helper function to get most recent valid expense from current trip for defaults
  const getMostRecentTripExpense = useCallback(() => {
    if (!expCtx.expenses || expCtx.expenses.length === 0) {
      return null;
    }

    // Find the most recent expense with valid currency and country data
    for (const expense of expCtx.expenses) {
      if (
        expense.currency &&
        expense.currency.trim() !== "" &&
        expense.country &&
        expense.country.trim() !== ""
      ) {
        return expense;
      }
    }

    // If no expense has both currency and country, return the most recent one
    return expCtx.expenses[0] || null;
  }, [expCtx.expenses]);

  const mostRecentExpense = getMostRecentTripExpense();

  const lastCurrency = userCtx.lastCurrency
    ? userCtx.lastCurrency
    : tripCtx.tripCurrency;
  const currencyPlaceholder = isEditing
    ? editingValues.currency + " | " + getCurrencySymbol(editingValues.currency)
    : lastCurrency + " | " + getCurrencySymbol(lastCurrency);
  const countryPlaceholder = isEditing
    ? editingValues.country
    : (userCtx.lastCountry ?? "");
  const [hideAdvanced, sethideAdvanced] = useState(true);
  const [currencyPickerValue, setCurrencyPickerValue] = useState(
    isEditing ? editingValues.currency : lastCurrency
  );
  const [countryPickerValue, setCountryPickerValue] = useState(
    isEditing ? editingValues.country : userCtx.lastCountry
  );
  const [loadingTravellers, setLoadingTravellers] = useState(
    !tripCtx.travellers && tripCtx.travellers?.length < 1
  );

  const [confirmedRange, setConfirmedRange] = useState(false);
  const [helperStateForDividing, setHelperStateForDividing] = useState(false);
  const [inputs, setInputs] = useState({
    amount: {
      value:
        editingValues && editingValues.amount > 0
          ? editingValues.amount.toString()
          : "",
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
        : mostRecentExpense?.country
          ? mostRecentExpense.country
          : userCtx.lastCountry
            ? userCtx.lastCountry
            : "",
      isValid: true,
    },
    currency: {
      value: editingValues
        ? editingValues.currency
        : mostRecentExpense?.currency
          ? mostRecentExpense.currency
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
  const [tempAmount, setTempAmount] = useState("");
  const hasTempAndInput = !!(inputs.amount.value && tempAmount);
  const tmpInputSum = +inputs.amount.value + +tempAmount;
  const amountValue = hasTempAndInput
    ? tmpInputSum
    : inputs.amount.value.length > 0
      ? inputs.amount.value
      : tempAmount;

  const hasCalcAmount =
    amountValue &&
    inputs.currency.value &&
    inputs.currency.value !== tripCtx.tripCurrency;

  // list of all splits owed
  const [splitList, setSplitList] = useState(
    editingValues ? editingValues.splitList : []
  );
  const [splitListValid, setSplitListValid] = useState(true);

  // dropdown for whoPaid picker
  const [currentTravellers, setCurrentTravellers] = useState(
    tripCtx.travellers
  );

  const [calcAmount, setCalcAmount] = useState("");
  const [splitListCalcAmounts, setSplitListCalcAmounts] = useState([""]);
  useEffect(() => {
    async function getCalcAmount() {
      // calc calcAmount from amount, currency and TripCtx.tripCurrency and add it to expenseData
      const base = tripCtx.tripCurrency;
      const target = inputs.currency.value;
      const rate = await getRate(base, target);
      const calcAmount = +amountValue / rate;

      // if expenseData has a splitlist, add the rate to each split
      const splitListsCalcAmountsList = [];
      if (splitList && splitList?.length > 0) {
        splitList.forEach((split) => {
          split.rate = rate;
          splitListsCalcAmountsList.push(
            (split.amount / split.rate).toFixed(2)
          );
        });
      }
      if (!hasCalcAmount || rate == -1 || rate == 1) {
        setCalcAmount("");
        setSplitListCalcAmounts([""]);
        return;
      }
      setSplitListCalcAmounts(splitListsCalcAmountsList);
      setCalcAmount(calcAmount.toFixed(2));
    }
    getCalcAmount();
  }, [
    inputs.amount.value,
    inputs.currency.value,
    tripCtx.tripCurrency,
    splitList,
    amountValue,
    hasCalcAmount,
  ]);

  const iconString = iconName ? iconName : getCatSymbol(pickedCat);
  const [icon, setIcon] = useState(iconString);
  const getSetCatIcon = async (catString: string) => {
    const icon = getCatSymbolMMKV(catString);
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
    if (!tripCtx.travellers || tripCtx.travellers?.length < 1)
      setLoadingTravellers(true);
    async function asyncSetTravellers() {
      await tripCtx.fetchAndSetTravellers(tripCtx.tripid);
      setLoadingTravellers(false);
    }
    asyncSetTravellers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // setlistequal with tripcontext.travellers
    if (tripCtx.travellers) setListEQUAL(tripCtx.travellers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripCtx.travellers?.length]);

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
  const daysBeween =
    startDate && endDate
      ? daysBetween(new Date(endDate), new Date(startDate)) + 1
      : 1;

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

  useEffect(() => {
    if (
      tripCtx.isPaidDate &&
      (startDate || editingValues?.date) &&
      (new Date(tripCtx.isPaidDate) > new Date(startDate) ||
        new Date(tripCtx.isPaidDate) > editingValues?.date)
    ) {
      setIsPaid(isPaidString.paid);
    }
  }, [tripCtx.isPaidDate, startDate, editingValues?.date]);

  useEffect(() => {
    if (dateISO) {
      setStartDate(dateISO);
      setEndDate(dateISO);
      setInputs((curInputs) => {
        return {
          ...curInputs,
          ["date"]: { value: dateISO, isValid: true },
        };
      });
    }
  }, [dateISO]);

  // duplOrSplit enum:  1 is dupl, 2 is split, 0 is null
  const [duplOrSplit, setDuplOrSplit] = useState<DuplicateOption>(
    editingValues ? Number(editingValues.duplOrSplit) : DuplicateOption.null
  );

  const expenseString = `${formatExpenseWithCurrency(
    Number(amountValue),
    inputs.currency.value
  )}`;
  const expenseTimesDaysString = formatExpenseWithCurrency(
    Number(amountValue) * daysBeween,
    inputs.currency.value
  );
  const expenseDividedByDaysString = formatExpenseWithCurrency(
    Number(amountValue) / daysBeween,
    inputs.currency.value
  );
  const duplString = `${i18n.t("duplString1")} ${expenseString} ${i18n.t(
    "duplString2"
  )} ${daysBeween} ${i18n.t("duplString3")}. \n${i18n.t(
    "duplString4"
  )} ${expenseTimesDaysString} ${i18n.t("total")}`;

  const newExpenseSplitString = `${i18n.t(
    "splitString1"
  )} ${expenseString}\n${i18n.t("splitString2")} ${daysBeween} ${i18n.t(
    "splitString3"
  )} ${expenseDividedByDaysString}`;

  const editedSplitString = `${i18n.t(
    "splitString1"
  )} ${expenseTimesDaysString}\n${i18n.t(
    "splitString2"
  )} ${daysBeween} ${i18n.t("splitString3")} ${expenseString}`;

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
    // no range
    if (startDateFormat === endDateFormat) {
      inputChangedHandler("date", startDateFormat);
      // multiply amount by number of days to get total
      if (duplOrSplit === DuplicateOption.split) {
        inputChangedHandler(
          "amount",
          (Number(amountValue) * daysBeween).toFixed(2).toString()
        );
      }
      if (
        duplOrSplit === DuplicateOption.split &&
        !alreadyDividedAmountByDays
      ) {
        // divide amount by number of days
        inputChangedHandler(
          "amount",
          (Number(amountValue) / daysBeween).toFixed(2).toString()
        );
      }
      setDuplOrSplit(DuplicateOption.null);
      return;
    }
    if (duplOrSplit == DuplicateOption.null) setConfirmedRange(true);

    // TODO: make this structured
    // console.log(daysBeween);
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
          text: i18n.t("duplicateExpenses"), //i18n.t("duplicate"),
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setDuplOrSplit(DuplicateOption.duplicate);
          },
        },
        {
          text: i18n.t("splitUpExpenses"), //i18n.t("split"),
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
    amountValue,
    inputs.currency.value,
    daysBeween,
    duplOrSplit,
    confirmedRange,
    duplOrSplitString,
  ]);

  useEffect(() => {
    if (netCtx.strongConnection) {
      // console.log("~~ currentTravellers:", tripCtx.travellers);
      setCurrentTravellers(tripCtx.travellers);
    }
  }, [tripCtx.travellers, netCtx.strongConnection]);

  const IsSoloTraveller = currentTravellers?.length === 1;
  const currentTravellersAsItems = useCallback(
    () => travellerToDropdown(currentTravellers, true),
    [currentTravellers]
  );

  const [modalFlow, setModalFlow] = useState(modalStates.NONE);

  const nextModal = (selectedValue) => {
    switch (modalFlow) {
      case modalStates.WHO_PAID:
        if (selectedValue === "__ADD_TRAVELLER__") {
          setModalFlow(modalStates.NONE); // Go to share screen, no more modals
        } else {
          // Close current modal and open next one after a brief delay
          setModalFlow(modalStates.NONE);
          setTimeout(() => {
            setModalFlow(modalStates.HOW_SHARED);
          }, 100);
        }
        break;

      case modalStates.HOW_SHARED:
        if (selectedValue === splitTypes.EXACT) {
          setModalFlow(modalStates.NONE);
          setTimeout(() => {
            setModalFlow(modalStates.EXACT_SHARING);
          }, 100);
        } else {
          setSplitType(splitTypes.EQUAL);
          splitHandler();
          setModalFlow(modalStates.NONE); // EQUAL/SELF, flow complete
        }
        break;

      case modalStates.EXACT_SHARING:
        setModalFlow(modalStates.NONE);
        setTimeout(() => {
          openTravellerMultiPicker(); // Open the traveller picker
        }, 100);
        break;

      default:
        setModalFlow(modalStates.NONE);
    }
  };

  const [items, setItems] = useState(currentTravellersAsItems);
  const [whoPaid, setWhoPaid] = useState(
    editingValues ? editingValues.whoPaid : null
  );

  // Wrap setWhoPaid with logging
  const setWhoPaidWithLogging = (value) => {
    setWhoPaidWithAutoSave(value);
  };

  // Custom setValue handler to handle both normal selections and special __ADD_TRAVELLER__ case
  const handleWhoPaidChange = (value) => {
    // Ignore function objects (weird DropDownPicker behavior for special case)
    if (typeof value === "function") {
      return;
    }

    // Handle normal string values
    if (value === "__ADD_TRAVELLER__") {
      setWhoPaidWithLogging(userCtx.userName);
    } else {
      setWhoPaidWithLogging(value);
    }
  };
  const isAndroid = Platform.OS == "android";

  // dropdown for split/owe picker
  const splitTypesItems = splitTypesDropdown();
  const [splitItems, setSplitTypeItems] = useState(splitTypesItems);
  // Removed: const [openSplitTypes, setOpenSplitTypes] = useState(false); - using modalFlow state machine
  const [splitType, setSplitType] = useState<splitType>(
    editingValues ? editingValues.splitType : splitTypes.SELF
  );

  // dropdown for EQUAL share picker (without add traveller option)
  const currentTravellersForEqualSplit = useCallback(
    () => travellerToDropdown(currentTravellers, false),
    [currentTravellers]
  );
  const [splitItemsEQUAL, setSplitItemsEQUAL] = useState(
    currentTravellersForEqualSplit
  );
  useEffect(() => {
    setSplitItemsEQUAL(currentTravellersForEqualSplit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTravellers?.length]);
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
      (splitType === splitTypes.EXACT || splitType === splitTypes.EQUAL)
    ) {
      // split into equal parts if we are splitting over a ranged date and are editing
      if (duplOrSplit === 2 && isEditing) {
        const newSplitList = recalcSplitsLinearly(
          splitList,
          +amountValue / daysBeween
        );
        setSplitList(newSplitList);
        const isValidSplit = validateSplitList(
          newSplitList,
          splitType,
          +amountValue
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expCtx.expenses?.length]
  );
  // extract suggestions from all the descriptions of expense state into an array of strings
  const suggestionData = last500Daysexpenses.map(
    (expense) => expense.description
  );

  // Helper function to update category and icon
  const updateCategoryAndIcon = useCallback((categoryValue: string) => {
    const symbol = getCatSymbolMMKV(categoryValue);
    setIcon(symbol);
    setInputs((prevInputs) => ({
      ...prevInputs,
      category: { value: categoryValue, isValid: true },
    }));
  }, []);

  /**
   * Automatically determines the category based on the entered value of a specific input.
   * @param inputIdentifier - The identifier of the input. Should be "description"
   * @param enteredValue - The entered value of the input.
   */
  const autoCategory = useCallback(
    (inputIdentifier: string, enteredValue: string) => {
      // calc category from description
      if (inputIdentifier === "description" && pickedCat === "undefined") {
        const mappedCategory = mapDescriptionToCategory(
          enteredValue,
          getMMKVObject("categoryList") ?? DEFAULTCATEGORIES,
          last500Daysexpenses
        );
        if (mappedCategory) {
          updateCategoryAndIcon(mappedCategory);
        }
      }
    },
    [pickedCat, updateCategoryAndIcon, last500Daysexpenses]
  );

  // Helper function to save current form state to draft storage
  const saveDraftData = useCallback(
    (newValues: Partial<ExpenseData>) => {
      setExpenseDraft(editedExpenseId, {
        category: inputs.category.value,
        description: inputs.description.value,
        amount: +inputs.amount.value,
        date: createSafeDate(inputs.date.value),
        startDate: createSafeDate(startDate),
        endDate: createSafeDate(endDate),
        country: inputs.country.value,
        currency: inputs.currency.value,
        whoPaid: whoPaid,
        splitType: splitType,
        listEQUAL: splitTravellersList,
        splitList,
        duplOrSplit,
        calcAmount: +amountValue,
        isPaid,
        isSpecialExpense,
        categoryString: inputs.category.value,
        ...newValues,
      });
    },
    [
      editedExpenseId,
      inputs.category.value,
      inputs.description.value,
      inputs.amount.value,
      inputs.date.value,
      inputs.country.value,
      inputs.currency.value,
      startDate,
      endDate,
      whoPaid,
      splitType,
      splitTravellersList,
      splitList,
      duplOrSplit,
      amountValue,
      isPaid,
      isSpecialExpense,
    ]
  );

  // Load new category when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const tempCat = getExpenseCat(editedExpenseId);

      if (tempCat?.category) {
        updateCategoryAndIcon(tempCat.category);
        saveDraftData({ category: tempCat.category });
        clearExpenseCat(editedExpenseId);
      }
    }, [editedExpenseId, updateCategoryAndIcon, saveDraftData])
  );

  // Check for draft data on mount and show restore prompt for both new and existing expenses
  useEffect(() => {
    const draftData: ExpenseData = getExpenseDraft(editedExpenseId);
    if (draftData) {
      // Create a user-friendly list of changed items
      const changedItems = [];

      if (draftData.amount && draftData.amount !== 0) {
        changedItems.push(`• ${i18n.t("amount")}: ${draftData.amount}`);
      }
      if (draftData.description && draftData.description !== "") {
        changedItems.push(
          `• ${i18n.t("description")}: ${draftData.description}`
        );
      }
      if (draftData.category && draftData.category !== "undefined") {
        const categoryName = getCatString(draftData.category);
        changedItems.push(`• ${i18n.t("category")}: ${categoryName}`);
      }
      if (draftData.currency && draftData.currency !== userCtx.lastCurrency) {
        changedItems.push(`• ${i18n.t("currency")}: ${draftData.currency}`);
      }
      if (draftData.country && draftData.country !== userCtx.lastCountry) {
        changedItems.push(`• ${i18n.t("country")}: ${draftData.country}`);
      }
      if (draftData.whoPaid && draftData.whoPaid !== "") {
        changedItems.push(`• ${i18n.t("whoPaid")}: ${draftData.whoPaid}`);
      }
      if (draftData.splitType && draftData.splitType !== "SELF") {
        const splitTypeText =
          draftData.splitType === "EQUAL"
            ? i18n.t("equal")
            : draftData.splitType === "EXACT"
              ? i18n.t("exact")
              : draftData.splitType;
        changedItems.push(`• ${i18n.t("splitType")}: ${splitTypeText}`);
      }
      if (draftData.isPaid && draftData.isPaid !== "not paid") {
        const paidText =
          draftData.isPaid === "paid" ? i18n.t("paid") : i18n.t("notPaidLabel");
        changedItems.push(`• ${i18n.t("paymentStatus")}: ${paidText}`);
      }
      if (draftData.isSpecialExpense) {
        changedItems.push(`• ${i18n.t("specialExpense")}: ${i18n.t("yes")}`);
      }

      const changedItemsText =
        changedItems.length > 0
          ? `\n\n${i18n.t("unsavedItems")}:\n${changedItems.join("\n")}`
          : "";

      Alert.alert(
        i18n.t("unsavedChanges"),
        `${i18n.t("unsavedChangesMessage")}${changedItemsText}`,
        [
          {
            text: i18n.t("discard"),
            style: "destructive",
            onPress: () => {
              clearExpenseDraft(editedExpenseId);
            },
          },
          {
            text: i18n.t("restore"),
            onPress: () => {
              // Restore form state from draft data
              // Extract inputs from the spread data structure
              const inputsToRestore = {
                amount: {
                  value: draftData.amount?.toString() || "",
                  isValid: true,
                },
                description: {
                  value: draftData.description || "",
                  isValid: true,
                },
                date: {
                  value: draftData.date
                    ? convertToISOString(draftData.date)
                    : "",
                  isValid: true,
                },
                category: { value: draftData.category || "", isValid: true },
                country: { value: draftData.country || "", isValid: true },
                currency: { value: draftData.currency || "", isValid: true },
                whoPaid: { value: draftData.whoPaid || "", isValid: true },
              };
              setInputs(inputsToRestore);
              if (draftData.splitType) {
                setSplitType(draftData.splitType);
              }
              if (draftData.listEQUAL) {
                setListEQUAL(draftData.listEQUAL);
              }
              if (draftData.splitList) {
                setSplitList(draftData.splitList);
              }
              if (draftData.duplOrSplit !== undefined) {
                setDuplOrSplit(draftData.duplOrSplit);
              }
              if (draftData.isPaid) {
                setIsPaid(draftData.isPaid);
              }
              if (draftData.isSpecialExpense !== undefined) {
                setIsSpecialExpense(draftData.isSpecialExpense);
              }
              if (draftData.startDate) {
                setStartDate(convertToISOString(draftData.startDate));
              }
              if (draftData.endDate) {
                setEndDate(convertToISOString(draftData.endDate));
              }
              if (draftData.calcAmount) {
                setCalcAmount(draftData.calcAmount.toString());
              }
            },
          },
        ]
      );
    }
  }, [
    editedExpenseId,
    tripCtx.tripCurrency,
    updateCategoryAndIcon,
    userCtx.lastCountry,
    userCtx.lastCurrency,
  ]);

  // Update icon when category changes
  useEffect(() => {
    const symbol = getCatSymbolMMKV(inputs.category.value);
    setIcon(symbol);
  }, [inputs.category.value]);

  // Wrapper functions that include auto-save
  const setWhoPaidWithAutoSave = useCallback(
    (value) => {
      setWhoPaid(value);
      setTimeout(saveDraftData, 0);
    },
    [saveDraftData]
  );

  const setSplitTypeWithAutoSave = useCallback(
    (value) => {
      setSplitType(value);
      setTimeout(saveDraftData, 0);
    },
    [saveDraftData]
  );

  const setIsPaidWithAutoSave = useCallback(
    (value) => {
      setIsPaid(value);
      setTimeout(saveDraftData, 0);
    },
    [saveDraftData]
  );

  const setIsSpecialExpenseWithAutoSave = useCallback(
    (value) => {
      setIsSpecialExpense(value);
      setTimeout(saveDraftData, 0);
    },
    [saveDraftData]
  );

  function inputChangedHandler(inputIdentifier: string, enteredValue: string) {
    setInputs((curInputs) => {
      const newInputs = {
        ...curInputs,
        [inputIdentifier]: { value: enteredValue, isValid: true },
      };

      // Auto-save draft data after state update
      setTimeout(() => {
        if (editedExpenseId) {
          saveDraftData();
        }
      }, 0);

      return newInputs;
    });
    autoCategory(inputIdentifier, enteredValue);
    autoExpenseLinearSplitAdjust(inputIdentifier, enteredValue);
  }

  if (splitType === splitTypes.SELF || IsSoloTraveller) {
    if (openEQUAL) {
      setOpenEQUAL(false);
    }
  }

  if (splitType === splitTypes.EQUAL && openEQUAL) {
    splitHandler();
    setOpenEQUAL(false);
  }

  function openTravellerMultiPicker() {
    // console.log("splitType", splitType);
    // add whole traveling group who paid automatically to shared list
    if (!editingValues) {
      setListEQUAL([...currentTravellers]);
    }
    setModalFlow(modalStates.EXACT_SHARING);
  }

  function inputSplitListHandler(index, props: { userName: string }, value) {
    if (splitType === splitTypes.EQUAL) return;
    const tempList = [...splitList];
    // eslint-disable-next-line react/prop-types
    const tempValue = { amount: value, userName: props.userName };
    tempList[index] = tempValue;
    setSplitList(tempList);
    setSplitListValid(validateSplitList(tempList, splitType, +amountValue));
  }

  function splitHandler() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const splitTravellers = splitTravellersList;
    // calculate splits
    const listSplits = calcSplitList(
      splitType,
      +amountValue,
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
    // console.log("resetSplitHandler ~ splitTravellers:", splitTravellers);
    // calculate splits
    const listSplits = calcSplitList(
      splitTypes.EQUAL,
      +amountValue,
      whoPaid,
      splitTravellers
    );
    if (listSplits) {
      setSplitList(listSplits);
      setSplitListValid(validateSplitList(listSplits, splitType, +amountValue));
    }
  }

  async function removeUserFromSplitHandler(userName: string) {
    if (!splitList || splitList.length < 1) return;
    const splitListTemp = [...splitList];
    const index = splitListTemp.findIndex(
      (split) => split.userName === userName
    );
    if (index === -1) {
      return;
    }
    splitListTemp.splice(index, 1);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // if splitList is empty now, set splitType to "SELF"
    // if we ever implement the "ADD LOCAL TRAVELLER" function, we could keep a
    // List of length 1 here and remove the paidForSelf bool from the condition
    // In case the Button for "ADD LOCAL TRAVELLER" is on the right side of splitlist
    const paidForSelf =
      splitListTemp.length == 1 && splitListTemp[0]?.userName == whoPaid;
    if (splitListTemp.length === 0 || paidForSelf) {
      setSplitType(splitTypes.SELF);
      setSplitList([]);
      setSplitListValid(true);
      return;
    }
    setSplitList(splitListTemp);
    if (splitType === splitTypes.EQUAL) {
      const splitTravellersTemp = tripCtx.travellers.filter(
        (traveller) => traveller !== userName
      );
      const listSplits = calcSplitList(
        splitTypes.EQUAL,
        +amountValue,
        whoPaid,
        splitTravellersTemp
      );
      setSplitList(listSplits);
      setSplitListValid(validateSplitList(listSplits, splitType, +amountValue));
    } else {
      setSplitListValid(
        validateSplitList(splitListTemp, splitType, +amountValue)
      );
    }
  }

  // Helper function to safely create Date objects
  const createSafeDate = (dateValue: string): Date => {
    if (dateValue && dateValue !== "") {
      const parsedDate = DateTime.fromISO(dateValue);
      return parsedDate.isValid
        ? parsedDate.toJSDate()
        : DateTime.now().toJSDate();
    }
    return DateTime.now().toJSDate();
  };

  // Helper function to convert DateOrDateTime to ISO string
  const convertToISOString = (dateValue: any): string => {
    if (typeof dateValue === "string") {
      return dateValue;
    }
    if (dateValue instanceof Date) {
      return dateValue.toISOString();
    }
    if (dateValue && typeof dateValue.toJSDate === "function") {
      // DateTime object
      return dateValue.toJSDate().toISOString();
    }
    return new Date(dateValue).toISOString();
  };

  async function submitHandler() {
    const expenseData = {
      uid: authCtx.uid,
      amount: +amountValue,
      date: createSafeDate(inputs.date.value),
      startDate: createSafeDate(startDate),
      endDate: createSafeDate(endDate),
      description: inputs.description.value,
      category: newCat ? pickedCat : inputs.category.value,
      categoryString: inputs.category.value,
      calcAmount: +amountValue,
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
    const descriptionIsValid = expenseData.description.trim()?.length > 0;
    const whoPaidIsValid = true;
    const categoryIsValid = true;
    const countryIsValid = true;
    const currencyIsValid = true;

    // split into equal parts if we are splitting over a ranged date and are editing
    if (duplOrSplit === 2 && !isEditing) {
      const newSplitList = recalcSplitsLinearly(
        splitList,
        +amountValue / daysBeween
      );
      setSplitList(newSplitList);
      const isValidSplit = validateSplitList(
        newSplitList,
        splitType,
        +amountValue
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
      userCtx.setLastCurrency(inputs.currency.value);
      await secureStoreSetItem("lastCurrency", inputs.currency.value);
    }
    await onSubmit(expenseData);
  }

  async function fastSubmit() {
    const expenseData = {
      uid: authCtx.uid,
      amount: +amountValue,
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
      // Use trip-specific default first, then fall back to user context
      const defaultCountry = mostRecentExpense?.country || userCtx.lastCountry;
      inputChangedHandler("country", defaultCountry);
    }
    if (!inputs.currency.isValid) {
      // Use trip-specific default first, then fall back to user context
      const defaultCurrency =
        mostRecentExpense?.currency || userCtx.lastCurrency;
      inputChangedHandler("currency", defaultCurrency);
    }
    if (!inputs.whoPaid.isValid) {
      setWhoPaidWithLogging(userCtx.userName);
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
      const newSplitList = recalcSplitsForExact(splitList, +amountValue);

      setSplitList(newSplitList);
      const isValidSplit = validateSplitList(
        newSplitList,
        splitType,
        +amountValue
      );
      setSplitListValid(isValidSplit);
      if (!isValidSplit) {
        Alert.alert(i18n.t("sorry"), i18n.t("sorrySplitList"));
      }
    }
  }

  const recalcJSX = splitType == splitTypes.EXACT && !splitListValid && (
    <Animated.View
      style={{
        marginTop: dynamicScale(-8, true),
        paddingTop: dynamicScale(8, true),
        marginLeft: dynamicScale(8),
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
        icon="git-compare-outline"
        color={GlobalStyles.colors.primary500}
        onPressStyle={{ transform: [{ scale: 0.9 }] }}
        buttonStyle={[
          {
            flex: 1,
            flexDirection: "column",
            alignContent: "center",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: dynamicScale(8, true),
            marginLeft: dynamicScale(4),
            borderRadius: dynamicScale(20, false, 0.5),
            minHeight: dynamicScale(50, false, 0.5),
            minWidth: dynamicScale(90),
            marginRight: dynamicScale(8),
            backgroundColor: GlobalStyles.colors.backgroundColor,
            borderWidth: 1,
            borderColor: GlobalStyles.colors.gray700,
          },
          GlobalStyles.strongShadow,
        ]}
        size={dynamicScale(44, false, 0.5)}
        onPress={() => handleRecalculationSplits()}
        onLongPress={() => resetSplitHandler()}
      />
    </Animated.View>
  );
  const isLimitedByPremium = async () => {
    const isPremium = await isPremiumMember();
    if (isPremium) return false;
    const expenses = expCtx.expenses;
    const expensesLength = expenses.length || 0;
    const newExpenseDateRange = daysBeween || 1;
    const tooManyExpenses =
      expensesLength + newExpenseDateRange >= MAX_EXPENSES_PERTRIP_NONPREMIUM;
    return tooManyExpenses;
  };

  const advancedSubmitHandler = async () => {
    // setIsSubmitting(true);
    if (!isEditing) {
      if (await isLimitedByPremium()) {
        navigation.navigate("Paywall");
        return;
      }
    }
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

  const debouncedSubmit = callDebounced(advancedSubmitHandler, 500);

  const askChatGPTHandler = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("GPTDeal", {
      price: amountValue,
      currency: inputs.currency.value,
      country: inputs.country.value,
      product: inputs.description.value,
    });
  };

  const backButtonJsx = (
    <BackButton
      style={{
        flex: 0,
        paddingRight: dynamicScale(100, false, 0.5),
      }}
    />
  );
  const confirmButtonJSX = (
    <Pressable
      style={[
        {
          paddingLeft: dynamicScale(100, false, 0.5),
          paddingBottom: dynamicScale(8, false, 0.5),
          paddingTop: dynamicScale(6, false, 0.5),
        },
      ]}
      onPress={debouncedSubmit}
    >
      <IconButton
        icon="checkmark-outline"
        color={GlobalStyles.colors.textColor}
        size={dynamicScale(26, false, 0.5)}
        onPress={debouncedSubmit}
      ></IconButton>
    </Pressable>
  );

  const isPaidJSX = (
    <View style={styles.isPaidContainer}>
      <SegmentedButtons
        value={isPaid}
        onValueChange={(value: string) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsPaidWithAutoSave(value);
        }}
        buttons={[
          {
            label: i18n.t("notPaidLabel"),
            value: isPaidString.notPaid,
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
    ? i18n.t("specString1")
    : "\n" + i18n.t("specString2");
  const isSpecialExpenseJSX = hideSpecial && (
    <View style={styles.isSpecialContainer}>
      <SettingsSwitch
        toggleState={() => {
          setIsSpecialExpenseWithAutoSave(!isSpecialExpense);
        }}
        label={
          isSpecialExpense
            ? i18n.t("specString3") + hideSpecialTooltip
            : i18n.t("specString4")
        }
        state={isSpecialExpense}
        labelStyle={styles.isSpecialLabel}
      ></SettingsSwitch>
    </View>
  );

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
  const showWhoPaid = amountValue !== "";
  const whoPaidValid = whoPaid !== null;
  const splitTypeEqual = splitType === splitTypes.EQUAL;
  const splitTypeSelf = splitType === splitTypes.SELF;
  const splitListHasNonZeroEntries = splitList?.some(
    (item) => item.amount !== 0
  );
  const hidePickers = true;
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

  const headerHeight = useHeaderHeight();
  const hideBottomBorder = duplOrSplit == 1 || duplOrSplit == 2;

  const onPressHandlerQuickSum = () => {
    // console.log("taskbar pressed");
    if (inputs.amount.value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const _tempAmount = +tempAmount;
      const newAmount = _tempAmount + Number(inputs.amount.value);
      // console.log("_tempAmount:", _tempAmount);
      setTempAmount(newAmount.toFixed(2));
      inputChangedHandler("amount", "");
    } else if (tempAmount) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const _tempAmount = +tempAmount;
      inputChangedHandler("amount", _tempAmount.toFixed(2));
      setTempAmount("");
    }
  };
  return (
    <>
      {datepickerJSX}
      <Animated.View layout={LinearTransition}>
        <Animated.View layout={LinearTransition} style={styles.container}>
          <View
            style={[
              {
                flex: 1,
                flexDirection: "row",
                paddingHorizontal: "2%",
                justifyContent: "space-between",
              },
              Platform.OS == "android" && {
                alignContent: "center",
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
          >
            {backButtonJsx}
            {Platform.OS == "ios" && confirmButtonJSX}
          </View>
          <Animated.View layout={LinearTransition} style={styles.form}>
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
                // inputAccessoryViewID="amountID"
                invalid={!inputs.amount.isValid}
                autoFocus={!isEditing ?? false}
              />
              {inputs.amount.value && isAndroid && (
                <IconButton
                  buttonStyle={[
                    styles.quickSumButton,
                    GlobalStyles.strongShadow,
                  ]}
                  icon={"add-outline"}
                  color={GlobalStyles.colors.textColor}
                  size={dynamicScale(24, false, 0.5)}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const _tempAmount = +tempAmount;
                    const newAmount = _tempAmount + Number(inputs.amount.value);
                    setTempAmount(newAmount.toFixed(2));
                    inputChangedHandler("amount", "");
                  }}
                />
              )}
              {!inputs.amount.value && tempAmount && (
                <IconButton
                  buttonStyle={[
                    styles.quickSumButton,
                    GlobalStyles.strongShadow,
                  ]}
                  icon={"return-down-back-outline"}
                  color={GlobalStyles.colors.textColor}
                  size={dynamicScale(24, false, 0.5)}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const _tempAmount = +tempAmount;
                    inputChangedHandler("amount", _tempAmount.toFixed(2));
                    setTempAmount("");
                  }}
                />
              )}
              {tempAmount && (
                <Text style={styles.tempAmount}>
                  +{" "}
                  {formatExpenseWithCurrency(tempAmount, inputs.currency.value)}
                </Text>
              )}
              {hasCalcAmount && (
                <Text
                  style={[!tempAmount ? styles.tempAmount : styles.calcAmount]}
                >
                  ={" "}
                  {formatExpenseWithCurrency(calcAmount, tripCtx.tripCurrency)}
                </Text>
              )}
              <IconButton
                buttonStyle={[styles.iconButton, GlobalStyles.strongShadow]}
                icon={icon}
                color={GlobalStyles.colors.primary500}
                size={dynamicScale(48, false, 0.4)}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Store current form state in MMKV before navigation
                  const idCatData: IDCat = {
                    expenseId: editedExpenseId,
                    category: inputs.category.value,
                  };
                  setExpenseCat(editedExpenseId, idCatData);
                  // Also save to draft storage
                  saveDraftData();
                  // Navigate with minimal params
                  navigation.navigate("CategoryPick", {
                    expenseId: editedExpenseId,
                    isUpdating: isEditing,
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
                    size={dynamicScale(28, false, 0.5)}
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

                <View style={styles.currencyContainer}>
                  <Text style={styles.currencyLabel}>
                    {i18n.t("currencyLabel")}
                  </Text>
                  <CurrencyPicker
                    countryValue={currencyPickerValue}
                    setCountryValue={setCurrencyPickerValue}
                    onChangeValue={updateCurrency}
                    placeholder={currencyPlaceholder}
                  ></CurrencyPicker>
                </View>
                <View style={[styles.inputsRowSecond]}>
                  <View style={styles.countryContainer}>
                    <Text style={styles.currencyLabel}>
                      {i18n.t("countryLabel")}
                    </Text>
                    <View style={{ flexDirection: "row" }}>
                      <View
                        style={[
                          {
                            minWidth: "77%",
                            maxWidth: "77%",
                          },
                        ]}
                      >
                        <CountryPicker
                          countryValue={countryPickerValue}
                          setCountryValue={setCountryPickerValue}
                          onChangeValue={updateCountry}
                          placeholder={countryPlaceholder}
                        ></CountryPicker>
                      </View>
                      <ExpenseCountryFlag
                        countryName={inputs.country.value
                          ?.split("- ")[0]
                          .trim()}
                        style={styles.countryFlag}
                        containerStyle={styles.countryFlagContainer}
                      ></ExpenseCountryFlag>
                    </View>
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

                <View
                  style={
                    duplOrSplit !== 0 && {
                      paddingBottom: dynamicScale(5, true),
                      marginHorizontal: "5%",
                      borderBottomColor: GlobalStyles.colors.textColor,
                      borderBottomWidth: 1,
                    }
                  }
                >
                  {duplOrSplit !== 0 && (
                    <View style={styles.duplOrSplitContainer}>
                      <Text style={styles.dateLabelDuplSplitText}>
                        {duplOrSplitString(duplOrSplit)}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.inputsRowSecond}>
                  {/* !IsSoloTraveller && */}
                  {showWhoPaid && (
                    <View style={styles.whoPaidContainer}>
                      <Text
                        style={[
                          styles.whoPaidLabel,
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
                        <View
                          style={{
                            flexDirection: "row",
                            marginLeft: dynamicScale(16),
                            marginTop: dynamicScale(4),
                          }}
                        >
                          {/* equal share equal pay button scale waage */}
                          {/* share-social-outline */}
                          {/* checkmark-done-outline */}
                          {/* "expand-outline" */}
                          {!IsSoloTraveller && (
                            <IconButton
                              icon="people-circle-outline"
                              size={constantScale(28, 0.5)}
                              buttonStyle={[
                                {
                                  height: constantScale(48, 0.5),
                                  backgroundColor:
                                    GlobalStyles.colors.backgroundColor,
                                  borderRadius: dynamicScale(4, false, 0.5),
                                  borderWidth: 1,
                                  borderColor: GlobalStyles.colors.gray700,
                                  marginRight: constantScale(12),
                                  marginLeft: constantScale(-8),
                                  padding: constantScale(4),
                                },
                                GlobalStyles.strongShadow,
                              ]}
                              color={GlobalStyles.colors.primary500}
                              onPress={() => {
                                Haptics.impactAsync(
                                  Haptics.ImpactFeedbackStyle.Light
                                );
                                const tempSplitType: splitType =
                                  splitTypes.EXACT;
                                const listSplits = calcSplitList(
                                  tempSplitType,
                                  +amountValue,
                                  userCtx.userName,
                                  currentTravellers
                                );
                                // console.log("listSplits:", listSplits);
                                if (listSplits) {
                                  setSplitType(tempSplitType);
                                  setSplitList(listSplits);
                                  setSplitListValid(
                                    validateSplitList(
                                      listSplits,
                                      tempSplitType,
                                      +amountValue
                                    )
                                  );
                                }
                              }}
                            ></IconButton>
                          )}
                          <DropDownPicker
                            // renderListItem={(props) =>
                            //   renderDropDownList(props)
                            // }
                            containerStyle={styles.dropdownContainer}
                            open={modalFlow === modalStates.WHO_PAID}
                            value={whoPaid}
                            items={items}
                            setOpen={(open) => {
                              setModalFlow(
                                open ? modalStates.WHO_PAID : modalStates.NONE
                              );
                            }}
                            setValue={handleWhoPaidChange}
                            setItems={setItems}
                            onClose={() => {
                              // Only reset modal flow if we're not transitioning to another modal
                              if (modalFlow === modalStates.WHO_PAID) {
                                setModalFlow(modalStates.NONE);
                              }
                            }}
                            onOpen={() => {
                              setModalFlow(modalStates.WHO_PAID);
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light
                              );
                            }}
                            onSelectItem={(item) => {
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light
                              );

                              // Set whoPaid value first
                              if (item.value === "__ADD_TRAVELLER__") {
                                setWhoPaidWithLogging(userCtx.userName);
                                setSplitType(splitTypes.SELF);
                                // Navigate to Share screen
                                navigation.navigate("Share", {
                                  tripId: tripCtx.tripid,
                                });
                              } else {
                                setWhoPaidWithLogging(item.value);
                              }

                              // Use state machine to handle modal flow
                              nextModal(item.value);
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
                            style={
                              !inputs.whoPaid.isValid
                                ? [
                                    styles.whoPaidDropdownContainer,
                                    styles.invalidInput,
                                  ]
                                : styles.whoPaidDropdownContainer
                            }
                            textStyle={styles.dropdownTextStyle}
                          />
                        </View>
                      )}
                    </View>
                  )}
                  {whoPaidValid && !IsSoloTraveller && (
                    <DropDownPicker
                      // renderListItem={(props) => renderDropDownList(props)}
                      open={modalFlow === modalStates.HOW_SHARED}
                      value={splitType}
                      items={splitItems}
                      setOpen={(open) => {
                        setModalFlow(
                          open ? modalStates.HOW_SHARED : modalStates.NONE
                        );
                      }}
                      setValue={setSplitType}
                      setItems={setSplitTypeItems}
                      onSelectItem={(item) => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSplitTypeWithAutoSave(item.value);
                        nextModal(item.value);
                      }}
                      onClose={() => {
                        // Only reset modal flow if we're not transitioning to another modal
                        // Don't reset if we're about to go to EXACT_SHARING
                        if (modalFlow === modalStates.HOW_SHARED) {
                          setModalFlow(modalStates.NONE);
                        }
                      }}
                      onOpen={() => {
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
                      placeholder={i18n.t("placeholderSharedExpense")}
                      containerStyle={[
                        styles.dropdownContainer,
                        hidePickers && styles.hidePickersStyle,
                      ]}
                      style={[
                        styles.whoPaidDropdownContainer,
                        hidePickers && styles.hidePickersStyle,
                      ]}
                      textStyle={styles.dropdownTextStyle}
                    />
                  )}
                </View>
                {!loadingTravellers && !splitTypeSelf && !IsSoloTraveller && (
                  <DropDownPicker
                    // renderListItem={(props) => renderDropDownList(props)}
                    open={modalFlow === modalStates.EXACT_SHARING || openEQUAL}
                    value={splitTravellersList}
                    items={splitItemsEQUAL}
                    setOpen={(open) => {
                      if (open) {
                        setModalFlow(modalStates.EXACT_SHARING);
                      } else {
                        setModalFlow(modalStates.NONE);
                        setOpenEQUAL(false);
                      }
                    }}
                    onOpen={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    onSelectItem={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    setValue={setListEQUAL}
                    setItems={setSplitItemsEQUAL}
                    onClose={() => {
                      setModalFlow(modalStates.NONE);
                      splitHandler();
                    }}
                    listMode="MODAL"
                    multiple={true}
                    CloseIconComponent={() => (
                      <Text
                        style={{
                          color: GlobalStyles.colors.textColor,
                          fontSize: dynamicScale(24, false, 0.3),
                          fontWeight: "bold",
                          padding: dynamicScale(4),
                        }}
                      >
                        {i18n.t("confirm2")}
                      </Text>
                    )}
                    min={1}
                    max={99}
                    labelProps={{ style: { padding: dynamicScale(4) } }}
                    modalProps={{
                      animationType: "slide",
                      presentationStyle: "pageSheet",
                    }}
                    searchable={false}
                    modalTitle={i18n.t("whoShared")}
                    modalContentContainerStyle={{
                      backgroundColor: GlobalStyles.colors.backgroundColor,
                    }}
                    placeholder={i18n.t("placeholderSharedBetween")}
                    containerStyle={[
                      styles.dropdownContainer,
                      hidePickers && styles.hidePickersStyle,
                    ]}
                    style={[
                      styles.whoPaidDropdownContainer,
                      hidePickers && styles.hidePickersStyle,
                    ]}
                    textStyle={styles.dropdownTextStyle}
                  />
                )}
                <View
                  style={[
                    styles.advancedRowSplit,
                    {
                      marginTop: dynamicScale(12, false, 0.5),
                      marginLeft: dynamicScale(12, false, 0.5),
                    },
                  ]}
                >
                  {!splitTypeSelf &&
                    whoPaidValid &&
                    !IsSoloTraveller &&
                    splitListHasNonZeroEntries && (
                      <Text style={[styles.whoSharedLabel]}>
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
                        minWidth: splitList?.length
                          ? splitList?.length * dynamicScale(100, false, 0.5) +
                            dynamicScale(200, false, 0.5)
                          : 0,
                        marginLeft: dynamicScale(8, false, 0.5),
                        marginRight: dynamicScale(8, false, 0.5),
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                      }}
                      ListHeaderComponent={recalcJSX}
                      ListFooterComponent={
                        <View
                          style={{ width: dynamicScale(300, false, 0.5) }}
                        ></View>
                      }
                      renderItem={(itemData) => {
                        const splitValue = itemData.item.amount.toString();
                        return (
                          <View
                            style={[
                              GlobalStyles.strongShadow,
                              {
                                minWidth: constantScale(100, 0.5),
                                marginTop: constantScale(14, 0.5),
                                marginBottom: constantScale(8, 0.5),
                                borderWidth: 1,
                                borderRadius: 8,
                                padding: constantScale(8, 0.5),
                                paddingBottom: constantScale(32, 0.5),
                                margin: constantScale(8, 0.5),
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
                            <View
                              style={{
                                flexDirection: "row",
                                paddingHorizontal: dynamicScale(4, false, 0.5),
                                // space out
                                justifyContent: "space-between",
                                flex: 1,
                              }}
                            >
                              <Text
                                style={{
                                  color: splitListValid
                                    ? GlobalStyles.colors.textColor
                                    : GlobalStyles.colors.error500,
                                  textAlign: "left",
                                  marginLeft: dynamicScale(4),
                                  paddingTop: dynamicScale(2, true),
                                  fontSize: dynamicScale(14, false, 0.3),
                                }}
                              >
                                {truncateString(itemData.item.userName, 10)}
                              </Text>
                              <Pressable
                                style={{
                                  paddingLeft: dynamicScale(16),
                                  paddingBottom: dynamicScale(16, true),
                                }}
                                onPress={() => {
                                  removeUserFromSplitHandler(
                                    itemData.item.userName
                                  );
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: dynamicScale(14, false, 0.3),
                                    color: GlobalStyles.colors.accent500,
                                    textAlign: "left",
                                    fontWeight: "600",
                                  }}
                                >
                                  x
                                </Text>
                              </Pressable>
                            </View>
                            {/* Horizontal container  */}
                            <View
                              style={{
                                flexDirection: "row",
                                justifyContent: "flex-start",
                                alignItems: "flex-end",
                                overflow: "visible",
                                // borderWidth: 1,
                                marginLeft: dynamicScale(-16),
                                marginRight: dynamicScale(-8),
                              }}
                            >
                              <Input
                                hasCurrency={!!inputs.currency}
                                inputStyle={[
                                  splitTypeEqual && {
                                    color: GlobalStyles.colors.textColor,
                                  },
                                  {
                                    paddingBottom: dynamicScale(4, true),
                                    marginTop: dynamicScale(-26, true),
                                  },
                                  {
                                    backgroundColor:
                                      GlobalStyles.colors.backgroundColor,
                                  },
                                ]}
                                textInputConfig={{
                                  onFocus: () => {
                                    if (splitType === splitTypes.EQUAL) {
                                      setSplitType(splitTypes.EXACT);
                                    }
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
                                  paddingBottom: dynamicScale(11, true),
                                  marginLeft: dynamicScale(-18, false, 1.3),
                                  marginRight: dynamicScale(8),
                                }}
                              >
                                {getCurrencySymbol(inputs.currency.value)}
                              </Text>
                            </View>
                            {splitListCalcAmounts[itemData.index] && (
                              <Text style={styles.splitListCalcAmount}>
                                {"= "}
                                {formatExpenseWithCurrency(
                                  splitListCalcAmounts[itemData.index],
                                  tripCtx.tripCurrency
                                )}
                              </Text>
                            )}
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
          {/* Get Local Price Button Section */}
          {!hideAdvanced &&
            inputs.description.value &&
            inputs.currency.value &&
            inputs.country.value && (
              <View style={styles.getLocalPriceContainer}>
                <GradientButton
                  style={styles.getLocalPriceButton}
                  textStyle={{ fontSize: 16 }}
                  buttonStyle={{ padding: 8, paddingHorizontal: 12 }}
                  colors={GlobalStyles.gradientColorsButton}
                  onPress={askChatGPTHandler}
                  darkText
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Image
                      source={require("../../assets/chatgpt-logo.jpeg")}
                      style={{
                        width: dynamicScale(16, false, 0.5),
                        height: dynamicScale(16, false, 0.5),
                        marginRight: 8,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        color: GlobalStyles.colors.textColor,
                      }}
                    >
                      {i18n.t("getLocalPriceTitle")}
                    </Text>
                  </View>
                </GradientButton>
              </View>
            )}
          <View style={styles.buttonContainer}>
            <FlatButton onPress={onCancel}>{i18n.t("cancel")}</FlatButton>
            <GradientButton style={styles.button} onPress={debouncedSubmit}>
              {submitButtonLabel}
            </GradientButton>
          </View>
        </Animated.View>
      </Animated.View>
      {false && ( //Platform.OS == "ios" && ( // comment this out for now, it's not working (not pressable)
        // QuickSum Button on ios
        <InputAccessoryView nativeID="amountID">
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "space-between",
              paddingLeft: "44%",
              paddingRight: "4%",
              alignContent: "center",
              alignItems: "center",
              backgroundColor: GlobalStyles.colors.backgroundColorLight,
              borderTopWidth: 1,
              borderColor: GlobalStyles.colors.gray700,
              minWidth: isTablet ? (isPortrait ? "90%" : "135%") : "100%",
            }}
          >
            <Pressable
              style={{
                flex: 1,
                flexDirection: "row",
                justifyContent: "center",
                alignContent: "center",
                alignItems: "center",
                // backgroundColor: "white",
                // borderWidth: 1,
                // borderColor: "black",
              }}
              onPress={onPressHandlerQuickSum}
            >
              {/* <Text style={{ borderWidth: 1, borderColor: "blue" }}>Test</Text> */}
              {inputs.amount.value && (
                <IconButton
                  buttonStyle={[
                    styles.taskBarButtons,
                    GlobalStyles.strongShadow,
                  ]}
                  icon={"add-outline"}
                  color={GlobalStyles.colors.textColor}
                  size={dynamicScale(24, false, 0.5)}
                  onPress={onPressHandlerQuickSum}
                />
              )}
              {!inputs.amount.value && tempAmount && (
                <IconButton
                  buttonStyle={[
                    styles.taskBarButtons,
                    GlobalStyles.strongShadow,
                  ]}
                  icon={"return-down-back-outline"}
                  color={GlobalStyles.colors.textColor}
                  size={dynamicScale(24, false, 0.5)}
                  onPress={() => {
                    // console.log("sum button pressed");
                  }}
                />
              )}
            </Pressable>
            {!inputs.amount.value ||
              (!tempAmount && (
                <Pressable>
                  <Text style={{ color: GlobalStyles.colors.primary700 }}>
                    {i18n.t("confirm2")}
                  </Text>
                </Pressable>
              ))}
          </View>
        </InputAccessoryView>
      )}
    </>
  );
};

export default ExpenseForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: "20%",
    overflow: "visible",
  },
  form: {
    flex: 1,
    margin: "4.5%",
    marginTop: 0,
    padding: "2%",
    paddingBottom: "5%",
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
    minWidth: dynamicScale(150, false, 0.5),
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray700,
    padding: constantScale(8, 0.5),
    marginTop: constantScale(8, 0.5),
  },
  quickSumButton: {
    borderWidth: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderColor: GlobalStyles.colors.gray700,
    borderRadius: 8,
    padding: dynamicScale(2, false, 0.5),
    margin: dynamicScale(4, false, 0.5),
    maxHeight: dynamicScale(32, false, 0.5),
    marginTop: "10.5%",
    marginLeft: "-16%",
  },
  taskBarButtons: {},
  iconButton: {
    borderWidth: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderColor: GlobalStyles.colors.gray700,
    borderRadius: 8,
    padding: dynamicScale(8, false, 0.5),
    margin: dynamicScale(8, false, 0.5),
  },
  descriptionContainer: {
    flex: 1,
    marginTop: dynamicScale(12, true),
    marginHorizontal: dynamicScale(8, false, 0.5),
    marginLeft: dynamicScale(12, false, 0.5),
  },
  autoCompleteStyle: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.gray500,
    borderRadius: 5,
    fontSize: dynamicScale(14, false, 0.3),
  },
  autoCompleteMenuStyle: {
    marginLeft: dynamicScale(8),
    marginBottom: dynamicScale(-1, true),
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.primaryGrayed,
  },
  countryFlagContainer: {
    marginRight: "5%",
    marginTop: constantScale(20, -1.5),
  },
  countryFlag: {
    width: dynamicScale(60, false, 0.5),
    height: dynamicScale(40, false, 0.5),
    borderRadius: dynamicScale(4, false, 0.5),
  },

  topCurrencyPressableContainer: {
    padding: dynamicScale(8),
    marginLeft: dynamicScale(-120),
  },
  topCurrencyText: {
    fontSize: dynamicScale(12, false, 0.3),
  },
  title: {
    fontSize: dynamicScale(24, false, 0.3),
    fontWeight: "bold",
    color: GlobalStyles.colors.backgroundColor,
    marginTop: dynamicScale(5, true),
    marginBottom: dynamicScale(24, true),
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
    margin: dynamicScale(8, true),
  },
  tempAmount: {
    position: "absolute",
    marginLeft: "30%",
    marginTop: "1.5%",
    fontSize: dynamicScale(12, false, 0.3),
    fontWeight: "300",
    color: GlobalStyles.colors.textColor,
  },
  calcAmount: {
    position: "absolute",
    marginLeft: "50%",
    marginTop: "1.5%",
    fontSize: dynamicScale(12, false, 0.3),
    fontWeight: "300",
    color: GlobalStyles.colors.textColor,
  },
  splitListCalcAmount: {
    position: "absolute",
    top: "115%",
    // left: "25%",
    fontSize: dynamicScale(12, false, 0.3),
    fontWeight: "300",
    color: GlobalStyles.colors.textColor,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "baseline",
    paddingTop: dynamicScale(20, true),
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
    fontSize: dynamicScale(12, false, 0.3),
    color: GlobalStyles.colors.textColor,
    marginTop: dynamicScale(12),
    marginLeft: dynamicScale(14, false, 0.3),
    marginBottom: dynamicScale(-8, false, 0.3),
  },
  whoPaidLabel: {
    fontSize: dynamicScale(12, false, 0.3),
    color: GlobalStyles.colors.textColor,
    marginBottom: dynamicScale(4, true),
  },
  whoSharedLabel: {
    fontSize: dynamicScale(12, false, 0.3),
    color: GlobalStyles.colors.textColor,
    marginTop: dynamicScale(8, true),
    marginBottom: 0,
    marginLeft: dynamicScale(8),
  },
  whoPaidContainer: {
    marginTop: dynamicScale(20, true),
    marginHorizontal: dynamicScale(16, false, 0.3),
  },
  button: {
    minWidth: dynamicScale(200, false, 0.5),
    marginHorizontal: 0,
    marginVertical: dynamicScale(4, true),
  },
  advancedText: {
    marginTop: dynamicScale(9, true),
    marginLeft: dynamicScale(12),
    fontSize: dynamicScale(12, false, 0.3),
    fontStyle: "italic",
    fontWeight: "300",
  },
  isSpecialLabel: {
    fontSize: dynamicScale(12, false, 0.3),
    fontWeight: "400",
    color: GlobalStyles.colors.textColor,
    marginLeft: dynamicScale(-8),
  },
  dateLabel: {
    marginTop: "4%",
    marginHorizontal: "5.5%",
    // row
    flexDirection: "row",
    // justifyContent: "space-between",
  },
  dateLabelText: {
    fontSize: dynamicScale(12, false, 0.3),
    fontWeight: "400",
    color: GlobalStyles.colors.textColor,
  },
  dateLabelDuplSplitText: {
    fontSize: dynamicScale(12, false, 0.3),
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
    paddingBottom: dynamicScale(4, true),
  },
  dropdownContainer: {
    marginTop: dynamicScale(-12, true),
    maxWidth: "89%",
  },
  whoPaidDropdownContainer: {
    width: "75%",
    backgroundColor: GlobalStyles.colors.gray500,
    borderWidth: 0,
    marginTop: dynamicScale(12, true),
    marginBottom: dynamicScale(10, true),
    borderBottomWidth: 1,
    borderRadius: 0,
    borderBottomColor: GlobalStyles.colors.gray700,
  },
  dropdownTextStyle: {
    fontSize: dynamicScale(18, false, 0.3),
    color: GlobalStyles.colors.textColor,
    padding: dynamicScale(4),
  },
  dropdownListItemLabelStyle: {
    fontSize: dynamicScale(18, false, 0.3),
    color: GlobalStyles.colors.textColor,
    padding: dynamicScale(4),
  },
  hidePickersStyle: {
    maxHeight: 0,
    maxWidth: 0,
    opacity: 0,
  },
  advancedRowSplit: {
    marginLeft: dynamicScale(36),
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
    minHeight: "1%",
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
    padding: dynamicScale(8),
    margin: dynamicScale(4),
    overflow: "visible",
  },
  getLocalPriceContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: dynamicScale(12, true),
    marginHorizontal: "4%",
  },
  getLocalPriceButton: {
    marginHorizontal: 0,
    marginVertical: 0,
  },
});
