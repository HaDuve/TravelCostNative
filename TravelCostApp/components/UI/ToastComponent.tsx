import Toast, {
  BaseToast,
  ErrorToast,
  ToastConfig,
} from "react-native-toast-message";
import React from "react";
import { Dimensions, StyleSheet, View, FlatList } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import LoadingBarOverlay from "./LoadingBarOverlay";
import { Text } from "react-native";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import * as Progress from "react-native-progress";
import BackgroundGradient from "./BackgroundGradient";
import { TouchableOpacity } from "react-native-gesture-handler";
import { getMMKVString, setMMKVString } from "../../store/mmkv";
import { DEVELOPER_MODE } from "../../confAppConstants";
import { isPremiumMember } from "../Premium/PremiumConstants";
import { ProgressBar } from "react-native-paper";
import { formatExpenseWithCurrency } from "../../util/string";
import { Pressable } from "react-native";

const CONTENTCONTAINERSTYLE = { paddingLeft: 10 };
const MINHEIGHT = 60;
const toastConfig: ToastConfig = {
  /*
      Overwrite 'success' type,
      by modifying the existing `BaseToast` component
    */
  success: (props) => (
    <BaseToast
      {...props}
      style={[
        {
          borderLeftColor: GlobalStyles.colors.primary500,
          minHeight: MINHEIGHT,
        },
        GlobalStyles.wideStrongShadow,
      ]}
      contentContainerStyle={CONTENTCONTAINERSTYLE}
      text1Style={{
        fontSize: 17,
        fontWeight: "500",
      }}
      text2Style={{
        fontSize: 15,
        fontWeight: "400",
      }}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
      onPress={() => Toast.hide()}
    />
  ),
  /*
      Overwrite 'error' type,
      by modifying the existing `ErrorToast` component
    */
  error: (props) => (
    <ErrorToast
      {...props}
      style={[
        { borderLeftColor: GlobalStyles.colors.error500, minHeight: MINHEIGHT },
        GlobalStyles.wideStrongShadow,
      ]}
      contentContainerStyle={CONTENTCONTAINERSTYLE}
      text1Style={{
        fontSize: 17,
        fontWeight: "500",
      }}
      text2Style={{
        fontSize: 15,
        fontWeight: "400",
      }}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
      onPress={() => Toast.hide()}
    />
  ),
  /*
      Or create a completely new type - `tomatoToast`,
      building the layout from scratch.

      I can consume any custom `props` I want.
      They will be passed when calling the `show` method (see below)
    */
  loading: (props) => {
    const { progress } = props.props;
    const size = "small";
    const progressValid =
      progress && typeof progress == "number" && progress >= 0 && progress <= 1;
    const MINHEIGHT = 88;
    const barWidth = Dimensions.get("screen").width * 0.83;
    const loadingColor = GlobalStyles.colors.cat8;
    const unfilledColor = GlobalStyles.colors.gray600;
    const loadingBarJSX = progressValid ? (
      <View style={GlobalStyles.strongShadow}>
        <Progress.Bar
          style={{
            marginTop: -22,
            marginLeft: 14,
          }}
          progress={progress}
          color={loadingColor}
          unfilledColor={unfilledColor}
          borderWidth={0}
          borderRadius={8}
          height={14}
          width={barWidth}
        ></Progress.Bar>
      </View>
    ) : (
      <></>
    );
    return (
      // props.progress - is a number from 0 to 1 or -1 (indeterminate)
      <View style={[{ flex: 1 }, GlobalStyles.strongShadow]}>
        <BaseToast
          {...props}
          style={[
            {
              borderLeftColor: GlobalStyles.colors.cat8,
              backgroundColor: GlobalStyles.colors.backgroundColor,
            },
            GlobalStyles.wideStrongShadow,
            progressValid && { minHeight: MINHEIGHT, paddingBottom: 16 },
          ]}
          contentContainerStyle={CONTENTCONTAINERSTYLE}
          text1Style={{
            fontSize: 17,
            fontWeight: "500",
          }}
          text2Style={{
            fontSize: 15,
            fontWeight: "400",
          }}
          text1NumberOfLines={2}
          text2NumberOfLines={2}
          renderTrailingIcon={() => (
            <View
              style={{
                flex: 1,
                // maxWidth: 55,
                // padding: 20,
                // marginLeft: -40,
                marginRight: 30,
                marginTop: progressValid ? 18 : 12,
                maxHeight: 20,
                maxWidth: 20,
              }}
            >
              {/* Below is just the spinner, the loading BAR is in loadingBarJSX */}
              <LoadingBarOverlay size={size}></LoadingBarOverlay>
            </View>
          )}
          onPress={() => Toast.hide()}
        />
        {loadingBarJSX}
      </View>
    );
  },
  banner: (props) => (
    <TouchableOpacity
      onPress={() => {
        // console.log("Pressed Touchable in Config");
        props.onPress();
      }}
      style={[styles.bannerContainerContainer, GlobalStyles.wideStrongShadow]}
    >
      <BackgroundGradient style={[styles.bannerContainer]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <TouchableOpacity
            onPress={() => {
              // console.log("Pressed Touchable in Config");
              props.onPress();
            }}
          >
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.bannerText1}>{props.text1}</Text>
            </View>
            <Text style={styles.bannerText2}>{props.text2}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Toast.hide();
            }}
          >
            <View style={styles.xCloseContainer}>
              <View style={[styles.xCloseButton, GlobalStyles.strongShadow]}>
                <Text style={{ color: GlobalStyles.colors.gray700 }}>X</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </BackgroundGradient>
    </TouchableOpacity>
  ),
  budgetOverview: (props) => {
    const text3 = props.props.text3;
    const travellerList = props.props.travellerList;
    const travellerBudgets = props.props.travellerBudgets;
    const travellerSplitExpenseSums = props.props.travellerSplitExpenseSums;
    const currency = props.props.currency;
    const noTotalBudget = props.props.noTotalBudget;
    const periodName = props.props.periodName;
    const periodLabel = props.props.periodLabel;
    const budgetNumber = props.props.budgetNumber;
    const periodBudgetString = props.props.periodBudgetString;
    const lastRateUnequal1 = props.props.lastRateUnequal1;

    const hasMultipleTravellers = travellerList && travellerList.length > 1;

    return (
      <View
        style={[styles.budgetOverviewContainer, GlobalStyles.wideStrongShadow]}
      >
        <View style={styles.budgetOverviewHeader}>
          <Text style={styles.overviewTextTitle}>{i18n.t("overview")}</Text>
          <Pressable onPress={() => Toast.hide()}>
            <Text>X</Text>
          </Pressable>
        </View>

        {hasMultipleTravellers && (
          <FlatList
            data={travellerList}
            ListHeaderComponent={() => {
              return (
                <Text style={styles.overviewTextTitle}>
                  {i18n.t("budgetPerTraveller")}:{" "}
                  {formatExpenseWithCurrency(travellerBudgets, currency)} /{" "}
                  {i18n.t(periodName)}
                </Text>
              );
            }}
            renderItem={({ item, index }) => {
              const sum = formatExpenseWithCurrency(
                +travellerSplitExpenseSums[index].toFixed(2),
                currency
              );
              const budgetProgress =
                travellerSplitExpenseSums[index] / travellerBudgets;
              const budgetColor = noTotalBudget
                ? GlobalStyles.colors.primary500
                : budgetProgress <= 1
                ? GlobalStyles.colors.primary500
                : GlobalStyles.colors.error300;
              const unfilledColor: string = noTotalBudget
                ? GlobalStyles.colors.primary500
                : budgetProgress <= 1
                ? GlobalStyles.colors.gray600
                : GlobalStyles.colors.errorGrayed;
              return (
                <View style={styles.travellerItemContainer}>
                  <View style={{ flexDirection: "row" }}>
                    <Text style={styles.overviewTextSmall}>{item}:</Text>
                    <Text
                      style={[
                        styles.overViewTextTravellerSum,
                        styles.sumTextMoveRight,
                      ]}
                    >
                      {sum}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.travellerItemProgressBarContainer,
                      GlobalStyles.shadow,
                    ]}
                  >
                    <Progress.Bar
                      color={budgetColor}
                      unfilledColor={unfilledColor}
                      borderWidth={0}
                      progress={budgetProgress}
                      width={180}
                      height={16}
                      borderRadius={8}
                    ></Progress.Bar>
                  </View>
                </View>
              );
            }}
          ></FlatList>
        )}
        {lastRateUnequal1 && (
          <View>
            <Text style={styles.overviewTextTitle}>
              {i18n.t("currencyLabel")}
            </Text>
            <Text style={styles.overviewTextInfo}>{text3}</Text>
            <Text style={styles.overviewTextInfo}>{props.text1}</Text>
            <Text style={styles.overviewTextInfo}>{periodBudgetString}</Text>
          </View>
        )}
        <Text style={styles.overviewTextInfo}>{props.text2}</Text>
      </View>
    );
  },
};

