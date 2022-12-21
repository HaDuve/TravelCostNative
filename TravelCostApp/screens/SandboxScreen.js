import { StyleSheet, Text, View } from "react-native";
import React, { useContext } from "react";
import FlatButton from "../components/UI/FlatButton";
import { importExcelFile } from "../components/ImportExport/OpenXLSXPicker";
import { TripContext } from "../store/trip-context";
import { UserContext } from "../store/user-context";
import { AuthContext } from "../store/auth-context";
import { ExpensesContext } from "../store/expenses-context";

const SandboxScreen = () => {
  const expensesCtx = useContext(ExpensesContext);
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const uid = authCtx.uid;
  const tripid = tripCtx.tripid;
  const userName = userCtx.userName;
  const addExpense = expensesCtx.addExpense;
  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <FlatButton
        onPress={importExcelFile.bind(this, uid, tripid, userName, addExpense)}
      >
        IMPORT FROM GEHMALREISEN EXCEL
      </FlatButton>
    </View>
  );
};

export default SandboxScreen;

const styles = StyleSheet.create({});
