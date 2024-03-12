import { StyleSheet, View } from "react-native";
import React from "react";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import FlatButton from "./FlatButton";
import { useNavigation } from "@react-navigation/native";
import { DateTime } from "luxon";
import PropTypes from "prop-types";

const AddExpensesHereButton = ({ dayISO }) => {
  const navigation = useNavigation();
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

export default AddExpensesHereButton;

AddExpensesHereButton.propTypes = {
  dayISO: PropTypes.string,
};

const styles = StyleSheet.create({});
