import React, { Alert, Pressable, StyleSheet } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn } from "react-native-reanimated";
import { useContext, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { TourGuideZone } from "rn-tourguide";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import PropTypes from "prop-types";
import { SettingsContext } from "../../store/settings-context";
import { TripContext } from "../../store/trip-context";
import { AuthContext } from "../../store/auth-context";
import LoadingBarOverlay from "../UI/LoadingBarOverlay";
import { reloadApp } from "../../util/appState";
import { ExpensesContext } from "../../store/expenses-context";
import { FlatList } from "react-native";
import { View } from "react-native";
import { Text } from "react-native";
import { ExpenseData } from "../../util/expense";
import { formatExpenseWithCurrency, truncateString } from "../../util/string";
import { getCatString, getCatSymbol } from "../../util/category";
import IconButton from "../UI/IconButton";
import uniqBy from "lodash.uniqby";

const AddExpenseButton = ({ navigation }) => {
  const { settings } = useContext(SettingsContext);
  const tripCtx = useContext(TripContext);
  const authCtx = useContext(AuthContext);
  const expCtx = useContext(ExpensesContext);
  // sort last expenses by editedTimestamp timestamp
  const lastExpenses: ExpenseData[] = uniqBy(
    expCtx.expenses.sort((a, b) => {
      return b.editedTimestamp - a.editedTimestamp;
    }),
    "description"
  );
  const slicedExpenses = lastExpenses.slice(0, 20);

  const [longPressed, setLongPressed] = useState(false);

  const valid = useRef(false);

  useEffect(() => {
    valid.current =
      tripCtx.tripid &&
      authCtx.uid &&
      tripCtx.travellers &&
      tripCtx.travellers?.length > 0;
  }, [tripCtx.tripid, authCtx.uid, tripCtx.travellers?.length]);
  const skipCatScreen = settings.skipCategoryScreen;

  const renderExpenseTemplates = ({ item }) => {
    const data: ExpenseData = item;
    const formattedAmount = formatExpenseWithCurrency(
      data.amount,
      data.currency
    );
    const formattedDescription = truncateString(data.description, 15);
    const categoryIcon = getCatSymbol(data.category);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.expenseTemplateContainer,
          GlobalStyles.strongShadow,
          pressed && GlobalStyles.pressedWithShadow,
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setLongPressed(false);
          navigation.navigate("ManageExpense", {
            pickedCat: data.category,
            tempValues: { ...data },
          });
        }}
      >
        <IconButton size={24} icon={categoryIcon}></IconButton>
        <Text style={styles.description}>{formattedDescription}</Text>
        <Text style={{}}>{formattedAmount}</Text>
      </Pressable>
    );
  };

  const pressHandler = async () => {
    const retryTimeout = 5000; // Adjust this timeout as needed
    const startTime = Date.now();

    const retryFunction = async () => {
      // Your validation logic here
      valid.current =
        tripCtx.tripid &&
        authCtx.uid &&
        tripCtx.travellers &&
        tripCtx.travellers?.length > 0;

      if (!valid.current && Date.now() - startTime < retryTimeout) {
        // Retry after a delay if still invalid
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Adjust delay as needed
        await retryFunction();
      } else {
        if (!valid.current) {
          // After retries, show the alert if still invalid
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          Alert.alert(
            "Loading Data",
            "Please try again later, alternatively login again or restart the App",
            [
              // cancel button
              {
                text: "Cancel",
                onPress: () => console.log("Cancel Pressed"),
                style: "cancel",
              },
              {
                text: "Restart",
                onPress: () => {
                  reloadApp();
                },
              },
              {
                text: "Login",
                onPress: () => {
                  authCtx.logout();
                  reloadApp();
                },
              },
            ]
          );
        } else {
          // If valid, proceed
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          skipCatScreen &&
            navigation.navigate("ManageExpense", {
              pickedCat: "undefined",
            });
          !skipCatScreen && navigation.navigate("CategoryPick");
        }
      }
    };
    retryFunction();
  };

  if (longPressed) {
    return (
      <Animated.View style={[styles.margin]} entering={FadeIn.duration(600)}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setLongPressed(false);
          }}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setLongPressed(false);
          }}
          style={({ pressed }) => [
            styles.addButton,
            GlobalStyles.shadowGlowPrimary,
            styles.longPressedButton,
            { flexDirection: "column" },
            pressed && GlobalStyles.pressedWithShadowNoScale,
          ]}
        >
          <View
            style={{
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
              borderRadius: 5,
            }}
          >
            <Text
              style={[
                {
                  fontWeight: "300",
                  fontSize: 24,
                  color: GlobalStyles.colors.gray300,
                },
              ]}
            >
              Template Expenses
            </Text>
            <Text
              style={[
                {
                  fontWeight: "300",
                  fontSize: 24,
                  color: GlobalStyles.colors.gray300,
                },
              ]}
            >
              ▼
            </Text>
          </View>
          <FlatList data={slicedExpenses} renderItem={renderExpenseTemplates} />
        </Pressable>
      </Animated.View>
    );
  }

  if (!valid.current) {
    return (
      <Animated.View style={[styles.margin]} entering={FadeIn.duration(600)}>
        <Pressable
          onPress={() => {
            pressHandler();
          }}
          style={[
            styles.addButton,
            GlobalStyles.shadowGlowPrimary,
            styles.addButtonInactive,
          ]}
        >
          <LoadingBarOverlay
            containerStyle={{
              backgroundColor: "transparent",
              maxHeight: 44,
              marginLeft: -4,
            }}
            noText
          ></LoadingBarOverlay>
        </Pressable>
      </Animated.View>
    );
  }
  return (
    <Animated.View style={styles.margin} entering={FadeIn.duration(600)}>
      <TourGuideZone
        text={i18n.t("walk2")}
        borderRadius={16}
        shape={"circle"}
        maskOffset={40}
        tooltipBottomOffset={80}
        zone={2}
      ></TourGuideZone>

      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          GlobalStyles.shadowGlowPrimary,
          pressed && GlobalStyles.pressedWithShadow,
        ]}
        onPress={pressHandler}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setLongPressed(true);
        }}
      >
        <Ionicons
          name={"add-outline"}
          size={42}
          color={GlobalStyles.colors.backgroundColor}
        />
      </Pressable>
    </Animated.View>
  );
};

export default AddExpenseButton;

AddExpenseButton.propTypes = {
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  margin: { marginTop: "-100%", marginHorizontal: "40%" },
  addButton: {
    backgroundColor: GlobalStyles.colors.primary400,
    borderRadius: 999,

    marginBottom: "10%",
    paddingVertical: "19.8%",
    paddingHorizontal: "20%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  addButtonInactive: {
    backgroundColor: GlobalStyles.colors.primary400,
  },
  description: {
    flex: 1,
    // width: "110%",
    fontStyle: "italic",
    fontWeight: "300",
    fontSize: 15,
    flexWrap: "wrap",
  },
  longPressedButton: {
    backgroundColor: GlobalStyles.colors.primary400,
    maxHeight: 400,
    // width: "400%",
    minWidth: 330,
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderRadius: 5,
    alignSelf: "center",
    marginTop: 0,
    marginHorizontal: 0,
  },
  expenseTemplateContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    padding: 8,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
    width: "76%",
    alignSelf: "center",
    justifyContent: "space-between",
  },
});
