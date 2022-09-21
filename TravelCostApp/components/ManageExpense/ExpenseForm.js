import { useState, useContext, useEffect } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
  SectionList,
  Dimensions,
  Keyboard,
} from "react-native";
import Input from "./Input";
import Button from "../UI/Button";
import { getFormattedDate } from "../../util/date";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../store/auth-context";
import IconButton from "../UI/IconButton";
import { UserContext } from "../../store/user-context";
import FlatButton from "../UI/FlatButton";
import { getCatSymbol } from "../../util/category";
import DropDownPicker from "react-native-dropdown-picker";

import CurrencyPicker from "react-native-currency-picker";
import { TripContext } from "../../store/trip-context";
import { G } from "react-native-svg";
import {
  calcSplitList,
  splitExpense,
  splitTypesDropdown,
  travellerToDropdown,
  validateSplitList,
} from "../../util/split";

const ExpenseForm = ({
  onCancel,
  onSubmit,
  submitButtonLabel,
  isEditing,
  defaultValues,
  pickedCat,
  navigation,
}) => {
  // set context
  const AuthCtx = useContext(AuthContext);
  const UserCtx = useContext(UserContext);
  const TripCtx = useContext(TripContext);
  const [hideAdvanced, sethideAdvanced] = useState(!isEditing);

  // currencypicker reference for open/close
  let currencyPickerRef = undefined;

  // list of all splits owed
  const [splitList, setSplitList] = useState(
    defaultValues ? defaultValues.splitList : []
  );
  const [splitListValid, setSplitListValid] = useState(true);

  // dropdown for whoPaid picker
  const currentTravellers = TripCtx.travellers;
  const dropdownItems = travellerToDropdown(currentTravellers);
  const [items, setItems] = useState(dropdownItems);
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
  const [splitItemsEQUAL, setSplitItemsEQUAL] = useState(dropdownItems);
  const [openEQUAL, setOpenEQUAL] = useState(false);
  const [listEQUAL, setListEQUAL] = useState(
    defaultValues ? defaultValues.listEQUAL : []
  );

  // NOTE: we might not even need a picker for each case
  function openTravellerMultiPicker() {
    setOpenEQUAL(true);
  }

  function inputSplitListHandler(index, props, value) {
    if (splitType === "EQUAL") return;
    console.log("inputSplitListHandler ~ inputSplitListHandler");
    const tempList = [...splitList];
    // TODO: this Number(value) makes it impossible to enter decimal numbers (eg.: 1.9)
    const tempValue = { amount: Number(value), userName: props.userName };
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
      value: defaultValues ? defaultValues.category : pickedCat,
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

    const splitTravellers = listEQUAL;
    listSplits = calcSplitList(
      splitType,
      inputs.amount.value,
      whoPaid,
      splitTravellers,
      splitList
    );
    if (listSplits) {
      console.log("~~ listSplits", listSplits);
      setSplitList(listSplits);
    }
  }

  function submitHandler() {
    const expenseData = {
      uid: AuthCtx.uid,
      amount: +inputs.amount.value,
      date: new Date(inputs.date.value),
      description: inputs.description.value,
      category: inputs.category.value,
      country: inputs.country.value,
      currency: inputs.currency.value,
      whoPaid: whoPaid, // TODO: convert this to uid
      owePerc: +inputs.owePerc.value,
      splitType: splitType,
      listEQUAL: listEQUAL,
      splitList: splitList,
    };

    // validate the expenseData
    const amountIsValid = !isNaN(expenseData.amount) && expenseData.amount > 0;
    const dateIsValid = expenseData.date.toString() !== "Invalid Date";
    const descriptionIsValid = expenseData.description.trim().length > 0;
    // unused items below
    const categoryIsValid = true;
    const countryIsValid = true;
    const currencyIsValid = true;
    const whoPaidIsValid = true;
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
    UserCtx.lastCountry = inputs.country.value;
    UserCtx.lastCurrency = inputs.currency.value;
    onSubmit(expenseData);
  }

  function fastSubmit() {
    const expenseData = {
      uid: AuthCtx.uid,
      amount: +inputs.amount.value,
      date: new Date(),
      description: pickedCat,
      category: pickedCat,
      country: UserCtx.lastCountry ? UserCtx.lastCountry : UserCtx.homeCountry,
      currency: UserCtx.lastCurrency
        ? UserCtx.lastCurrency
        : TripCtx.tripCurrency,
      whoPaid: UserCtx.userName,
      owePerc: "0",
      splitType: "SELF",
      listEQUAL: [],
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
      inputChangedHandler("date", getFormattedDate(today));
    }
    // for now set default values to every field so everything goes fast
    if (!inputs.country.isValid) {
      inputChangedHandler("country", UserCtx.lastCountry);
    }
    if (!inputs.currency.isValid) {
      inputChangedHandler("currency", UserCtx.lastCurrency);
    }
    if (!inputs.whoPaid.isValid) {
      inputChangedHandler("whoPaid", UserCtx.userName);
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
    if (hideAdvanced) {
      sethideAdvanced(false);
    } else {
      sethideAdvanced(true);
    }
  }

  const advancedSubmitHandler = hideAdvanced ? fastSubmit : submitHandler;

  const formIsInvalid =
    !inputs.amount.isValid ||
    !inputs.date.isValid ||
    !inputs.description.isValid ||
    !inputs.currency.isValid;

  // NOTE: for DEBUG the pickers
  const showWhoPaid = inputs.amount.value !== "";
  const whoPaidValid = whoPaid !== null;
  // const splitTypeEqual = splitType === "EQUAL";
  const splitTypeEqual = true;
  // hide the pickers
  const hidePickers = true;

  return (
    <>
      <View style={styles.form}>
        <View style={styles.inputsRow}>
          <Input
            style={styles.rowInput}
            label="Price"
            textInputConfig={{
              keyboardType: "decimal-pad",
              onChangeText: inputChangedHandler.bind(this, "amount"),
              value: inputs.amount.value,
            }}
            invalid={!inputs.amount.isValid}
            autoFocus={true}
          />
          <Pressable
            style={styles.topCurrencyPressableContainer}
            onPress={currencyPickerRef?.open()}
          >
            <Text style={styles.topCurrencyText}>{inputs.currency.value}</Text>
          </Pressable>
          <IconButton
            icon={
              defaultValues
                ? getCatSymbol(defaultValues.category)
                : getCatSymbol(pickedCat)
            }
            color={GlobalStyles.colors.primary500}
            size={36}
            onPress={() => {
              navigation.navigate("CategoryPick");
            }}
          />
        </View>
        <Pressable onPress={toggleAdvancedHandler}>
          <View style={styles.advancedRow}>
            <IconButton
              icon={
                hideAdvanced
                  ? "arrow-down-circle-outline"
                  : "arrow-forward-circle-outline"
              }
              color={GlobalStyles.colors.primary500}
              size={28}
              onPress={toggleAdvancedHandler}
            />
            {hideAdvanced && (
              <Text style={styles.advancedText}>Show more options</Text>
            )}
            {!hideAdvanced && (
              <Text style={styles.advancedText}>Show less options</Text>
            )}
          </View>
        </Pressable>
        {/* toggleable content */}
        {!hideAdvanced && (
          <>
            <View style={styles.currencyContainer}>
              <Text style={styles.currencyLabel}>Currency</Text>
              <CurrencyPicker
                currencyPickerRef={(ref) => {
                  currencyPickerRef = ref;
                }}
                enable={true}
                darkMode={false}
                currencyCode={inputs.currency.value}
                showFlag={true}
                showCurrencyName={true}
                showCurrencyCode={false}
                onSelectCurrency={(data) => {
                  inputChangedHandler("currency", data.code);
                }}
                onOpen={() => {
                  console.log("Open");
                }}
                onClose={() => {
                  console.log("Close");
                }}
                showNativeSymbol={true}
                showSymbol={false}
                containerStyle={{
                  container: {},
                  flagWidth: 25,
                  currencyCodeStyle: { color: GlobalStyles.colors.primary500 },
                  currencyNameStyle: { color: GlobalStyles.colors.primary500 },
                  symbolStyle: { color: GlobalStyles.colors.primary500 },
                  symbolNativeStyle: { color: GlobalStyles.colors.primary500 },
                }}
                modalStyle={{
                  container: {},
                  searchStyle: {},
                  tileStyle: {},
                  itemStyle: {
                    itemContainer: {},
                    flagWidth: 25,
                    currencyCodeStyle: {},
                    currencyNameStyle: {},
                    symbolStyle: {},
                    symbolNativeStyle: {},
                  },
                }}
                title={"Currency"}
                searchPlaceholder={"Search"}
                showCloseButton={true}
                showModalTitle={true}
              />
              {/* <Input
              style={styles.rowInput}
              label="Currency"
              textInputConfig={{
                onChangeText: inputChangedHandler.bind(this, "currency"),
                value: inputs.currency.value,
              }}
              invalid={!inputs.currency.isValid}
            /> */}
            </View>
            <Input
              label="Description"
              textInputConfig={{
                multiline: true,
                onChangeText: inputChangedHandler.bind(this, "description"),
                value: inputs.description.value,
              }}
              invalid={!inputs.description.isValid}
            />
            <Input
              style={styles.rowInput}
              label="Date"
              textInputConfig={{
                placeholder: "YYYY-MM-DD",
                maxLength: 10,
                onChangeText: inputChangedHandler.bind(this, "date"),
                value: inputs.date.value,
              }}
              invalid={!inputs.date.isValid}
            />
            {/* <Input
            label="Category"
            textInputConfig={{
              onChangeText: inputChangedHandler.bind(this, "category"),
              value: inputs.category.value,
            }}
            invalid={!inputs.category.isValid}
          /> */}

            <View style={styles.inputsRowSecond}>
              {showWhoPaid && (
                <View style={styles.whoPaidContainer}>
                  <Text style={styles.currencyLabel}>Who paid?</Text>
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
                    modalTitle={"Who paid?"}
                    modalTitleStyle={{
                      color: GlobalStyles.colors.textColor,
                      fontSize: 32,
                      fontWeight: "bold",
                    }}
                    modalContentContainerStyle={{
                      backgroundColor: GlobalStyles.colors.backgroundColor,
                    }}
                    placeholder="Who Paid?"
                    containerStyle={styles.dropdownContainer}
                    style={styles.dropdown}
                    textStyle={styles.dropdownTextStyle}
                  />
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
                  modalTitle={"How are the costs shared?"}
                  modalTitleStyle={{
                    color: GlobalStyles.colors.textColor,
                    fontSize: 32,
                    fontWeight: "bold",
                  }}
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
            {splitTypeEqual && (
              <DropDownPicker
                open={openEQUAL}
                value={listEQUAL}
                items={splitItemsEQUAL}
                setOpen={setOpenEQUAL}
                setValue={setListEQUAL}
                setItems={setSplitItemsEQUAL}
                onClose={splitHandler}
                listMode="MODAL"
                multiple={true}
                min={1}
                max={99}
                modalProps={{
                  animationType: "slide",
                  presentationStyle: "pageSheet",
                }}
                searchable={false}
                modalTitle={"Who is the cost shared between?"}
                modalTitleStyle={{
                  color: GlobalStyles.colors.textColor,
                  fontSize: 32,
                  fontWeight: "bold",
                }}
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
            <View styles={styles.advancedRowSplit}>
              <FlatList
                // numColumns={2}
                data={splitList}
                horizontal={true}
                renderItem={(itemData) => {
                  const splitValue = itemData.item.amount.toString();
                  return (
                    <View
                      style={{
                        borderWidth: 1,
                        borderRadius: 16,
                        padding: 8,
                        margin: 14,
                      }}
                    >
                      <Text
                        style={{
                          minHeight: 36,
                          minWidth: Dimensions.get("window").width / 6,
                          maxWidth: Dimensions.get("window").width / 6,
                          color: splitListValid
                            ? GlobalStyles.colors.textColor
                            : GlobalStyles.colors.error500,
                        }}
                      >
                        {itemData.item.userName}
                      </Text>
                      <Input
                        style={[
                          styles.rowInput,
                          {
                            minWidth: Dimensions.get("window").width / 6,
                            maxWidth: Dimensions.get("window").width / 6,
                          },
                        ]}
                        label="Split"
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
                    </View>
                  );
                }}
              ></FlatList>
            </View>
          </>
        )}
        {formIsInvalid && !hideAdvanced && (
          <Text style={styles.errorText}>
            Invalid input values - please check your entered data!
          </Text>
        )}
      </View>
      <View style={styles.buttonContainer}>
        <FlatButton style={styles.button} onPress={onCancel}>
          Cancel
        </FlatButton>
        <Button style={styles.button} onPress={advancedSubmitHandler}>
          {submitButtonLabel}
        </Button>
      </View>
    </>
  );
};

export default ExpenseForm;

const styles = StyleSheet.create({
  form: {
    margin: 16,
    padding: 12,
    backgroundColor: GlobalStyles.colors.gray500,
    borderRadius: 10,
    borderWidth: 1,
    elevation: 3,
    borderColor: GlobalStyles.colors.gray600,
    shadowColor: GlobalStyles.colors.gray600,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 10,
  },
  topCurrencyPressableContainer: {
    padding: 8,
    marginRight: 4,
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
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "baseline",
  },
  currencyContainer: {
    marginVertical: 4,
    marginHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.gray700,
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
    marginTop: 14,
    fontSize: 12,
    fontStyle: "italic",
    fontWeight: "300",
  },
  dropdownContainer: {
    maxWidth: 160,
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
    color: GlobalStyles.colors.primary500,
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
});
