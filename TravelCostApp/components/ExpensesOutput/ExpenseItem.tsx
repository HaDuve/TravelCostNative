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
import { constantScale, dynamicScale } from "../../util/scalingUtil";
import { OrientationContext } from "../../store/orientation-context";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;

const IconSize = dynamicScale(28, false, 0.5);

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
  // const { orientation, width, height } = useContext(OrientationContext);
  // console.log(
  //   orientation,
  //   width,
  //   height,
  //   "const100:",
  //   constantScale(100, 0.5).toFixed(2),
  //   "dynamic100:",
  //   dynamicScale(100, true, 0.5).toFixed(2)
  // );

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
  const settingShowFlags = settings.showFlags;
  const settingShowWhoPaid = settings.showWhoPaid;
  const settingHideSpecialExpenses = settings.hideSpecialExpenses;
  const hideSpecial = settingHideSpecialExpenses && isSpecialExpense;

  const navigateToExpense = useCallback(async () => {
    if (!id) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }
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
                    { marginBottom: dynamicScale(16, true) },
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

  const { isLandscape } = useContext(OrientationContext);

  // if (!id) return <></>;
  return (
    <View style={hideSpecial && { opacity: 0.75 }}>
      <Pressable
        onPress={navigateToExpense}
        onLongPress={() => {
          if (setSelectable === undefined) return;
          setSelectable(true);
        }}
        style={({ pressed }) => pressed && GlobalStyles.pressed}
      >
        <View
          style={[
            styles.expenseItem,
            {
              height: constantScale(55),
              paddingLeft: dynamicScale(16),
              ...Platform.select({
                ios: {
                  paddingVertical: dynamicScale(8, true),
                },
                android: {
                  paddingVertical: dynamicScale(6, true),
                },
              }),
            },
            isLandscape && {
              height: dynamicScale(100, true),
            },
          ]}
        >
          <View
            style={[styles.iconContainer, { height: constantScale(44, 0.5) }]}
          >
            <Ionicons
              name={catSymbol}
              size={IconSize}
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
                settingShowFlags && settingShowWhoPaid && { width: "90%" },
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
          {settingShowFlags && (
            <View style={styles.countryFlag}>
              <ExpenseCountryFlag
                countryName={country}
                style={GlobalStyles.countryFlagStyle}
                containerStyle={[
                  styles.countryFlagContainer,
                  GlobalStyles.shadow,
                ]}
              />
            </View>
          )}
          {settingShowWhoPaid && <View>{sharedList()}</View>}
          <View style={styles.amountContainer}>
            <Text
              style={[
                styles.amountText,
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
    borderColor: "black",
    paddingRight: 0,
    marginLeft: 0,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  textBase: {
    marginTop: dynamicScale(2, true),
    marginLeft: dynamicScale(4),
    color: GlobalStyles.colors.textColor,
  },
  description: {
    // flex: 1,
    // width: "110%",
    fontStyle: "italic",
    fontWeight: "300",
    fontSize: dynamicScale(15, false, 0.5),
    zIndex: 2,
    flexWrap: "wrap",
    flexDirection: "row",
  },
  secondaryText: {
    color: GlobalStyles.colors.gray700,
    fontSize: dynamicScale(13, false, 0.5),
    zIndex: 1,
  },
  iconContainer: {
    marginTop: dynamicScale(4, true),
    marginRight: dynamicScale(8),
    marginLeft: 0,
  },
  leftItem: {
    flex: 1,
    height: constantScale(40, 0.5),
    alignContent: "flex-start",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  amountContainer: {
    paddingHorizontal: dynamicScale(4),
    paddingVertical: 0,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    width: constantScale(150, 0.5),
    height: constantScale(40, 0.5),
  },
  amountText: {
    textAlign: "center",
    fontSize: dynamicScale(20, false, 0.5),
    fontWeight: "300",
    color: GlobalStyles.colors.error300,
  },

  originalCurrencyText: {
    fontSize: dynamicScale(12, false, 0.5),
    textAlign: "center",
    fontWeight: "300",
  },
  countryFlagContainer: {
    marginRight: dynamicScale(4),
    height: constantScale(40),
    width: constantScale(50),
  },
  countryFlag: {
    marginTop: dynamicScale(3, true),
    // marginRight: 12,
  },
  avatarContainer: {
    maxHeight: dynamicScale(50, true),
    padding: dynamicScale(4),
    paddingRight: dynamicScale(10),
    // center items left
    flexDirection: "row",
    height: constantScale(22, 1),
    width: constantScale(30),
  },
  avatar: {
    marginRight: dynamicScale(-6),
    minHeight: constantScale(20, 0.5),
    minWidth: constantScale(20, 0.5),
    borderRadius: 60,
    borderWidth: dynamicScale(1, false, 0.5),
    borderColor: GlobalStyles.colors.primaryGrayed,
    backgroundColor: GlobalStyles.colors.gray500,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      android: {
        minHeight: constantScale(20, 0.5),
        minWidth: constantScale(20, 0.5),
      },
    }),
  },
  avatarPaid: {
    // borderWidth: 2,
    borderColor: GlobalStyles.colors.primary700,
  },
  avatarText: {
    fontSize: dynamicScale(14, false, 0.5),
    fontWeight: "bold",
    color: GlobalStyles.colors.primary700,
  },
});
