import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import PropTypes from "prop-types";

import { GlobalStyles } from "../../constants/styles";
import { isToday, toShortFormat } from "../../util/date";
import { Ionicons } from "@expo/vector-icons";
import { getCatSymbol, Category } from "../../util/category";
import { memo, useContext, useCallback, useState } from "react";
import { TripContext } from "../../store/trip-context";
import { formatExpenseString } from "../../util/string";
import React from "react";

import Animated, {
  FadeInRight,
  FadeOutLeft,
  SlideInRight,
  SlideInUp,
  SlideOutDown,
  SlideOutLeft,
} from "react-native-reanimated";
import { FlatList } from "react-native-gesture-handler";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "../../i18n/supportedLanguages";
import { DateTime } from "luxon";
import { UserContext } from "../../store/user-context";
import getSymbolFromCurrency from "currency-symbol-map";
import ExpenseCountryFlag from "./ExpenseCountryFlag";
import { SettingsContext } from "../../store/settings-context";
import { useEffect } from "react";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;

function ExpenseItem(props): JSX.Element {
  const {
    id,
    description,
    amount,
    date,
    startDate,
    category,
    country,
    whoPaid,
    currency,
    calcAmount,
    splitList,
    iconName,
    showSumForTravellerName,
  } = props;
  const navigation = useNavigation();
  const TripCtx = useContext(TripContext);
  const UserCtx = useContext(UserContext);
  const homeCurrency = TripCtx.tripCurrency;
  const homeCurrencySymbol = getSymbolFromCurrency(homeCurrency);
  const currencySymbol = getSymbolFromCurrency(currency);
  const rate = calcAmount / amount;
  let calcTravellerSum = 0;
  let travellerSum = 0;
  let calcTravellerSumString = "";
  let travellerSumString = "";
  if (splitList && splitList.length > 0 && showSumForTravellerName) {
    splitList.forEach((split) => {
      console.log("splitList.forEach ~ split:", split);
      if (split.userName === showSumForTravellerName) {
        calcTravellerSum += Number(split.amount) * rate;
        travellerSum += Number(split.amount);
      }
    });
    calcTravellerSumString = formatExpenseString(Number(calcTravellerSum));
    travellerSumString = formatExpenseString(Number(travellerSum));
  }
  const calcAmountString = calcTravellerSum
    ? `${calcTravellerSumString}`
    : formatExpenseString(calcAmount);

  const amountString = travellerSum
    ? `${travellerSumString}`
    : formatExpenseString(amount);

  if (iconName) console.log(iconName);
  const [catSymbol, setCatSymbol] = useState(iconName ? iconName : "");
  useEffect(() => {
    function setCatSymbolAsync() {
      const listOfCats = UserCtx.catIconNames;
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
  }, [UserCtx.catIconNames, category]);

  const sameCurrency = homeCurrency === currency;

  const { settings } = useContext(SettingsContext);
  const toggle1 = settings.showFlags;
  const toggle2 = settings.showWhoPaid;

  const memoizedCallback = useCallback(async () => {
    await UserCtx.checkConnectionUpdateUser();
    navigation.navigate("ManageExpense", {
      expenseId: id,
    });
  }, [id, navigation]);
  const originalCurrencyJSX = !sameCurrency ? (
    <>
      <Text style={styles.originalCurrencyText}>
        {amountString}
        {currencySymbol}
      </Text>
    </>
  ) : (
    <></>
  );

  const splitListHasNonZeroEntries = splitList?.some(
    (item) => item.amount !== 0
  );
  const longList =
    splitList && splitList.length > 2 && splitListHasNonZeroEntries
      ? splitList.slice(0, 2)
      : null;
  longList?.push({ userName: "+" });
  const sharedList =
    splitList && splitList.length > 0 ? (
      <View style={{ overflow: "visible" }}>
        <FlatList
          scrollEnabled={false}
          data={longList ? longList : splitList}
          horizontal={true}
          renderItem={({ item }) => (
            <View
              style={[styles.avatar, GlobalStyles.shadow, { marginBottom: 16 }]}
            >
              <Text style={styles.avatarText}>{item.userName.slice(0, 1)}</Text>
            </View>
          )}
          contentContainerStyle={styles.avatarContainer}
          keyExtractor={(item) => item + Math.random()}
        ></FlatList>
      </View>
    ) : (
      <View style={styles.avatarContainer}>
        <View style={[GlobalStyles.shadow, styles.avatar]}>
          <Text style={styles.avatarText}>{whoPaid?.slice(0, 1)}</Text>
        </View>
      </View>
    );

  if (!id) return <></>;

  let dateString = date ? date : "no date";
  // if date is today, show "Today" instead of date
  // if periodName is "today" dont show "today"
  const todayString = UserCtx.periodName === "day" ? "" : `${i18n.t("today")} `;
  const hourAndMinuteString = DateTime.fromJSDate(date).toFormat("HH:mm");
  if (isToday(new Date(date))) {
    dateString = `${todayString}${hourAndMinuteString}`;
  } else dateString = toShortFormat(date);

  return (
    <Animated.View
      entering={FadeInRight}
      exiting={FadeOutLeft}
      style={{ height: 55 }}
    >
      <Pressable
        onPress={memoizedCallback}
        style={({ pressed }) => pressed && GlobalStyles.pressed}
      >
        <View style={styles.expenseItem}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={catSymbol}
              size={28}
              color={GlobalStyles.colors.textColor}
            />
          </View>
          <View style={styles.leftItem}>
            <Text style={[styles.textBase, styles.description]}>
              {description}
            </Text>
            <Text style={[styles.textBase, styles.secondaryText]}>
              {dateString}
            </Text>
          </View>
          {toggle1 && (
            <ExpenseCountryFlag
              countryName={country}
              style={styles.countryFlag}
              containerStyle={[
                styles.countryFlagContainer,
                GlobalStyles.shadow,
              ]}
            />
          )}
          {toggle2 && <View>{sharedList}</View>}
          <View style={styles.amountContainer}>
            <Text style={styles.amount}>
              {calcAmountString}
              {homeCurrencySymbol}
            </Text>
            {originalCurrencyJSX}
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
  startDate: PropTypes.object,
  showSumForTravellerName: PropTypes.string,
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.75,
  },
  expenseItem: {
    height: 55,
    borderWidth: 0,
    borderColor: "black",
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 0,
    marginLeft: 0,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  textBase: {
    marginTop: 2,
    marginLeft: 4,
    color: GlobalStyles.colors.textColor,
  },
  description: {
    flex: 1,
    width: "90%",
    fontStyle: "italic",
    fontWeight: "300",
    fontSize: 15,
  },
  secondaryText: {
    color: GlobalStyles.colors.gray700,
    fontSize: 13,
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
    width: 30,
    height: 25,
    marginTop: "6%",
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray700,
    alignItems: "center",
    justifyContent: "center",
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
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: GlobalStyles.colors.primary700,
  },
});
