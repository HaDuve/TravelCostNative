import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import PropTypes from "prop-types";

import { GlobalStyles } from "../../constants/styles";
import { isToday, toShortFormat } from "../../util/date";
import { Ionicons } from "@expo/vector-icons";
import { getCatSymbol, Category } from "../../util/category";
import { useContext, useCallback, useState } from "react";
import { TripContext } from "../../store/trip-context";
import { formatExpenseWithCurrency } from "../../util/string";
import React from "react";

import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { FlatList } from "react-native-gesture-handler";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
import { DateTime } from "luxon";
import { UserContext } from "../../store/user-context";
import ExpenseCountryFlag from "./ExpenseCountryFlag";
import { SettingsContext } from "../../store/settings-context";
import { useEffect } from "react";
import * as Haptics from "expo-haptics";
import { ExpenseData } from "../../util/expense";
import { calcSplitList } from "../../util/split";
import { useRef } from "react";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;

function ExpenseItem(props): JSX.Element {
  const { showSumForTravellerName, filtered } = props;
  const { setSelectable } = props;
  const {
    id,
    description,
    amount,
    category,
    country,
    whoPaid,
    currency,
    calcAmount,
    splitList,
    iconName,
    isSpecialExpense,
  }: ExpenseData = props;
  let { date } = props;
  const navigation = useNavigation();
  const tripCtx = useContext(TripContext);
  const userCtx = useContext(UserContext);
  const homeCurrency = tripCtx.tripCurrency;
  const rate = calcAmount / amount;

  const calcTravellerSum = useRef(0);
  const travellerSum = useRef(0);
  const calcTravellerSumString = useRef("");
  const travellerSumString = useRef("");

  // if showSumForTravellerName is set, show the sum of the expense for only this traveller
  const calcSumForTraveller = useCallback(() => {
    if (splitList && splitList.length > 0 && showSumForTravellerName) {
      splitList.forEach((split) => {
        if (split.userName === showSumForTravellerName) {
          calcTravellerSum.current += Number(split.amount) * rate;
          travellerSum.current += Number(split.amount);
        }
      });
      calcTravellerSumString.current = formatExpenseWithCurrency(
        Number(calcTravellerSum.current),
        homeCurrency
      );
      travellerSumString.current = formatExpenseWithCurrency(
        Number(travellerSum.current),
        currency
      );
    }
  }, [splitList, showSumForTravellerName, rate, homeCurrency, currency]);
  calcSumForTraveller();

  const calcAmountString = calcTravellerSum.current
    ? `${calcTravellerSumString.current}`
    : formatExpenseWithCurrency(calcAmount, homeCurrency);

  const amountString = travellerSum.current
    ? `${travellerSumString.current}`
    : formatExpenseWithCurrency(amount, currency);

  if (iconName) console.log(iconName);
  const [catSymbol, setCatSymbol] = useState(iconName ? iconName : "");
  useEffect(() => {
    function setCatSymbolAsync() {
      const listOfCats = userCtx.catIconNames;
      if (listOfCats) {
        const cat: Category = listOfCats.find(({ cat }) => cat === category);
        if (cat?.icon) {
          setCatSymbol(cat.icon);
          return;
        }
      }
      const iconName = getCatSymbol(category);
      setCatSymbol(iconName);
    }
    setCatSymbolAsync();
  }, [userCtx.catIconNames, category]);

  const sameCurrency = homeCurrency === currency;

  const { settings } = useContext(SettingsContext);
  const toggle1 = settings.showFlags;
  const toggle2 = settings.showWhoPaid;
  const toggle3 = settings.hideSpecialExpenses;
  const hideSpecial = toggle3 && isSpecialExpense;

  const navigateToExpense = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("ManageExpense", {
      expenseId: id,
    });
  }, [id, navigation]);
  const originalCurrencyJSX = useCallback(
    () =>
      !sameCurrency ? (
        <>
          <Text
            style={[
              styles.originalCurrencyText,
              hideSpecial && {
                color: GlobalStyles.colors.textHidden,
              },
            ]}
          >
            {amountString}
          </Text>
        </>
      ) : (
        <></>
      ),
    [sameCurrency, amountString, hideSpecial]
  );

  const splitListHasNonZeroEntries = useCallback(
    () => splitList?.some((item) => item.amount !== 0),
    [splitList]
  );
  const islongList = useCallback(
    () =>
      splitList && splitList.length > 3 && splitListHasNonZeroEntries
        ? splitList.slice(0, 2)
        : null,
    [splitList, splitListHasNonZeroEntries]
  );
  const longList = islongList();
  longList?.push({ userName: `+${splitList.length - 2}`, amount: 0 });
  const sharedList = useCallback(
    () =>
      splitList && splitList.length > 0 ? (
        <View style={{ overflow: "visible" }}>
          <FlatList
            scrollEnabled={false}
            data={
              longList
                ? longList.sort((a, b) => {
                    // if username === + put last
                    if (a.userName === "+") return 1;
                    if (b.userName === "+") return -1;
                    // put the whopaid user first, then alphabetically
                    if (a.userName === whoPaid) return -1;
                    if (b.userName === whoPaid) return 1;
                    return a.userName.localeCompare(b.userName);
                  })
                : splitList.sort((a, b) => {
                    // if username === + put last
                    if (a.userName === "+") return 1;
                    if (b.userName === "+") return -1;
                    // put the whopaid user first, then alphabetically
                    if (a.userName === whoPaid) return -1;
                    if (b.userName === whoPaid) return 1;
                    return a.userName.localeCompare(b.userName);
                  })
            }
            horizontal={true}
            renderItem={({ item }) => {
              // if username == whopaid set color to primary
              const userPaid = item.userName === whoPaid;
              return (
                <View
                  style={[
                    styles.avatar,
                    GlobalStyles.shadow,
                    { marginBottom: 16 },
                    userPaid && styles.avatarPaid,
                  ]}
                >
                  <Text style={styles.avatarText}>
                    {item.userName.slice(0, 1)}
                  </Text>
                </View>
              );
            }}
            contentContainerStyle={styles.avatarContainer}
            keyExtractor={(item) => {
              return item.userName;
            }}
          ></FlatList>
        </View>
      ) : (
        <View style={styles.avatarContainer}>
          <View style={[GlobalStyles.shadow, styles.avatar, styles.avatarPaid]}>
            <Text style={styles.avatarText}>{whoPaid?.slice(0, 1)}</Text>
          </View>
        </View>
      ),
    [longList, splitList, whoPaid]
  );

  if (typeof date === "string") date = new Date(date);
  const dateString = useRef("");
  // if date is today, show "Today" instead of date
  // if periodName is "today" dont show "today"
  const todayString = useCallback(
    () => (userCtx.periodName === "day" ? "" : `${i18n.t("today")} `),
    [userCtx.periodName]
  );

  const configureDateString = useCallback(() => {
    dateString.current = date ? date : "no date";
    const hourAndMinuteString = DateTime.fromJSDate(date).toFormat("HH:mm");
    if (isToday(new Date(date))) {
      dateString.current = `${todayString()}${hourAndMinuteString}`;
    } else dateString.current = toShortFormat(date);
  }, [date, todayString]);
  configureDateString();

  if (!id) return <></>;
  return (
    <Animated.View
      entering={FadeInRight}
      exiting={FadeOutLeft}
      style={[{ height: 55 }, hideSpecial && { opacity: 0.75 }]}
    >
      <Pressable
        onPress={navigateToExpense}
        onLongPress={() => {
          console.log("long press item");
          console.log("ExpenseItem ~ setSelectable:", setSelectable);
          if (setSelectable === undefined) return;
          setSelectable(true);
        }}
        style={({ pressed }) => pressed && GlobalStyles.pressed}
      >
        <View style={styles.expenseItem}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={catSymbol}
              size={28}
              color={
                hideSpecial
                  ? GlobalStyles.colors.textHidden
                  : GlobalStyles.colors.textColor
              }
            />
          </View>
          <View style={styles.leftItem}>
            <Text
              maxFontSizeMultiplier={1.2}
              style={[
                styles.textBase,
                styles.description,
                toggle1 && toggle2 && { width: "90%" },
                hideSpecial && { color: GlobalStyles.colors.textHidden },
              ]}
            >
              Test
            </Text>
            <Text
              maxFontSizeMultiplier={1}
              style={[
                styles.textBase,
                styles.secondaryText,
                hideSpecial && { color: GlobalStyles.colors.textHidden },
              ]}
            >
              {dateString.current}
            </Text>
          </View>
          {toggle1 && (
            <ExpenseCountryFlag
              countryName={country}
              style={[GlobalStyles.countryFlagStyle, styles.countryFlag]}
              containerStyle={[
                styles.countryFlagContainer,
                GlobalStyles.shadow,
              ]}
            />
          )}
          {toggle2 && <View>{sharedList()}</View>}
          <View style={styles.amountContainer}>
            <Text
              style={[
                styles.amount,
                hideSpecial && {
                  color: GlobalStyles.colors.errorHidden,
                },
              ]}
            >
              {calcAmountString}
            </Text>
            {originalCurrencyJSX()}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
export default ExpenseItem;

ExpenseItem.propTypes = {
  id: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  date: PropTypes.object.isRequired,
  category: PropTypes.string.isRequired,
  country: PropTypes.string,
  whoPaid: PropTypes.string.isRequired,
  currency: PropTypes.string.isRequired,
  calcAmount: PropTypes.number.isRequired,
  splitList: PropTypes.array,
  iconName: PropTypes.string,
  showSumForTravellerName: PropTypes.string,
  filtered: PropTypes.bool,
  isSpecialExpense: PropTypes.bool,
  setSelectable: PropTypes.func,
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.75,
  },
  expenseItem: {
    height: 55,
    borderWidth: 0,
    borderColor: "black",

    paddingLeft: 16,
    paddingRight: 0,
    marginLeft: 0,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    flexDirection: "row",
    justifyContent: "space-between",
    ...Platform.select({
      ios: {
        paddingVertical: 8,
      },
      android: {
        paddingVertical: 6,
      },
    }),
  },
  textBase: {
    marginTop: 2,
    marginLeft: 4,
    color: GlobalStyles.colors.textColor,
  },
  description: {
    flex: 1,
    // width: "110%",
    fontStyle: "italic",
    fontWeight: "300",
    fontSize: 15,
    zIndex: 2,
    flexWrap: "wrap",
    flexDirection: "row",
  },
  secondaryText: {
    color: GlobalStyles.colors.gray700,
    fontSize: 13,
    zIndex: 1,
  },
  iconContainer: {
    marginTop: 4,
    marginRight: 8,
    marginLeft: 0,
  },
  leftItem: {
    flex: 1,
  },
  amountContainer: {
    paddingHorizontal: 4,
    paddingVertical: 0,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    minWidth: 80,
  },
  amount: {
    minWidth: 100,
    maxWidth: 100,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "300",
    color: GlobalStyles.colors.error300,
  },

  originalCurrencyText: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "300",
  },
  countryFlagContainer: {
    marginRight: "1%",
  },
  countryFlag: {
    marginTop: "6%",
    marginRight: 12,
  },
  avatarContainer: {
    maxHeight: 50,
    padding: 4,
    paddingRight: 10,
    // center items left
    flexDirection: "row",
  },
  avatar: {
    marginRight: -6,
    minHeight: 20,
    minWidth: 20,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.primaryGrayed,
    backgroundColor: GlobalStyles.colors.gray500,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      android: {
        minHeight: 22,
        minWidth: 22,
      },
    }),
  },
  avatarPaid: {
    // borderWidth: 2,
    borderColor: GlobalStyles.colors.primary700,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: GlobalStyles.colors.primary700,
  },
});
