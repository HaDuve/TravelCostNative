import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import PropTypes from "prop-types";

import { GlobalStyles } from "../../constants/styles";
import { isToday, toShortFormat } from "../../util/date";
import { Ionicons } from "@expo/vector-icons";
import { Category, getCatSymbolMMKV } from "../../util/category";
import { useContext, useCallback, useState, useMemo, memo } from "react";
import { TripContext } from "../../store/trip-context";
import { formatExpenseWithCurrency } from "../../util/string";
import React from "react";

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
import { useRef } from "react";
import { moderateScale, scale, verticalScale } from "../../util/scalingUtil";
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
  const { tripCurrency } = useContext(TripContext);
  const { periodName, catIconNames } = useContext(UserContext);
  const rate = calcAmount / amount;

  const calculateSumForTraveller = useCallback(() => {
    if (
      !showSumForTravellerName ||
      typeof showSumForTravellerName !== "string" ||
      showSumForTravellerName.length < 1 ||
      !splitList ||
      splitList.length === 0
    ) {
      return { calcTravellerSumString: null, travellerSumString: null };
    }

    let tempCalcSum = 0;
    let tempSum = 0;

    splitList.forEach((split) => {
      if (split.userName === showSumForTravellerName) {
        tempCalcSum += Number(split.amount) * rate;
        tempSum += Number(split.amount);
      }
    });

    const calcTravellerSumString = formatExpenseWithCurrency(
      tempCalcSum,
      tripCurrency
    );
    const travellerSumString = formatExpenseWithCurrency(tempSum, currency);

    return { calcTravellerSumString, travellerSumString };
  }, [showSumForTravellerName, splitList, rate, tripCurrency, currency]);

  const { calcTravellerSumString, travellerSumString } = useMemo(
    calculateSumForTraveller,
    [calculateSumForTraveller]
  );
  const calcAmountString =
    calcTravellerSumString ??
    formatExpenseWithCurrency(calcAmount, tripCurrency);

  const amountString =
    travellerSumString ?? formatExpenseWithCurrency(amount, currency);

  const [catSymbol, setCatSymbol] = useState(iconName ? iconName : "");
  useEffect(() => {
    async function setCatSymbolAsync() {
      const listOfCats = catIconNames;
      if (listOfCats) {
        const cat: Category = listOfCats.find(({ cat }) => cat === category);
        if (cat?.icon) {
          setCatSymbol(cat.icon);
          return;
        }
      }
      const storedIcon = getCatSymbolMMKV(category);
      setCatSymbol(storedIcon);
    }
    setCatSymbolAsync();
    // need to disable eslint because of array in deps => rerender every tick problem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const sameCurrency = tripCurrency === currency;

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
  const originalCurrencyJSX = useMemo(
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

  const splitListHasNonZeroEntries = splitList?.some(
    (item) => item.amount !== 0
  );
  const islongListOrNull =
    splitList && splitList?.length > 3 && splitListHasNonZeroEntries
      ? splitList.slice(0, 2)
      : null;
  const longList = islongListOrNull ? [...islongListOrNull] : null;
  longList?.push({ userName: `+${splitList?.length - 2}`, amount: 0 });

  const sharedList = useCallback(
    () =>
      splitList && splitList?.length > 0 ? (
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
                    { marginBottom: verticalScale(16) },
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
          <View style={[styles.avatar, styles.avatarPaid, GlobalStyles.shadow]}>
            <Text style={styles.avatarText}>{whoPaid?.slice(0, 1)}</Text>
          </View>
        </View>
      ),
    [longList?.length, splitList?.length, whoPaid]
  );

  if (typeof date === "string") date = new Date(date);
  const dateString = useRef("");
  // if date is today, show "Today" instead of date
  // if periodName is "today" dont show "today"
  const todayString = useCallback(
    () => (periodName === "day" ? "" : `${i18n.t("today")} `),
    [periodName]
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
    <View
      style={[{ height: verticalScale(55) }, hideSpecial && { opacity: 0.75 }]}
    >
      <Pressable
        onPress={navigateToExpense}
        onLongPress={() => {
          if (setSelectable === undefined) return;
          setSelectable(true);
        }}
        style={({ pressed }) => pressed && GlobalStyles.pressed}
      >
        <View style={styles.expenseItem}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={catSymbol}
              size={moderateScale(28)}
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
              {description}
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
            {originalCurrencyJSX}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export const MemoizedExpenseItem = memo(ExpenseItem);
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
    height: verticalScale(55),
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
    marginTop: verticalScale(2),
    marginLeft: scale(4),
    color: GlobalStyles.colors.textColor,
  },
  description: {
    flex: 1,
    // width: "110%",
    fontStyle: "italic",
    fontWeight: "300",
    fontSize: moderateScale(15),
    zIndex: 2,
    flexWrap: "wrap",
    flexDirection: "row",
  },
  secondaryText: {
    color: GlobalStyles.colors.gray700,
    fontSize: moderateScale(13),
    zIndex: 1,
  },
  iconContainer: {
    marginTop: verticalScale(4),
    marginRight: scale(8),
    marginLeft: 0,
  },
  leftItem: {
    flex: 1,
    maxHeight: verticalScale(40),
    alignContent: "flex-start",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  amountContainer: {
    paddingHorizontal: scale(4),
    paddingVertical: 0,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    minWidth: scale(80),
  },
  amount: {
    minWidth: scale(100),
    maxWidth: scale(100),
    textAlign: "center",
    fontSize: moderateScale(20),
    fontWeight: "300",
    color: GlobalStyles.colors.error300,
  },

  originalCurrencyText: {
    fontSize: moderateScale(12),
    textAlign: "center",
    fontWeight: "300",
  },
  countryFlagContainer: {
    marginRight: scale(4),
  },
  countryFlag: {
    marginTop: verticalScale(3),
    // marginRight: 12,
  },
  avatarContainer: {
    maxHeight: verticalScale(50),
    padding: scale(4),
    paddingRight: scale(10),
    // center items left
    flexDirection: "row",
  },
  avatar: {
    marginRight: scale(-6),
    minHeight: moderateScale(22),
    minWidth: moderateScale(22),
    borderRadius: 60,
    borderWidth: moderateScale(1),
    borderColor: GlobalStyles.colors.primaryGrayed,
    backgroundColor: GlobalStyles.colors.gray500,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      android: {
        minHeight: verticalScale(22),
        minWidth: scale(22),
      },
    }),
  },
  avatarPaid: {
    // borderWidth: 2,
    borderColor: GlobalStyles.colors.primary700,
  },
  avatarText: {
    fontSize: moderateScale(14),
    fontWeight: "bold",
    color: GlobalStyles.colors.primary700,
  },
});
