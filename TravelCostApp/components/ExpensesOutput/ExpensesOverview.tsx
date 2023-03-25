import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import React, { useContext, useState } from "react";
import ExpenseCategories from "./ExpenseStatistics/ExpenseCategories";
import IconButton from "../UI/IconButton";
import ExpenseGraph from "./ExpenseStatistics/ExpenseGraph";
import { GlobalStyles } from "../../constants/styles";
import * as Haptics from "expo-haptics";
//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import ToggleButton from "../../assets/SVG/toggleButton";
import { TourGuideZone } from "rn-tourguide";
import { UserContext } from "../../store/user-context";
import PropTypes from "prop-types";

const ExpensesOverview = ({ navigation, expenses, periodName }) => {
  const [toggleGraph, setToggleGraph] = useState(false);
  const userCtx = useContext(UserContext);

  async function toggleContent() {
    const isPremium = await userCtx.checkPremium();
    if (!isPremium) {
      navigation.navigate("Paywall");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setToggleGraph(!toggleGraph);
  }

  let titleString = "";
  switch (periodName) {
    case "total":
      titleString = i18n.t("overview");
      break;
    default:
      // convert day into days etc. for localization
      titleString = `${i18n.t("last")} ${i18n.t(periodName + "s")}`;
      break;
  }

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        {!toggleGraph && <Text style={styles.titleText}> {titleString}</Text>}
        {toggleGraph && (
          <Text style={styles.titleText}> {i18n.t("categories")} </Text>
        )}
      </View>

      {!toggleGraph && (
        <ExpenseGraph
          navigation={navigation}
          expenses={expenses}
          periodName={periodName}
        />
      )}
      {toggleGraph && (
        <ExpenseCategories
          expenses={expenses}
          periodName={periodName}
          navigation={navigation}
        />
      )}

      <View
        style={[
          styles.toggleButton,
          // styles.toggleButton
        ]}
      >
        <TourGuideZone
          text={i18n.t("walk4")}
          tooltipBottomOffset={66}
          maskOffset={60}
          zone={4}
        >
          <Pressable
            onPress={toggleContent}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <ToggleButton></ToggleButton>
          </Pressable>
        </TourGuideZone>
      </View>
    </View>
  );
};

export default ExpensesOverview;

ExpensesOverview.propTypes = {
  expenses: PropTypes.array.isRequired,
  periodName: PropTypes.string.isRequired,
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {},
  pressed: {
    opacity: 0.65,
  },
  titleText: {
    paddingTop: 12,
    paddingRight: 20,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold",
    fontStyle: "italic",
    color: GlobalStyles.colors.gray700,
    marginLeft: "2%",
  },
  toggleButton: {
    flex: 0,
    borderRadius: 999,
    marginHorizontal: 150,
    marginBottom: "-2%",
    marginTop: "-20%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,

    elevation: 2,
    shadowColor: GlobalStyles.colors.textColor,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
});