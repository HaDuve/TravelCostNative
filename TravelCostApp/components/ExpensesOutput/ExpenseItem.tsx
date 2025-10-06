import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { DateTime } from "luxon";
import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GlobalStyles } from "../../constants/styles";
import { TripContext } from "../../store/trip-context";
import { RootNavigationProp } from "../../types/navigation";

import { Category, getCatSymbolMMKV } from "../../util/category";
import { isToday, toShortFormat } from "../../util/date";

import { ExpenseData } from "../../util/expense";
import { constantScale, dynamicScale } from "../../util/scalingUtil";
import { formatExpenseWithCurrency } from "../../util/string";

//Localization

import { de, en, fr, ru } from "../../i18n/supportedLanguages";
import { UserContext } from "../../store/user-context";

import ExpenseCountryFlag from "./ExpenseCountryFlag";

import { OrientationContext } from "../../store/orientation-context";
import { SettingsContext } from "../../store/settings-context";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;

const IconSize = dynamicScale(28, false, 0.5);

function ExpenseItem(props): JSX.Element {
  const { showSumForTravellerName, filtered } = props;
  const { setSelectable, selectItem } = props;
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
  const navigation = useNavigation<RootNavigationProp>();
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

    splitList.forEach(split => {
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

  const splitListHasNonZeroEntries = splitList?.some(item => item.amount !== 0);
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
            keyExtractor={item => {
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
          if (selectItem) {
            selectItem(id);
          }
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
              name={catSymbol as any}
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
              numberOfLines={1}
              ellipsizeMode="tail"
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
              numberOfLines={1}
              ellipsizeMode="tail"
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

const styles = StyleSheet.create({
  amountContainer: {
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: 4,
    height: constantScale(40, 0.5),
    justifyContent: "center",
    paddingHorizontal: dynamicScale(4),
    paddingVertical: 0,
    width: constantScale(150, 0.5),
  },
  amountText: {
    color: GlobalStyles.colors.error300,
    fontSize: dynamicScale(20, false, 0.5),
    fontWeight: "300",
    textAlign: "center",
  },
  avatar: {
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.gray500,
    borderColor: GlobalStyles.colors.primaryGrayed,
    borderRadius: 60,
    borderWidth: dynamicScale(1, false, 0.5),
    height: constantScale(20, 0.5),
    justifyContent: "center",
    marginRight: dynamicScale(-6),
    width: constantScale(20, 0.5),
    ...Platform.select({
      android: {
        minHeight: constantScale(20, 0.5),
        minWidth: constantScale(20, 0.5),
      },
    }),
  },
  avatarContainer: {
    padding: dynamicScale(4),
    paddingRight: dynamicScale(10),
    // center items left
    flexDirection: "row",
    height: constantScale(30, 1),
    width: constantScale(55),
  },
  avatarPaid: {
    // borderWidth: 2,
    borderColor: GlobalStyles.colors.primary700,
  },
  avatarText: {
    color: GlobalStyles.colors.primary700,
    fontSize: dynamicScale(14, false, 0.5),
    fontWeight: "bold",
  },
  countryFlag: {
    marginTop: dynamicScale(3, true),
    // marginRight: 12,
  },
  countryFlagContainer: {
    height: constantScale(40),
    marginRight: dynamicScale(4),
    width: constantScale(50),
  },
  description: {
    fontSize: dynamicScale(15, false, 0.5),
    fontStyle: "italic",
    fontWeight: "300",
    zIndex: 2,
  },

  expenseItem: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderColor: "black",
    flexDirection: "row",
    justifyContent: "space-between",
    marginLeft: 0,
    paddingRight: 0,
  },
  iconContainer: {
    marginLeft: 0,
    marginRight: dynamicScale(8),
    marginTop: dynamicScale(4, true),
  },
  leftItem: {
    alignContent: "flex-start",
    alignItems: "flex-start",
    flex: 1,
    height: constantScale(40, 0.5),
    justifyContent: "flex-start",
  },
  originalCurrencyText: {
    fontSize: dynamicScale(12, false, 0.5),
    fontWeight: "300",
    textAlign: "center",
  },
  pressed: {
    opacity: 0.75,
  },
  secondaryText: {
    color: GlobalStyles.colors.gray700,
    fontSize: dynamicScale(13, false, 0.5),
    zIndex: 1,
  },
  textBase: {
    color: GlobalStyles.colors.textColor,
    marginLeft: dynamicScale(4),
    marginTop: dynamicScale(2, true),
  },
});