function isCalledToday() {
  const bannerTime = getMMKVString("BannerTime");
  // console.log("isCalledToday ~ bannerTime:", bannerTime);
  const today = new Date();
  const bannerDate = new Date(bannerTime);
  setMMKVString("BannerTime", today.toISOString());
  if (DEVELOPER_MODE || !bannerTime) return false;
  if (
    today.getDate() === bannerDate.getDate() &&
    today.getMonth() === bannerDate.getMonth() &&
    today.getFullYear() === bannerDate.getFullYear()
  ) {
    return true;
  }
  return false;
}

// default banner call
export async function showBanner(navigation, props = {}) {
  const isPremium = !DEVELOPER_MODE && (await isPremiumMember());
  if (isPremium || isCalledToday()) return;
  Toast.show({
    type: "banner",
    text1: i18n.t("bannerText1"),
    text2: i18n.t("bannerText2"),
    autoHide: false,
    position: "top",
    topOffset: 10,
    onPress: () => {
      navigation.navigate("Paywall");
    },
    ...props,
  });
}

const ToastComponent = () => {
  return (
    <Toast
      topOffset={10}
      bottomOffset={40}
      config={toastConfig}
      position={"bottom"}
    />
  );
};

export default ToastComponent;

const styles = StyleSheet.create({
  budgetOverviewContainer: {
    flex: 1,
    borderColor: GlobalStyles.colors.primaryGrayed,
    borderWidth: 1,
    borderRadius: 36,
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
  },
  budgetOverviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  travellerItemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 40,
    overflow: "visible",
  },
  travellerItemProgressBarContainer: {
    padding: 2,
    overflow: "visible",
    zIndex: -1,
  },
  sumTextMoveRight: {
    left: 180,
    position: "absolute",
    zIndex: 999,
  },
  overviewTextInfo: {
    fontSize: 18,
    fontWeight: "200",
    color: GlobalStyles.colors.textColor,
    textAlign: "left",
    paddingVertical: 8,
  },
  overviewTextSmall: {
    fontSize: 16,
    fontWeight: "200",
    color: GlobalStyles.colors.textColor,
    textAlign: "left",
    paddingVertical: 4,
  },
  overViewTextTravellerSum: {
    fontSize: 14,
    fontWeight: "500",
    color: GlobalStyles.colors.gray300,
    textAlign: "left",
    paddingTop: 5,
  },
  overviewTextTitle: {
    fontSize: 18,
    fontWeight: "400",
    color: GlobalStyles.colors.textColor,
    textAlign: "left",
    paddingVertical: 8,
  },
  bannerContainerContainer: {
    // flex: 1,
    borderColor: "black",
    borderRadius: 999,
    alignItems: "center",
  },
  xCloseContainer: {
    marginTop: 18,
    marginLeft: 4,
  },
  xCloseButton: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "white",
    padding: 4,
    // paddingHorizontal: 8,
    backgroundColor: "white",
  },
  bannerContainer: {
    // flex: 1,
    maxWidth: "90%",
    borderColor: "black",
    borderRadius: 36,
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  bannerText1: {
    fontSize: 18,
    fontWeight: "400",
    color: GlobalStyles.colors.textColor,
    textAlign: "center",
  },
  bannerText2: {
    fontSize: 16,
    fontWeight: "300",
    color: GlobalStyles.colors.textColor,
    textAlign: "center",
  },
});
