import { useContext, useLayoutEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { ScrollView } from "react-native";
import ExpenseForm from "../components/ManageExpense/ExpenseForm";

import Button from "../components/UI/Button";
import ErrorOverlay from "../components/UI/ErrorOverlay";
import IconButton from "../components/UI/IconButton";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { AuthContext } from "../store/auth-context";
import { ExpensesContext } from "../store/expenses-context";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";
import { deleteExpense, storeExpense, updateExpense } from "../util/http";
import { GlobalStyles } from "./../constants/styles";
import { getRate } from "./../util/currencyExchange";

const ManageExpense = ({ route, navigation }) => {
  const { pickedCat, tempValues, newCat } = route.params;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState();
  const expenseCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);
  const tripCtx = useContext(TripContext);
  const userCtx = useContext(UserContext);
  const tripid = tripCtx.tripid;
  const uid = authCtx.uid;

  const editedExpenseId = route.params?.expenseId;
  const isEditing = !!editedExpenseId;

  const selectedExpense = expenseCtx.expenses.find(
    (expense) => expense.id === editedExpenseId
  );
  //TODO: add tempValues to selected Expense

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? "Edit Expense" : "Add Expense",
    });
  }, [navigation, isEditing]);

  async function deleteExpenseHandler() {
    async function deleteExp() {
      setIsSubmitting(true);
      try {
        await deleteExpense(tripid, uid, editedExpenseId);
        expenseCtx.deleteExpense(editedExpenseId);
        navigation.goBack();
      } catch (error) {
        setError("Could not delete expense - please try again later!");
        setIsSubmitting(false);
      }
    }
    Alert.alert(
      "Are you sure?",
      "Are you sure you want to delete this expense?",
      [
        // The "No" button
        // Does nothing but dismiss the dialog when tapped
        {
          text: "No",
        },
        // The "Yes" button
        {
          text: "Yes",
          onPress: () => {
            deleteExp();
          },
        },
      ]
    );
  }

  function cancelHandler() {
    navigation.goBack();
  }

  async function confirmHandler(expenseData) {
    setIsSubmitting(true);
    try {
      // calc calcAmount from amount, currency and TripCtx.tripCurrency and add it to expenseData
      const base = expenseData.currency;
      const target = tripCtx.tripCurrency;
      const rate = await getRate(base, target);
      const calcAmount = expenseData.amount * rate;
      expenseData.calcAmount = calcAmount;

      // change the splits to calcAmount aswell, nobody cares original currency
      expenseData.splitList?.forEach((split) => {
        console.log("confirmHandler ~ split", split);
        const calcAmount = split.amount * rate;
        split.amount = calcAmount.toFixed(2);
      });

      if (isEditing) {
        expenseCtx.updateExpense(editedExpenseId, expenseData);
        await updateExpense(tripid, uid, editedExpenseId, expenseData);
      } else {
        const id = await storeExpense(tripid, uid, expenseData);
        expenseCtx.addExpense({ ...expenseData, id: id });
      }
      navigation.navigate("RecentExpenses");
    } catch (error) {
      setError("Could not save data - please try again later!" + error);
      setIsSubmitting(false);
    }
  }

  function errorHandler() {
    setError(null);
  }

  if (error && !isSubmitting) {
    return <ErrorOverlay message={error} onConfirm={errorHandler} />;
  }

  if (isSubmitting) {
    return <LoadingOverlay />;
  }

  return (
    <ScrollView style={styles.container}>
      <>
        <ExpenseForm
          onCancel={cancelHandler}
          onSubmit={confirmHandler}
          pickedCat={pickedCat}
          navigation={navigation}
          isEditing={isEditing}
          submitButtonLabel={isEditing ? "Update" : "Add"}
          defaultValues={selectedExpense}
          editedExpenseId={editedExpenseId}
          newCat={newCat}
        />
        {isEditing && (
          <View style={styles.deleteContainer}>
            <IconButton
              icon="trash"
              color={GlobalStyles.colors.error500}
              size={36}
              onPress={deleteExpenseHandler}
            />
          </View>
        )}
      </>
    </ScrollView>
  );
};

export default ManageExpense;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  deleteContainer: {
    marginTop: 16,
    paddingTop: 8,
    alignItems: "center",
  },
});
