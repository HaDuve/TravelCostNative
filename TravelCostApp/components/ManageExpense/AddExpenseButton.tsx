import React, { Alert, Pressable, StyleSheet } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import { shadowRegressionStyles } from "../../styles/shadow-regression-styles";
import * as Haptics from "expo-haptics";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { TourGuideZone } from "rn-tourguide";

import { i18n } from "../../i18n/i18n";

import PropTypes from "prop-types";
import { SettingsContext } from "../../store/settings-context";
import { TripContext } from "../../store/trip-context";
import { AuthContext } from "../../store/auth-context";
import { reloadApp } from "../../util/appState";
import { ExpensesContext } from "../../store/expenses-context";
import {
  ExpenseData,
  findMostDuplicatedDescriptionExpenses,
} from "../../util/expense";
import uniqBy from "lodash.uniqby";
import { constantScale, dynamicScale } from "../../util/scalingUtil";
import { safelyParseJSON } from "../../util/jsonParse";
import { trackEvent } from "../../util/vexo-tracking";
import { VexoEvents } from "../../util/vexo-constants";
import ExpenseTemplatePickerModal from "./ExpenseTemplatePickerModal";

const PageLength = 20;

const AddExpenseButton = ({ navigation }) => {
  const { settings } = useContext(SettingsContext);
  const tripCtx = useContext(TripContext);
  const authCtx = useContext(AuthContext);
  const expCtx = useContext(ExpensesContext);

  const lastExpenses: ExpenseData[] = uniqBy(
    [...expCtx.expenses].sort((a, b) => {
      return (b.editedTimestamp ?? 0) - (a.editedTimestamp ?? 0);
    }),
    "description"
  );

  const topDuplicates = findMostDuplicatedDescriptionExpenses(expCtx.expenses);

  const [lastExpensesNumber, setLastExpensesNumber] = useState(PageLength);
  const [templatePickerVisible, setTemplatePickerVisible] = useState(false);

  const topTemplateExpenses = [
    ...topDuplicates,
    ...lastExpenses.slice(0, lastExpensesNumber).filter((exp) => {
      return !topDuplicates.some((e: ExpenseData) => e.id === exp.id);
    }),
  ];

  const valid = useRef(false);

  useEffect(() => {
    if (templatePickerVisible && (!lastExpenses || lastExpenses.length < 1)) {
      setTemplatePickerVisible(false);
    }
  }, [lastExpenses, templatePickerVisible]);

  useEffect(() => {
    valid.current =
      tripCtx.tripid &&
      authCtx.uid &&
      tripCtx.travellers &&
      tripCtx.travellers?.length > 0;
  }, [tripCtx.tripid, authCtx.uid, tripCtx.travellers?.length]);
  const skipCatScreen = settings.skipCategoryScreen;

  const closeTemplatePicker = useCallback(() => {
    setTemplatePickerVisible(false);
    setLastExpensesNumber(PageLength);
  }, []);

  const handleSelectTemplate = useCallback(
    (item: ExpenseData) => {
      let data: ExpenseData;
      try {
        data = safelyParseJSON(JSON.stringify(item));
      } catch {
        return;
      }

      closeTemplatePicker();

      trackEvent(VexoEvents.TEMPLATE_EXPENSE_SELECTED, {
        templateDescription: data.description,
        templateCategory: data.category,
        templateCurrency: data.currency,
      });

      data.date = new Date().toISOString();
      data.startDate = new Date().toISOString();
      data.endDate = new Date().toISOString();
      delete data.id;
      delete data.rangeId;
      delete data.editedTimestamp;
      navigation.navigate("ManageExpense", {
        pickedCat: data.category,
        tempValues: { ...data },
      });
    },
    [closeTemplatePicker, navigation]
  );

  const pressHandler = useCallback(async () => {
    const retryTimeout = 5000;
    const startTime = Date.now();

    const retryFunction = async () => {
      valid.current =
        tripCtx.tripid &&
        authCtx.uid &&
        tripCtx.travellers &&
        tripCtx.travellers?.length > 0;

      if (!valid.current && Date.now() - startTime < retryTimeout) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await retryFunction();
      } else {
        if (!valid.current) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          Alert.alert(
            "Loading Data",
            "Please try again later, alternatively login again or restart the App",
            [
              {
                text: "Cancel",
                onPress: () => {
                  return;
                },
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
                  authCtx.logout(tripCtx.tripid);
                  reloadApp();
                },
              },
            ]
          );
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

          trackEvent(VexoEvents.ADD_EXPENSE_BUTTON_PRESSED, {
            skipCategoryScreen: skipCatScreen,
          });

          skipCatScreen &&
            navigation.navigate("ManageExpense", {
              pickedCat: "undefined",
            });
          !skipCatScreen && navigation.navigate("CategoryPick");
        }
      }
    };
    retryFunction();
  }, [authCtx, navigation, skipCatScreen, tripCtx.travellers, tripCtx.tripid]);

  const openTemplatePicker = useCallback(() => {
    const templatesCount = lastExpenses?.length ?? 0;
    const hasTemplates = templatesCount > 0;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent(VexoEvents.ADD_EXPENSE_BUTTON_LONGPRESS, {
      hasTemplates,
      templatesCount,
    });

    if (!hasTemplates) {
      return;
    }

    setTemplatePickerVisible(true);
  }, [lastExpenses]);

  const handleLoadMoreTemplates = useCallback(() => {
    const maxNumber = lastExpenses.length;
    const newNumber = Math.max(maxNumber, lastExpensesNumber + PageLength);
    setLastExpensesNumber(newNumber);
  }, [lastExpenses.length, lastExpensesNumber]);

  return (
    <>
      <ExpenseTemplatePickerModal
        isVisible={templatePickerVisible}
        onClose={closeTemplatePicker}
        templates={topTemplateExpenses}
        topDuplicateCount={topDuplicates.length}
        onSelectTemplate={handleSelectTemplate}
        onLoadMore={handleLoadMoreTemplates}
      />
      <Animated.View
        style={[
          styles.margin,
          {
            maxHeight: dynamicScale(88, false, 0.7),
            maxWidth: dynamicScale(88, false, 0.7),
          },
        ]}
        entering={SlideInDown}
        exiting={SlideOutDown}
      >
        <TourGuideZone
          text={i18n.t("walk2")}
          borderRadius={constantScale(16, 0.5)}
          shape={"circle"}
          maskOffset={constantScale(40, 0.5)}
          tooltipBottomOffset={constantScale(80, 0.5)}
          zone={2}
        ></TourGuideZone>

        <Pressable
          testID="add-expense-fab"
          style={({ pressed }) => [
            styles.addButton,
            shadowRegressionStyles.addExpenseFab,
            pressed && GlobalStyles.pressedWithShadow,
          ]}
          onPress={pressHandler}
          onLongPress={openTemplatePicker}
        >
          <Ionicons
            name={"add-outline"}
            size={dynamicScale(42, false, 0.5)}
            color={GlobalStyles.colors.backgroundColor}
          />
        </Pressable>
      </Animated.View>
    </>
  );
};

export default AddExpenseButton;

AddExpenseButton.propTypes = {
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  margin: {
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
  },
  addButton: {
    backgroundColor: GlobalStyles.colors.primary400,
    borderRadius: 999,
    marginBottom: dynamicScale(10, true),
    paddingVertical: "19.8%",
    paddingHorizontal: "20%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
});
