import { StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import FlatButton from "../components/UI/FlatButton";
import Button from "../components/UI/Button";
import { GlobalStyles } from "../constants/styles";
import {
  importGoogleExcelFile,
  importGoogleExcelFileFROM,
} from "../components/ImportExport/ImportFromGoogleXlsx";
import DatePicker from "react-native-neat-date-picker";
import { getDatePlusDays, getFormattedDate } from "../util/date";
import IconButton from "../components/UI/IconButton";

const ImportGSScreen = (props) => {
  const { addExpense, tripid, uid, userName } = props.route.params;

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(getFormattedDate(new Date()));
  const [dateData, setDateData] = useState(null);
  const openDatePicker = () => setShowDatePicker(true);
  const [isPicked, setIsPicked] = useState(false);
  const onCancel = () => {
    setShowDatePicker(false);
  };

  const onConfirm = (output) => {
    setShowDatePicker(false);
    setIsPicked(true);
    // hotfixing datebug for asian countries
    const datePlus1 = getDatePlusDays(output.date, 1);
    const dateFormat = getFormattedDate(datePlus1);
    setDateData(datePlus1);
    setDate(dateFormat);
  };

  const datepickerJSX = (
    <DatePicker
      isVisible={showDatePicker}
      mode={"single"}
      onCancel={onCancel}
      onConfirm={onConfirm}
      startDate={new Date()}
      endDate={new Date()}
      language={"en"}
    />
  );

  return (
    <>
      {datepickerJSX}
      <View style={styles.container}>
        <Text style={styles.titleText}>Import from FoodForNomads</Text>
        <Text style={styles.subTitleText}>
          Would you like to import expenses from a whole foodfornomads excel
          table or just from a specific date onwards?
        </Text>
        <View style={styles.buttonsContainer}>
          <Button
            style={styles.choiceButton}
            onPress={importGoogleExcelFile.bind(
              this,
              uid,
              tripid,
              userName,
              addExpense
            )}
          >
            IMPORT COMPLETE FILE
          </Button>
          <View style={styles.dateOptionsContainer}>
            <IconButton
              icon={"calendar-outline"}
              size={24}
              color={GlobalStyles.colors.primary500}
              style={styles.button}
              onPress={openDatePicker}
            />
            {isPicked && <Text>{date}</Text>}
            <Button
              style={styles.choiceButton}
              onPress={
                !isPicked
                  ? openDatePicker
                  : importGoogleExcelFileFROM.bind(
                      this,
                      uid,
                      tripid,
                      userName,
                      null,
                      dateData
                    )
              }
            >
              {!isPicked ? "PICK DATE" : " IMPORT FROM DATE"}
            </Button>
          </View>
          <FlatButton onPress={() => props.navigation.pop()}>CANCEL</FlatButton>
        </View>
      </View>
    </>
  );
};

export default ImportGSScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: "2%",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonsContainer: {
    flex: 4,
    justifyContent: "space-between",
    padding: "2%",
  },
  choiceButton: {
    padding: "2%",
  },
  dateOptionsContainer: {
    flexDirection: "row",
  },
  titleText: {
    flex: 1,
    padding: "2%",
    fontSize: 24,
    color: GlobalStyles.colors.textColor,
  },
  subTitleText: {
    flex: 5,
    fontSize: 16,
    color: GlobalStyles.colors.textColor,
    paddingHorizontal: "2%",
  },
});
