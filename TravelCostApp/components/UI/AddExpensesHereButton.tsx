import { StyleSheet, View } from "react-native";
import React from "react";

import { i18n } from "../../i18n/i18n";

import FlatButton from "./FlatButton";
import { useNavigation } from "@react-navigation/native";
import { DateTime } from "luxon";
import PropTypes from "prop-types";
import { isIsoDate } from "../../util/date";

const AddExpenseHereButton = ({ dayISO }) => {
  const navigation = useNavigation();
  if (!isIsoDate(dayISO)) {
    return <></>;
  }
  const formattedDayString = `${i18n.t("addExp")}: ${DateTime.fromISO(
    dayISO
  ).toLocaleString()}`;
  return (
    <View>
      <FlatButton
        onPress={() => {
          navigation.navigate("ManageExpense", {
            pickedCat: "undefined",
            dateISO: dayISO,
          });
        }}
      >
        {formattedDayString}
      </FlatButton>
    </View>
  );
};

export default AddExpenseHereButton;

AddExpenseHereButton.propTypes = {
  dayISO: PropTypes.string,
};

const styles = StyleSheet.create({});
