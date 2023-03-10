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
  Platform,
  KeyboardAvoidingView,
  LayoutAnimation,
} from "react-native";
import Input from "./Input";
import Button from "../UI/Button";
import {
  getDatePlusDays,
  getFormattedDate,
  toShortFormat,
} from "../../util/date";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../store/auth-context";
import IconButton from "../UI/IconButton";
import { UserContext } from "../../store/user-context";
import FlatButton from "../UI/FlatButton";
import { getCatString, getCatSymbol } from "../../util/category";
import DropDownPicker from "react-native-dropdown-picker";
// import CurrencyPicker from "react-native-currency-picker";
import DatePicker from "react-native-neat-date-picker";
import { TripContext } from "../../store/trip-context";
import {
  calcSplitList,
  splitExpense,
  splitTypesDropdown,
  travellerToDropdown,
  validateSplitList,
} from "../../util/split";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "../../i18n/supportedLanguages";
import CurrencyPicker from "../Currency/CurrencyPicker";
import { truncateString } from "../../util/string";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInRight,
  FadeOutLeft,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import { asyncStoreSetItem } from "../../store/async-storage";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

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
}) => {
  // set context
  const AuthCtx = useContext(AuthContext);
  const UserCtx = useContext(UserContext);
  const TripCtx = useContext(TripContext);
  const [hideAdvanced, sethideAdvanced] = useState(!isEditing);
  const [countryValue, setCountryValue] = useState("EUR");

  const [loadingTravellers, setLoadingTravellers] = useState(false);
  useEffect(() => {
    async function setTravellers() {
      setLoadingTravellers(true);
      try {
        TripCtx.setCurrentTravellers(TripCtx.tripid);
      } catch (error) {
        console.log("error loading travellers in expenseForm");
      }
      setLoadingTravellers(false);
    }
    setTravellers();
  }, []);

  // currencypicker reference for open/close
  // let currencyPickerRef = undefined;

  // datepicker states
  const [showDatePickerRange, setShowDatePickerRange] = useState(false);
  const [startDate, setStartDate] = useState(
    defaultValues
      ? getFormattedDate(defaultValues.date)
      : getFormattedDate(new Date())
  );
  const [endDate, setEndDate] = useState(
    defaultValues
      ? getFormattedDate(defaultValues.date)
      : getFormattedDate(new Date())
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
    const startDatePlus1 = getDatePlusDays(output.startDate, 1);
    const endDatePlus1 = getDatePlusDays(output.endDate, 1);
    const startDateFormat = getFormattedDate(startDatePlus1);
    const endDateFormat = getFormattedDate(endDatePlus1);
    setStartDate(startDateFormat);
    setEndDate(endDateFormat);
  };

  // list of all splits owed
  const [splitList, setSplitList] = useState(
    defaultValues ? defaultValues.splitList : []
  );
  const [splitListValid, setSplitListValid] = useState(true);

  // dropdown for whoPaid picker
  const currentTravellers = TripCtx.travellers;

  const IsSoloTraveller = currentTravellers.length === 1;
  let currentTravellersAsItems = travellerToDropdown(currentTravellers);

  useEffect(() => {
    currentTravellersAsItems = travellerToDropdown(currentTravellers);
  }, []);

  const [items, setItems] = useState(currentTravellersAsItems);
  const [open, setOpen] = useState(false);
  const [whoPaid, setWhoPaid] = useState(
    defaultValues ? defaultValues.whoPaid : null
  );

  // dropdown for split/owe picker
  const splitTypesItems = splitTypesDropdown();
  const [splitItems, setSplitTypeItems] = useState(splitTypesItems);
  const [openSplitTypes, setOpenSplitTypes] = useState(false);
  const [splitType, setSplitType] = useState(
    defaultValues ? defaultValues.splitType : null
  );

  // dropdown for EQUAL share picker
  const [splitItemsEQUAL, setSplitItemsEQUAL] = useState(
    currentTravellersAsItems
  );
  const [openEQUAL, setOpenEQUAL] = useState(false);
  const [splitTravellersList, setListEQUAL] = useState(
    defaultValues ? defaultValues.listEQUAL : currentTravellers
  );

  // dont show EQUAL share picker when "SELF" is picked
  if (splitType === "SELF") {
    if (openEQUAL) setOpenEQUAL(false);
  }

  function openTravellerMultiPicker() {
    // add whole traveling group who paid automatically to shared list
    if (!defaultValues) {
      setListEQUAL([...currentTravellers]);
    }
    setOpenEQUAL(true);
  }

  function inputSplitListHandler(index, props, value) {
    if (splitType === "EQUAL") return;
    const tempList = [...splitList];
    // TODO: this Number(value) makes it impossible to enter decimal numbers (eg.: 1.9)
    const tempValue = { amount: value, userName: props.userName };
    tempList[index] = tempValue;
    setSplitList(tempList);
    setSplitListValid(
      validateSplitList(tempList, splitType, inputs.amount.value, index)
    );
  }

  const [inputs, setInputs] = useState({
    amount: {
      value: defaultValues ? defaultValues.amount?.toString() : "",
      isValid: true,
    },
    date: {
      value: defaultValues ? getFormattedDate(defaultValues.date) : "",
      isValid: true,
    },
    description: {
      value: defaultValues ? defaultValues.description : "",
      isValid: true,
    },
    category: {
      value: defaultValues
        ? newCat
          ? pickedCat
          : defaultValues.category
        : pickedCat,
      isValid: true,
    },
    country: {
      value: defaultValues ? defaultValues.country : "",
      isValid: true,
    },
    currency: {
      value: defaultValues
        ? defaultValues.currency
        : UserCtx.lastCurrency
        ? UserCtx.lastCurrency
        : TripCtx.tripCurrency,
      isValid: true,
    },
    whoPaid: {
      value: defaultValues ? defaultValues.whoPaid : "",
      isValid: true,
    },
    owePerc: {
      value: defaultValues ? defaultValues.owePerc?.toString() : "",
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

  function splitHandler() {
    // calculate splits
    let listSplits = [];

    const splitTravellers = splitTravellersList;
    listSplits = calcSplitList(
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

  function submitHandler() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const expenseData = {
      uid: AuthCtx.uid,
      amount: +inputs.amount.value,
      date: new Date(startDate),
      endDate: new Date(endDate),
      description: inputs.description.value,
      category: newCat ? pickedCat : inputs.category.value,
      country: inputs.country.value,
      currency: inputs.currency.value,
      whoPaid: whoPaid, // TODO: convert this to uid
      owePerc: +inputs.owePerc.value,
      splitType: splitType,
      listEQUAL: splitTravellersList,
      splitList: splitList,
    };

    // SoloTravellers always pay for themselves
    if (IsSoloTraveller) expenseData.whoPaid = UserCtx.userName;

    // validate the expenseData
    const amountIsValid =
      !isNaN(expenseData.amount) &&
      expenseData.amount > 0 &&
      expenseData.amount < 34359738368;
    const dateIsValid = expenseData.date.toString() !== "Invalid Date";
    const descriptionIsValid = expenseData.description.trim().length > 0;
    const whoPaidIsValid = expenseData.whoPaid !== null;

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
      // show feedback
      // Alert.alert("Invalid Input", "Please check your input values");
      addDefaultValues(pickedCat);
      // alertDefaultValues();
      return;
    }

    // update lastcountry and lastcurrency
    UserCtx.setLastCountry(inputs.country.value);
    asyncStoreSetItem("lastCountry", inputs.country.value);
    UserCtx.setLastCurrency(inputs.currency.value);
    asyncStoreSetItem("lastCurrency", inputs.currency.value);
    onSubmit(expenseData);
  }

  function fastSubmit() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const expenseData = {
      uid: AuthCtx.uid,
      amount: +inputs.amount.value,
      date: new Date(),
      endDate: new Date(),
      description: getCatString(pickedCat),
      category: pickedCat,
      country: UserCtx.lastCountry ? UserCtx.lastCountry : UserCtx.homeCountry,
      currency: UserCtx.lastCurrency
        ? UserCtx.lastCurrency
        : TripCtx.tripCurrency,
      whoPaid: UserCtx.userName,
      owePerc: "0",
      splitType: "SELF",
      listEQUAL: currentTravellers,
      splitList: [],
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

    if (!inputs.date.isValid) {
      const today = new Date();
      setStartDate(today);
      setEndDate(today);
      // inputChangedHandler("date", getFormattedDate(today));
    }
    // for now set default values to every field so everything goes fast
    if (!inputs.country.isValid) {
      inputChangedHandler("country", UserCtx.lastCountry);
    }
    if (!inputs.currency.isValid) {
      inputChangedHandler("currency", UserCtx.lastCurrency);
    }
    if (!inputs.whoPaid.isValid) {
      setWhoPaid(UserCtx.userName);
    }
    if (!inputs.owePerc.isValid) {
      inputChangedHandler("owePerc", "0");
    }
  }

  function alertDefaultValues() {
    Alert.alert(
      "Quick Expense?",
      "Do you want to fill the advanced options with suggested default values? (Today as Date, Your Name, Category as Description, Your last Country and last Currency etc.)",
      [
        {
          text: "Cancel",
          onPress: () => false,
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => {
            addDefaultValues(pickedCat);
          },
        },
      ]
    );
  }

  function toggleAdvancedHandler() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (hideAdvanced) {
      sethideAdvanced(false);
    } else {
      sethideAdvanced(true);
    }
  }

  const advancedSubmitHandler = hideAdvanced ? fastSubmit : submitHandler;

  function updateCurrency() {
    inputChangedHandler("currency", countryValue.split(" ")[0]);
  }

  const formIsInvalid =
    !inputs.amount.isValid ||
    !inputs.description.isValid ||
    !inputs.currency.isValid;

  // NOTE: for DEBUG the pickers
  const showWhoPaid = inputs.amount.value !== "";
  const whoPaidValid = whoPaid !== null;
  const splitTypeEqual = splitType === "EQUAL";
  const splitTypeSelf = splitType === "SELF";
  const hidePickers = true;
  const dateIsRanged = startDate.toString() !== endDate.toString();
  const android = Platform.OS === "android";
  const datepickerJSX = android ? (
    <View
      style={
        showDatePickerRange && { minHeight: Dimensions.get("screen").height }
      }
    >
      <DatePicker
        isVisible={showDatePickerRange}
        mode={"range"}
        onCancel={onCancelRange}
        onConfirm={onConfirmRange}
        startDate={new Date()}
        endDate={new Date()}
        language={Localization.locale.slice(0, 2)}
      />
    </View>
  ) : (
    <DatePicker
      isVisible={showDatePickerRange}
      mode={"range"}
      onCancel={onCancelRange}
      onConfirm={onConfirmRange}
      startDate={new Date()}
      endDate={new Date()}
      language={Localization.locale.slice(0, 2)}
    />
  );

  return (
    <>
      {datepickerJSX}
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={"position"}
          contentContainerStyle={{ flex: 1 }}
          style={styles.form}
        >
          <View style={styles.inputsRow}>
            <Input
              style={styles.rowInput}
              label={i18n.t("priceIn") + inputs.currency.value}
              textInputConfig={{
                keyboardType: "decimal-pad",
                onChangeText: inputChangedHandler.bind(this, "amount"),
                value: inputs.amount.value,
              }}
              invalid={!inputs.amount.isValid}
              // autoFocus={true}
            />
            <IconButton
              icon={
                defaultValues
                  ? newCat
                    ? getCatSymbol(pickedCat)
                    : getCatSymbol(defaultValues.category)
                  : getCatSymbol(pickedCat)
              }
              color={GlobalStyles.colors.primary500}
              size={36}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("CategoryPick", {
                  editedExpenseId: editedExpenseId,
                });
              }}
            />
          </View>
          {/* always show more options when editing */}
          {!isEditing && (
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
            <>
              <View style={styles.currencyContainer}>
                {/* <Text style={styles.currencyLabel}>
                {i18n.t("currencyLabel")}
              </Text> */}
                <CurrencyPicker
                  countryValue={countryValue}
                  setCountryValue={setCountryValue}
                  onChangeValue={updateCurrency}
                  placeholder={isEditing ? defaultValues.currency : null}
                ></CurrencyPicker>
              </View>
              <Input
                label={i18n.t("descriptionLabel")}
                placeholder={pickedCat}
                textInputConfig={{
                  onChangeText: inputChangedHandler.bind(this, "description"),
                  value: inputs.description.value,
                  // multiline: true,
                }}
                invalid={!inputs.description.isValid}
              />

              <View style={styles.dateLabel}>
                <Text style={styles.dateLabelText}>{i18n.t("dateLabel")}</Text>
              </View>
              <View style={styles.dateContainer}>
                <View style={styles.dateIconContainer}>
                  <IconButton
                    icon={"calendar-outline"}
                    size={24}
                    color={GlobalStyles.colors.primary500}
                    style={styles.button}
                    onPress={openDatePickerRange}
                  />
                </View>
                <View>
                  <Text style={styles.advancedText}>
                    {startDate && toShortFormat(new Date(startDate))}
                  </Text>
                  {dateIsRanged && (
                    <Text style={styles.advancedText}>
                      - duplicate until -{" "}
                    </Text>
                  )}
                  {dateIsRanged && (
                    <Text style={styles.advancedText}>
                      {endDate && toShortFormat(new Date(endDate))}
                    </Text>
                  )}
                </View>
              </View>

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
                        placeholder={UserCtx.userName}
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
              {!loadingTravellers && (
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
              <View styles={[styles.advancedRowSplit]}>
                {!splitTypeSelf && whoPaidValid && !IsSoloTraveller && (
                  <Text
                    style={[
                      styles.currencyLabel,
                      { marginTop: 16, marginLeft: 16 },
                    ]}
                  >
                    {i18n.t("whoShared")}
                  </Text>
                )}
                {!splitTypeSelf && (
                  <FlatList
                    // numColumns={2}
                    data={splitList}
                    horizontal={true}
                    contentContainerStyle={{
                      flex: 1,
                      minWidth: "150%",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                    }}
                    ListFooterComponent={<View style={{ width: 100 }}></View>}
                    renderItem={(itemData) => {
                      const splitValue = itemData.item.amount.toString();
                      return (
                        <View
                          style={[
                            GlobalStyles.strongShadow,
                            {
                              flex: 1,
                              minWidth: 120,
                              maxWidth: 145,
                              marginBottom: 16,
                              borderWidth: 1,
                              borderRadius: 16,
                              padding: 8,
                              margin: 8,
                              backgroundColor:
                                GlobalStyles.colors.backgroundColor,
                              borderColor: GlobalStyles.colors.gray700,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: splitListValid
                                ? GlobalStyles.colors.textColor
                                : GlobalStyles.colors.error500,
                            }}
                          >
                            {truncateString(itemData.item.userName, 15)}
                          </Text>
                          {/* Horizontal container  */}
                          <View
                            style={{
                              flexDirection: "row",
                              // place items at the bottom of the container
                              justifyContent: "flex-end",
                              // place items at the right of the container
                              alignItems: "flex-end",
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
                              style={[
                                styles.rowInput,
                                {
                                  minWidth: "25%",
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
                            <Text style={{ paddingBottom: 12 }}>
                              {inputs.currency.value}
                            </Text>
                          </View>
                        </View>
                      );
                    }}
                  ></FlatList>
                )}
              </View>
            </>
          )}
          {formIsInvalid && !hideAdvanced && (
            <Text style={styles.errorText}>{i18n.t("invalidInput")} </Text>
          )}
        </KeyboardAvoidingView>
        <View
          style={[styles.spacerViewAdvanced, hideAdvanced && styles.spacerView]}
        ></View>
        <View style={styles.buttonContainer}>
          <FlatButton style={styles.button} onPress={onCancel}>
            {i18n.t("cancel")}
          </FlatButton>
          <Button style={styles.button} onPress={advancedSubmitHandler}>
            {submitButtonLabel}
          </Button>
        </View>
      </View>
    </>
  );
};

export default ExpenseForm;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: "50%",
  },
  form: {
    flex: 1,
    margin: 16,
    padding: 12,
    paddingBottom: 24,
    marginTop: 30,
    backgroundColor: GlobalStyles.colors.gray500,
    borderRadius: 10,
    borderWidth: 1,
    elevation: 3,
    borderColor: GlobalStyles.colors.gray600,
    shadowColor: GlobalStyles.colors.gray600,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 10,
    justifyContent: "space-around",
    alignContent: "stretch",
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
  rowInput: {},
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
    marginLeft: "5.5%",
  },
  dateLabelText: {
    fontSize: 12,
    fontWeight: "400",
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
    minHeight: "50%",
  },
  spacerViewAdvanced: {
    flex: 1,
    minHeight: "4%",
  },
});
