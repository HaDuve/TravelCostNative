import { StyleSheet, View } from "react-native";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";

const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import { useNavigation } from "@react-navigation/native";
import { DateTime } from "luxon";
import PropTypes from "prop-types";

import { de, en, fr, ru } from "../../i18n/supportedLanguages";
import { RootNavigationProp } from "../../types/navigation";
import { isIsoDate } from "../../util/date";

import FlatButton from "./FlatButton";

const AddExpenseHereButton = ({ dayISO }) => {
  const navigation = useNavigation<RootNavigationProp>();
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
