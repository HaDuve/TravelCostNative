import React, { useState, useContext, useEffect } from "react";
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
} from "react-native";
import Input from "./Input";
import Button from "../UI/Button";
import { getFormattedDate } from "../../util/date";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../store/auth-context";
import IconButton from "../UI/IconButton";
import { UserContext } from "../../store/user-context";
import FlatButton from "../UI/FlatButton";
import {
  getCatString,
  getCatSymbol,
  getCatSymbolAsync,
} from "../../util/category";
import DropDownPicker from "react-native-dropdown-picker";
// import CurrencyPicker from "react-native-currency-picker";
import { TripContext } from "../../store/trip-context";
import {
  calcSplitList,
  splitTypesDropdown,
  travellerToDropdown,
  validateSplitList,
} from "../../util/split";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import CurrencyPicker from "../Currency/CurrencyPicker";
import { truncateString } from "../../util/string";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  ZoomIn,
  ZoomOut,
  FadeOut,
  Layout,
  Easing,
  FadeInUp,
  FadeOutDown,
  FadeOutUp,
} from "react-native-reanimated";
import { asyncStoreSetItem } from "../../store/async-storage";
import { DateTime } from "luxon";
import DatePickerModal from "../UI/DatePickerModal";
import DatePickerContainer from "../UI/DatePickerContainer";
import PropTypes from "prop-types";
import GradientButton from "../UI/GradientButton";
import getSymbolFromCurrency from "currency-symbol-map";
import ExpenseCountryFlag from "../ExpensesOutput/ExpenseCountryFlag";
import CountryFlag from "react-native-country-flag";
import { recalcSplitsForExact } from "../../util/split";
import { ExpenseData } from "../../util/expense";
import { NetworkContext } from "../../store/network-context";
import { SettingsContext } from "../../store/settings-context";
import Autocomplete from "../UI/Autocomplete";
import { ExpensesContext } from "../../store/expenses-context";

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
  const alwaysShowAdvancedSetting = settings.alwaysShowAdvanced || isEditing;
  const editingValues: ExpenseData = defaultValues;
  const lastCurrency = userCtx.lastCurrency
    ? userCtx.lastCurrency
    : tripCtx.tripCurrency;
  const currencyPlaceholder = isEditing
    ? editingValues.currency +
      " | " +
      getSymbolFromCurrency(editingValues.currency)
    : lastCurrency + " | " + getSymbolFromCurrency(lastCurrency);

  const [hideAdvanced, sethideAdvanced] = useState(true);
  const [countryValue, setCountryValue] = useState("EUR");
  const [loadingTravellers, setLoadingTravellers] = useState(false);

  const [defaultCatSymbol, setCatSymbol] = useState(iconName ? iconName : "");

  useEffect(() => {
    const hideAdvanceByDefault = isEditing || alwaysShowAdvancedSetting;
    sethideAdvanced(!hideAdvanceByDefault);
  }, [isEditing, alwaysShowAdvancedSetting, iconName]);

  // extract suggestions from all the descriptions of expense state into an array of strings
  const suggestionData = expCtx
    .getRecentExpenses("year")
    .map((expense) => expense.description);

  useEffect(() => {
    async function setCatSymbolAsync() {
      if (!editingValues) return;
      const cat = await getCatSymbolAsync(editingValues.category);
      setCatSymbol(cat);
    }
    setCatSymbolAsync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [pickedCatSymbol, setCatSymbolPicked] = useState(
    pickedCat ? getCatSymbol(pickedCat) : ""
  );

  useEffect(() => {
    async function setTravellers() {
      setLoadingTravellers(true);
      if (netCtx.isConnected) {
        try {
          await tripCtx.setCurrentTravellers(tripCtx.tripid);
        } catch (error) {
          console.log("error loading travellers in expenseForm");
        }
      }
      if (tripCtx.travellers) setListEQUAL(tripCtx.travellers);
      setLoadingTravellers(false);
    }
    setTravellers();
  }, [tripCtx.tripid, netCtx.isConnected]);

  // currencypicker reference for open/close
  // let currencyPickerRef = undefined;

  // datepicker states
  const [showDatePickerRange, setShowDatePickerRange] = useState(false);
  const [startDate, setStartDate] = useState(
    editingValues
      ? getFormattedDate(
          DateTime.fromJSDate(editingValues.startDate).toJSDate()
        )
      : getFormattedDate(DateTime.now())
  );
  const [endDate, setEndDate] = useState(
    editingValues
      ? getFormattedDate(DateTime.fromJSDate(editingValues.endDate).toJSDate())
      : getFormattedDate(DateTime.now())
  );

  const openDatePickerRange = () => {
    // if isEditing show alert, saying this feature is not available yet
    if (isEditing && dateIsRanged) {
      Alert.alert(
        "Sorry",
        "Changing the dates of expenses with a range of dates is not yet possible.",
        [
          {
            text: i18n.t("confirm"),
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
          },
        ]
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePickerRange(true);
  };
  const onCancelRange = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePickerRange(false);
  };

  // duplOrSplit enum:  1 is dupl, 2 is split, 0 is null
  const [duplOrSplit, setDuplOrSplit] = useState<number>(
    editingValues ? Number(editingValues.duplOrSplit) : 0
  );
  const duplOrSplitString =
    duplOrSplit === 1
      ? i18n.t("duplicateExpensesText")
      : duplOrSplit === 2
      ? i18n.t("splitUpExpensesText")
      : "";

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
    if (startDateFormat === endDateFormat) {
      inputChangedHandler("date", startDateFormat);
      return;
    }
    setDuplOrSplit(1);
  };

  // list of all splits owed
  const [splitList, setSplitList] = useState(
    editingValues ? editingValues.splitList : []
  );
  const [splitListValid, setSplitListValid] = useState(true);

  // dropdown for whoPaid picker
  const currentTravellers = tripCtx.travellers;

  const IsSoloTraveller = currentTravellers.length === 1;
  let currentTravellersAsItems = travellerToDropdown(currentTravellers);

  useEffect(() => {
    currentTravellersAsItems = travellerToDropdown(currentTravellers);
  }, []);

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
    editingValues ? editingValues.splitType : null
  );

  // dropdown for EQUAL share picker
  const [splitItemsEQUAL, setSplitItemsEQUAL] = useState(
    currentTravellersAsItems
  );
  const [openEQUAL, setOpenEQUAL] = useState(false);
  const [splitTravellersList, setListEQUAL] = useState(
    editingValues ? editingValues.listEQUAL : currentTravellers
  );

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
    owePerc: {
      value: editingValues ? editingValues.owePerc?.toString() : "",
      isValid: true,
    },
  });

  function inputChangedHandler(inputIdentifier, enteredValue) {
    setInputs((curInputs) => {
      return {
        ...curInputs,
        [inputIdentifier]: { value: enteredValue, isValid: true },
      };
    });
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
      validateSplitList(tempList, splitType, inputs.amount.value, index)
    );
  }

  function splitHandler() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const splitTravellers = splitTravellersList;
    // calculate splits
    const listSplits = calcSplitList(
      splitType,
      inputs.amount.value,
      whoPaid,
      splitTravellers,
      splitList
    );
    if (listSplits) {
      setSplitList(listSplits);
    }
  }

  async function resetSplitHandler() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const splitTravellers = splitTravellersList;
    console.log("resetSplitHandler ~ splitTravellers:", splitTravellers);
    // calculate splits
    const listSplits = calcSplitList(
      "EQUAL",
      inputs.amount.value,
      whoPaid,
      splitTravellers
    );
    if (listSplits) {
      setSplitList(listSplits);
      setSplitListValid(
        validateSplitList(listSplits, splitType, inputs.amount.value)
      );
    }
  }

  async function submitHandler() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      owePerc: +inputs.owePerc.value,
      splitType: splitType,
      listEQUAL: splitTravellersList,
      splitList: splitList,
      duplOrSplit: duplOrSplit,
      iconName: iconName,
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
    const dateIsValid = expenseData.date.toString() !== "Invalid Date";
    const descriptionIsValid = expenseData.description.trim().length > 0;
    const whoPaidIsValid = true;
    const categoryIsValid = true;
    const countryIsValid = true;
    const currencyIsValid = true;
    const owePercIsValid = true;

    if (
      !amountIsValid ||
      !dateIsValid ||
      !descriptionIsValid ||
      !categoryIsValid ||
      !countryIsValid ||
      !currencyIsValid ||
      !whoPaidIsValid ||
      !owePercIsValid ||
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
          owePerc: {
            value: curInputs.owePerc.value,
            isValid: owePercIsValid,
          },
        };
      });
      addDefaultValues(pickedCat);
      return;
    }

    // update lastcountry and lastcurrency
    if (inputs.country.value && inputs.country.value !== "") {
      userCtx.setLastCountry(inputs.country.value);
      await asyncStoreSetItem("lastCountry", inputs.country.value);
    }
    if (inputs.currency.value && inputs.currency.value !== "") {
      userCtx.setLastCurrency(inputs.currency.value);
      await asyncStoreSetItem("lastCurrency", inputs.currency.value);
    }
    onSubmit(expenseData);
  }

  function fastSubmit() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      owePerc: "0",
      splitType: "SELF",
      listEQUAL: currentTravellers,
      splitList: [],
      iconName: iconName,
    };
    onSubmit(expenseData);
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
    if (!inputs.owePerc.isValid) {
      inputChangedHandler("owePerc", "0");
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
        Alert.alert(
          "Sorry!",
          "I could not calculate a valid split. Please check your input. \n\n You can also long-press the recalculate button to reset all splits!"
        );
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

  const advancedSubmitHandler = hideAdvanced ? fastSubmit : submitHandler;

  const askChatGPTHandler = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // const result = await askChatGPT(inputs.description.value);
    Alert.alert(
      "Sorry!",
      "This feature is not yet available. Please check back later!"
    );
  };

  function updateCurrency() {
    // split the countryValue into country and currency
    const currency = countryValue.split("- ")[1].split(" ")[0].trim();
    const country = countryValue.split("- ")[0].trim();
    inputChangedHandler("currency", currency);
    inputChangedHandler("country", country);
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
  const dateIsRanged =
    startDate.toString().slice(0, 10) !== endDate.toString().slice(0, 10);
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
    whoPaid: whoPaid, // TODO: convert this to uid
    owePerc: +inputs.owePerc.value,
    splitType: splitType,
    listEQUAL: splitTravellersList,
    splitList: splitList,
    duplOrSplit: duplOrSplit,
    iconName: iconName,
  };

  return (
    <Animated.View layout={Layout}>
      {datepickerJSX}
      <Animated.View layout={Layout} style={styles.container}>
        <Animated.View layout={Layout} style={styles.form}>
          <View style={styles.inputsRow}>
            <Input
              style={styles.rowInput}
              label={
                i18n.t("priceIn") + getSymbolFromCurrency(inputs.currency.value)
              }
              textInputConfig={{
                keyboardType: "decimal-pad",
                onChangeText: inputChangedHandler.bind(this, "amount"),
                value: inputs.amount.value,
              }}
              invalid={!inputs.amount.isValid}
              // autoFocus={true}
            />
            <IconButton
              buttonStyle={[styles.iconButton, GlobalStyles.strongShadow]}
              icon={
                iconName
                  ? iconName
                  : editingValues
                  ? editingValues.iconName
                    ? editingValues.iconName
                    : newCat
                    ? pickedCatSymbol
                    : defaultCatSymbol
                  : pickedCatSymbol
              }
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
                  countryValue={countryValue}
                  setCountryValue={setCountryValue}
                  onChangeValue={updateCurrency}
                  placeholder={currencyPlaceholder}
                ></CurrencyPicker>
              </View>
              <View style={[styles.inputsRowSecond]}>
                <Input
                  label={i18n.t("countryLabel")}
                  style={{ minWidth: "60%" }}
                  placeholder={
                    userCtx.lastCountry ?? i18n.t("countryPlaceholder")
                  }
                  textInputConfig={{
                    onChangeText: inputChangedHandler.bind(this, "country"),
                    value: inputs.country.value,
                  }}
                  invalid={!inputs.country.isValid}
                />
                <ExpenseCountryFlag
                  countryName={inputs.country.value}
                  containerStyle={styles.countryFlagContainer}
                  style={styles.countryFlag}
                ></ExpenseCountryFlag>
              </View>

              <Pressable
                onPress={() => {
                  if (!dateIsRanged) return;
                  if (duplOrSplit === 1) setDuplOrSplit(2);
                  else setDuplOrSplit(1);
                }}
                style={styles.dateLabel}
              >
                <Text style={styles.dateLabelText}>{i18n.t("dateLabel")}</Text>
                <Text style={styles.dateLabelDuplSplitText}>
                  {duplOrSplitString}
                </Text>
              </Pressable>
              {DatePickerContainer({
                openDatePickerRange,
                startDate,
                endDate,
                dateIsRanged,
              })}

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
                    {!loadingTravellers && (
                      <DropDownPicker
                        open={open}
                        value={whoPaid}
                        items={items}
                        setOpen={setOpen}
                        setValue={setWhoPaid}
                        setItems={setItems}
                        onClose={setOpenSplitTypes}
                        listMode="MODAL"
                        modalProps={{
                          animationType: "slide",
                          presentationStyle: "pageSheet",
                        }}
                        searchable={false}
                        modalTitle={i18n.t("whoPaid")}
                        modalContentContainerStyle={{
                          backgroundColor: GlobalStyles.colors.backgroundColor,
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
                  setValue={setListEQUAL}
                  setItems={setSplitItemsEQUAL}
                  onClose={splitHandler}
                  listMode="MODAL"
                  multiple={true}
                  CloseIconComponent={({ style }) => (
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
                  behavior="position"
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
                                  if (splitType === "EQUAL") Keyboard.dismiss();
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
                              {getSymbolFromCurrency(inputs.currency.value)}
                            </Text>
                          </View>
                        </View>
                      );
                    }}
                  ></FlatList>
                </KeyboardAvoidingView>
              )}
            </Animated.View>
          )}
          {formIsInvalid && !hideAdvanced && (
            <Text style={styles.errorText}>{i18n.t("invalidInput")} </Text>
          )}
        </Animated.View>
        <View
          style={[styles.spacerViewAdvanced, hideAdvanced && styles.spacerView]}
        ></View>
        <View style={styles.buttonContainer}>
          <FlatButton onPress={onCancel}>{i18n.t("cancel")}</FlatButton>
          <GradientButton style={styles.button} onPress={advancedSubmitHandler}>
            {submitButtonLabel}
          </GradientButton>
        </View>
        <View style={styles.buttonContainer}>
          {/* <GradientButton
            style={[styles.button, { marginTop: 28, minWidth: "80%" }]}
            colors={GlobalStyles.gradientColorsButton}
            onPress={askChatGPTHandler}
            darkText
          >
            {isEditing && "Ask ChatGPT: Was this a good deal?"}
            {!isEditing && "Ask ChatGPxT: How much should I pay?"}
          </GradientButton> */}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

export default ExpenseForm;

ExpenseForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  defaultValues: PropTypes.object,
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
    marginBottom: "2%",
    // borderBottomWidth: 1,
    // borderBottomColor: GlobalStyles.colors.gray700,
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
    fontWeight: "500",
    color: GlobalStyles.colors.primary500,
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
    minHeight: "105%",
  },
  spacerViewAdvanced: {
    flex: 1,
    minHeight: "4%",
  },
});
