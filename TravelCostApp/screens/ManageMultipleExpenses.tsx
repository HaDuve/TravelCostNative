import { StyleSheet, Text, View } from "react-native";
import React from "react";
import ExpenseForm from "../components/ManageExpense/ExpenseForm";

const ManageMultipleExpenses = () => {
  // TODO: adapt functions to update multiple expenses from ManageExpense.tsx and call ExpenseForm with a multipleExpenses Flag
  // TODO: find out what fields all expenses have in common and set them as default Values
  return (
    <View>
      {/* <ExpenseForm
      onCancel={cancelHandler}
      onSubmit={confirmHandler}
      setIsSubmitting={setIsSubmitting}
      pickedCat={pickedCat}
      iconName={iconName}
      navigation={navigation}
      isEditing={isEditing}
      submitButtonLabel={isEditing ? i18n.t("update") : i18n.t("add")}
      defaultValues={tempValues ?? selectedExpense}
      editedExpenseId={editedExpenseId}
      newCat={newCat}> */}
    </View>
  );
};

export default ManageMultipleExpenses;

const styles = StyleSheet.create({});
