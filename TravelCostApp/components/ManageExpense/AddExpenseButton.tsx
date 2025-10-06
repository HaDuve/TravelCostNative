import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import uniqBy from "lodash.uniqby";
import PropTypes from "prop-types";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  SlideInDown,
  SlideOutDown,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { TourGuideZone } from "rn-tourguide";
import { GlobalStyles } from "../../constants/styles";

//Localization

import { de, en, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import { AuthContext } from "../../store/auth-context";
import { ExpensesContext } from "../../store/expenses-context";
import { OrientationContext } from "../../store/orientation-context";
import { SettingsContext } from "../../store/settings-context";
import { TripContext } from "../../store/trip-context";
import { reloadApp, sleep } from "../../util/appState";
import { getCatSymbol } from "../../util/category";
import {
  ExpenseData,
  findMostDuplicatedDescriptionExpenses,
} from "../../util/expense";
import { safelyParseJSON } from "../../util/jsonParse";
import { constantScale, dynamicScale } from "../../util/scalingUtil";
import { formatExpenseWithCurrency, truncateString } from "../../util/string";
import IconButton from "../UI/IconButton";

import { Gesture, GestureDetector } from "react-native-gesture-handler";

const PageLength = 20;

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

  const topDuplicates = findMostDuplicatedDescriptionExpenses(expCtx.expenses);

  const [lastExpensesNumber, setLastExpensesNumber] = useState(PageLength);

  const topTemplateExpenses = [
    ...topDuplicates,
    ...lastExpenses.slice(0, lastExpensesNumber).filter(exp => {
      // filter out duplicates
      return !topDuplicates.some((e: ExpenseData) => e.id === exp.id);
    }),
  ];

  const [longPressed, setLongPressed] = useState(false);

  const valid = useRef(false);

  useEffect(() => {
    if (longPressed && (!lastExpenses || lastExpenses.length < 1)) {
      setLongPressed(false);
    }
  }, [lastExpenses, longPressed]);

  useEffect(() => {
    valid.current =
      tripCtx.tripid &&
      authCtx.uid &&
      tripCtx.travellers &&
      tripCtx.travellers?.length > 0;
  }, [tripCtx.tripid, authCtx.uid, tripCtx.travellers?.length]);
  const skipCatScreen = settings.skipCategoryScreen;

  const renderExpenseTemplates = ({ item, index }) => {
    const isFirst = index === 0;
    const isThird = index === 3;
    const hasTop3 = topDuplicates && topDuplicates.length > 0;
    // shallow copy item or we will have problems with the expense context
    let data: ExpenseData;
    try {
      data = safelyParseJSON(JSON.stringify(item));
    } catch (error) {
      return <></>;
    }
    const formattedAmount = formatExpenseWithCurrency(
      data.amount,
      data.currency
    );
    const formattedDescription = truncateString(data.description, 15);
    const categoryIcon = getCatSymbol(data.category);
    const cat = data.category;
    const onPressHandler = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLongPressed(false);
      setLastExpensesNumber(PageLength);
      // set date to today
      data.date = new Date();
      data.startDate = new Date();
      data.endDate = new Date();
      delete data.id;
      delete data.rangeId;
      delete data.editedTimestamp;
      navigation.navigate("ManageExpense", {
        pickedCat: data.category,
        tempValues: { ...data },
      });
    };
    return (
      <View
        style={{
          alignSelf: "center",
        }}
      >
        {isFirst && hasTop3 && (
          <Text style={styles.templateContainerSubtitle}>
            {i18n.t("mostUsedExpenses")}
          </Text>
        )}
        {isThird && hasTop3 && (
          <Text style={styles.templateContainerSubtitle}>
            {i18n.t("lastUsedExpenses")}
          </Text>
        )}
        {isFirst && !hasTop3 && (
          <Text style={styles.templateContainerSubtitle}>
            {i18n.t("lastUsedExpenses")}
          </Text>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.expenseTemplateContainer,
            GlobalStyles.strongShadow,
            pressed && GlobalStyles.pressedWithShadow,
          ]}
          onPress={onPressHandler}
        >
          <IconButton
            size={dynamicScale(24)}
            icon={categoryIcon}
            category={cat}
            color={GlobalStyles.colors.textColor}
            onPress={onPressHandler}
          ></IconButton>
          <Text style={styles.descriptionText}>{formattedDescription}</Text>
          <Text style={styles.amountText}>{formattedAmount}</Text>
        </Pressable>
      </View>
    );
  };

  const pressHandler = useCallback(async () => {
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
        await new Promise(resolve => setTimeout(resolve, 1000)); // Adjust delay as needed
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
                onPress: () => {
                  return;
                }, // console.log("Cancel Pressed"),
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
  }, [authCtx, navigation, skipCatScreen, tripCtx.travellers, tripCtx.tripid]);

  const { height } = useContext(OrientationContext);
  const END_POSITION = height * 0.2;
  const position = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      position.value = e.translationY;
      if (position.value < 0) {
        position.value = 0;
      }
    })
    .onEnd(() => {
      if (position.value > END_POSITION) {
        position.value = withTiming(END_POSITION * 5, { duration: 300 }, () => {
          runOnJS(setLongPressed)(false);
        });
      } else {
        position.value = withTiming(0, { duration: 100 });
      }
      //
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: position.value }],
  }));

  async function hideTempOverlay() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    position.value = withTiming(END_POSITION * 3.3, {
      duration: 300,
    });
    await sleep(300);
    setLongPressed(false);
    setLastExpensesNumber(PageLength);
  }

  // show the template expenses overlay
  if (longPressed && lastExpenses && lastExpenses.length > 0) {
    return (
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[styles.marginTemplate, animatedStyle]}
          entering={SlideInDown.duration(600)}
          exiting={SlideOutDown}
        >
          <Pressable
            onPress={hideTempOverlay}
            onLongPress={hideTempOverlay}
            style={({ pressed }) => [
              styles.addButton,
              GlobalStyles.shadowGlowPrimary,
              styles.longPressedButton,
              { flexDirection: "column" },
              pressed && GlobalStyles.pressedWithShadowNoScale,
            ]}
          >
            <View style={styles.templateContainer}>
              <Text style={styles.templateContainerTitle}>
                {i18n.t("templateExpenses")}
              </Text>
              <Text style={styles.arrowDownSymbolText}>▼</Text>
            </View>
            <FlatList
              directionalLockEnabled={true}
              data={topTemplateExpenses}
              renderItem={renderExpenseTemplates}
              onEndReachedThreshold={0.5}
              onEndReached={() => {
                console.log("Expense Template End Found");
                const maxNumber = lastExpenses.length;
                const newNumber = Math.max(
                  maxNumber,
                  lastExpensesNumber + PageLength
                );
                setLastExpensesNumber(newNumber);
              }}
            />
          </Pressable>
        </Animated.View>
      </GestureDetector>
    );
  }
  // if (!valid.current) return <Text>INV</Text>;

  // if (!valid.current) {
  //   return (
  //     <Animated.View
  //       style={[styles.margin]}
  //       entering={SlideInDown.duration(600)}
  //       exiting={SlideOutDown}
  //     >
  //       <Pressable
  //         onPress={() => {
  //           pressHandler();
  //         }}
  //         style={[
  //           styles.addButton,
  //           GlobalStyles.shadowGlowPrimary,
  //           styles.addButtonInactive,
  //         ]}
  //       >
  //         <LoadingBarOverlay
  //           containerStyle={{
  //             backgroundColor: "transparent",
  //             maxHeight: 44,
  //             marginLeft: -4,
  //           }}
  //           noText
  //         ></LoadingBarOverlay>
  //       </Pressable>
  //     </Animated.View>
  //   );
  // }
  return (
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
        style={({ pressed }) => [
          styles.addButton,
          GlobalStyles.shadowGlowPrimary,
          pressed && GlobalStyles.pressedWithShadow,
        ]}
        onPress={pressHandler}
        onLongPress={() => {
          // reset Y position
          position.value = withSpring(0, { duration: 300 });
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setLongPressed(true);
        }}
      >
        <Ionicons
          name={"add-outline"}
          size={dynamicScale(42, false, 0.5)}
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
  addButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: GlobalStyles.colors.primary400,
    borderRadius: 999,
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: dynamicScale(10, true),
    paddingHorizontal: "20%",
    paddingVertical: "19.8%",
  },
  addButtonInactive: {
    backgroundColor: GlobalStyles.colors.primary400,
  },
  amountText: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(18, false, 0.5),
    fontWeight: "300",
  },
  arrowDownSymbolText: {
    color: GlobalStyles.colors.gray300,
    fontSize: dynamicScale(24, false, 0.5),
    fontWeight: "300",
  },
  descriptionText: {
    flex: 1,
    // width: "110%",
    fontStyle: "italic",
    fontWeight: "300",
    fontSize: dynamicScale(15, false, 0.5),
    flexWrap: "wrap",
  },
  expenseTemplateContainer: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
    padding: 8,
    paddingHorizontal: 16,
    width: "76%",
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
  margin: {
    alignContent: "center",
    alignItems: "center",
    alignSelf: "center",
    justifyContent: "center",
  },
  marginTemplate: {
    marginHorizontal: dynamicScale(60),
  },
  templateContainer: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: GlobalStyles.colors.primary400,
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: dynamicScale(10, true),
    minWidth: dynamicScale(330),
    paddingHorizontal: dynamicScale(20),
    paddingVertical: dynamicScale(20, true),
  },
  templateContainerSubtitle: {
    color: GlobalStyles.colors.gray300,
    fontSize: dynamicScale(18, false, 0.5),
    fontWeight: "300",
  },
  templateContainerTitle: {
    color: GlobalStyles.colors.gray300,
    fontSize: dynamicScale(24, false, 0.5),
    fontWeight: "300",
  },
});
