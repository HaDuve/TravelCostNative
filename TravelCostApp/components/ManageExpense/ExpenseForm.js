import { useState, useContext } from "react";
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

import CurrencyPicker from "react-native-currency-picker";
import { TripContext } from "../../store/trip-context";

const ExpenseForm = ({
  onCancel,
  onSubmit,
  submitButtonLabel,
  isEditing,
  defaultValues,
  pickedCat,
  navigation,
}) => {
  const AuthCtx = useContext(AuthContext);
  const UserCtx = useContext(UserContext);
  const TripCtx = useContext(TripContext);
  const [hideAdvanced, sethideAdvanced] = useState(!isEditing);

  let currencyPickerRef = undefined;

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
    const expenseData = {
      uid: AuthCtx.uid,
      amount: +inputs.amount.value,
      date: new Date(inputs.date.value),
      description: inputs.description.value,
      category: inputs.category.value,
      country: inputs.country.value,
      currency: inputs.currency.value,
      whoPaid: inputs.whoPaid.value, // TODO: convert this to uid
      owePerc: +inputs.owePerc.value,
    };

    const amountIsValid = !isNaN(expenseData.amount) && expenseData.amount > 0;
    const dateIsValid = expenseData.date.toString() !== "Invalid Date";
    const descriptionIsValid = expenseData.description.trim().length > 0;
    const categoryIsValid = expenseData.description.trim().length > 0;
    const countryIsValid = expenseData.description.trim().length > 0;
    const currencyIsValid = expenseData.description.trim().length > 0;
    const whoPaidIsValid = expenseData.description.trim().length > 0;
    const owePercIsValid =
      !isNaN(expenseData.owePerc) &&
      expenseData.owePerc >= 0 &&
      expenseData.owePerc <= 100;

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
      whoPaid: inputs.whoPaid.value, // TODO: convert this to uid
      owePerc: +inputs.owePerc.value,
    };
    const amountIsValid = !isNaN(expenseData.amount) && expenseData.amount > 0;
    const dateIsValid = expenseData.date.toString() !== "Invalid Date";
    const descriptionIsValid = expenseData.description.trim().length > 0;
    const categoryIsValid = expenseData.description.trim().length > 0;
    const countryIsValid = expenseData.description.trim().length > 0;
    const currencyIsValid = expenseData.description.trim().length > 0;
    const whoPaidIsValid = expenseData.description.trim().length > 0;
    const owePercIsValid =
      !isNaN(expenseData.owePerc) &&
      expenseData.owePerc >= 0 &&
      expenseData.owePerc <= 100;

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
    !inputs.category.isValid ||
    !inputs.country.isValid ||
    !inputs.currency.isValid ||
    !inputs.whoPaid.isValid ||
    !inputs.owePerc.isValid;

  return (
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
            <Input
              style={styles.rowInput}
              label="Who paid?"
              textInputConfig={{
                onChangeText: inputChangedHandler.bind(this, "whoPaid"),
                value: inputs.whoPaid.value,
              }}
              invalid={!inputs.whoPaid.isValid}
            />
            <Input
              style={styles.rowInput}
              label="Owe Percent %"
              textInputConfig={{
                onChangeText: inputChangedHandler.bind(this, "owePerc"),
                value: inputs.owePerc.value,
              }}
              invalid={!inputs.owePerc.isValid}
            />
          </View>
        </>
      )}
      {formIsInvalid && !hideAdvanced && (
        <Text style={styles.errorText}>
          Invalid input values - please check your entered data!
        </Text>
      )}
      <View style={styles.buttonContainer}>
        <FlatButton style={styles.button} onPress={onCancel}>
          Cancel
        </FlatButton>
        <Button style={styles.button} onPress={advancedSubmitHandler}>
          {submitButtonLabel}
        </Button>
      </View>
    </View>
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
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 8,
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
});
