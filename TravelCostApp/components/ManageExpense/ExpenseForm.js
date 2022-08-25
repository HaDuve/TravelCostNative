import { useState, useContext } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import Input from "./Input";
import Button from "../UI/Button";
import { getFormattedDate } from "../../util/date";
import { GlobalStyles } from "../../constants/styles";
import { AuthContext } from "../../store/auth-context";
import IconButton from "../UI/IconButton";
import { UserContext } from "../../store/user-context";
import FlatButton from "../UI/FlatButton";
import { getCatSymbol } from "../../util/category";

const ExpenseForm = ({
  onCancel,
  onSubmit,
  submitButtonLabel,
  defaultValues,
  pickedCat,
  navigation,
}) => {
  const AuthCtx = useContext(AuthContext);
  const UserCtx = useContext(UserContext);
  const [hideAdvanced, sethideAdvanced] = useState(true);

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
      value: defaultValues ? defaultValues.category : "",
      isValid: true,
    },
    country: {
      value: defaultValues ? defaultValues.country : "",
      isValid: true,
    },
    currency: {
      value: defaultValues ? defaultValues.currency : "",
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
      alertDefaultValues();
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

  function addDefaultValues(arg) {
    inputChangedHandler("description", arg);
    inputChangedHandler("category", arg);

    if (inputs.date.value === "") {
      const today = new Date();
      inputChangedHandler("date", getFormattedDate(today));
    }

    // for now set default values to every field so everything goes fast

    inputChangedHandler("country", UserCtx.lastCountry);
    inputChangedHandler("currency", UserCtx.lastCurrency);
    inputChangedHandler("whoPaid", UserCtx.userName);
    inputChangedHandler("owePerc", "0");
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
      {/* toggleable content */}
      {!hideAdvanced && (
        <>
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
          <Input
            label="Category"
            textInputConfig={{
              onChangeText: inputChangedHandler.bind(this, "category"),
              value: inputs.category.value,
            }}
            invalid={!inputs.category.isValid}
          />
          <View style={styles.inputsRowSecond}>
            <Input
              style={styles.rowInput}
              label="Country"
              textInputConfig={{
                onChangeText: inputChangedHandler.bind(this, "country"),
                value: inputs.country.value,
              }}
              invalid={!inputs.country.isValid}
            />
            <Input
              style={styles.rowInput}
              label="Currency"
              textInputConfig={{
                onChangeText: inputChangedHandler.bind(this, "currency"),
                value: inputs.currency.value,
              }}
              invalid={!inputs.currency.isValid}
            />
          </View>
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
        <Button style={styles.button} onPress={submitHandler}>
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
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
  button: {
    minWidth: 200,
    marginHorizontal: 0,
  },
});
