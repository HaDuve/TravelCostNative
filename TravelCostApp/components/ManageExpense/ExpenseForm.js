import { useState, useContext, useEffect } from "react";
import { Alert, StyleSheet, Text, View, Pressable } from "react-native";
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
import { travellerToDropdown } from "../../util/util";
import { G } from "react-native-svg";
import { calcSplitList, splitExpense } from "../../util/split";

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

  // dropdown for whoPaid system
  const currentTravellers = TripCtx.travellers;
  const dropdownItems = travellerToDropdown(currentTravellers);
  const [open, setOpen] = useState(false);
  const [whoPaid, setWhoPaid] = useState(
    defaultValues ? defaultValues.whoPaid : null
  );

  const [items, setItems] = useState(dropdownItems);
  // dropdown for owe system
  const oweDropdown = [
    { label: "Self", value: "SELF" },
    { label: "Shared equally", value: "EQUAL" },
    { label: "Exact owe", value: "EXACT" },
    { label: "Percent owe", value: "PERCENT" },
  ];
  const [openSplitTypes, setOpenSplitTypes] = useState(false);
  const [splitType, setSplitType] = useState(
    defaultValues ? defaultValues.splitType : null
  );
  const [splitItems, setSplitTypeItems] = useState(oweDropdown);

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

  function submitHandler() {
    // calculate splits
    let listSplits = [];

    // TODO: get these splitTravellers from inputForm (or a new modal)
    // TODO: get the exactList / percentList from inputForm (or a new modal)

    const splitTravellers = currentTravellers.filter((item) => {
      return item !== whoPaid;
    });
    const exactList = [1, 1, 2];
    const percentList = [0.1, 0.7, 0.2];
    listSplits = calcSplitList(
      splitType,
      inputs.amount.value,
      whoPaid,
      splitTravellers,
      exactList,
      percentList
    );
    if (listSplits) console.log("useEffect ~ listSplits", listSplits);

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
    };

    const amountIsValid = !isNaN(expenseData.amount) && expenseData.amount > 0;
    const dateIsValid = expenseData.date.toString() !== "Invalid Date";
    const descriptionIsValid = expenseData.description.trim().length > 0;
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
      !owePercIsValid
    ) {
      // show feedback
      // Alert.alert("Invalid Input", "Please check your input values");
      addDefaultValues(pickedCat);
      // alertDefaultValues();
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
      return;
    }

    // update lastcountry and lastcurrency
    UserCtx.lastCountry = inputs.country.value;
    UserCtx.lastCurrency = inputs.currency.value;
    onSubmit(expenseData);
  }

  function fastSubmit() {
    // TODO: compute listSplits for fastSubmit
    const splitMap = splitExpense(
      "SELF",
      inputs.amount.value,
      UserCtx.userName,
      listSplits
    );
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
    };
    onSubmit(expenseData);
  }

  function addDefaultValues(arg) {
    const expenseData = {
      uid: AuthCtx.uid,
      amount: +inputs.amount.value,
      date: new Date(inputs.date.value),
      description: inputs.description.value,
      category: inputs.category.value, // TODO: convert this to category
      country: inputs.country.value, // TODO: convert this to country
      currency: inputs.currency.value, // TODO: convert this to currency
      whoPaid: whoPaid, // TODO: convert this to uid
      owePerc: +inputs.owePerc.value,
    };
    const amountIsValid = !isNaN(expenseData.amount) && expenseData.amount > 0;
    const dateIsValid = expenseData.date.toString() !== "Invalid Date";
    const descriptionIsValid = expenseData.description.trim().length > 0;
    const categoryIsValid = true;
    const countryIsValid = true;
    const currencyIsValid = true;
    const whoPaidIsValid = true;
    const owePercIsValid = true;

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

  const whoPaidValid = whoPaid !== null;

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
                  container: { paddingLeft: 4, paddingTop: 4 },
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
              {whoPaidValid && (
                <DropDownPicker
                  open={openSplitTypes}
                  value={splitType}
                  items={splitItems}
                  setOpen={setOpenSplitTypes}
                  setValue={setSplitType}
                  setItems={setSplitTypeItems}
                  // TODO: this always sends splitType=null because splitType only gets set next render
                  // fix this somehow
                  // onClose={splitHandler.bind(this, splitType)}
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
                  containerStyle={styles.dropdownContainer}
                  style={styles.dropdown}
                  textStyle={styles.dropdownTextStyle}
                />
              )}
              {/* <Input
              style={styles.rowInput}
              label="Who paid?"
              textInputConfig={{
                onChangeText: inputChangedHandler.bind(this, "whoPaid"),
                value: inputs.whoPaid.value,
              }}
              invalid={!inputs.whoPaid.isValid}
            /> */}

              {/* <Input
              style={styles.rowInput}
              label="Owe Percent %"
              textInputConfig={{
                onChangeText: inputChangedHandler.bind(this, "owePerc"),
                value: inputs.owePerc.value,
              }}
              invalid={!inputs.owePerc.isValid}
            /> */}
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
  rowInput: {
    flex: 1,
  },
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
    marginTop: 36,
  },
  currencyContainer: {
    flex: 1,
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
    marginVertical: 12,
    marginLeft: 16,
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
});
