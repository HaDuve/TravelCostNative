import Toast, {
  BaseToast,
  ErrorToast,
  ToastConfig,
} from "react-native-toast-message";
import React from "react";
import { StyleSheet, View, FlatList } from "react-native";
import { GlobalStyles } from "../../constants/styles";
import LoadingBarOverlay from "./LoadingBarOverlay";
import { Text, ViewStyle } from "react-native";

import { i18n } from "../../i18n/i18n";

import * as Progress from "react-native-progress";
import BackgroundGradient from "./BackgroundGradient";
import { TouchableOpacity } from "react-native-gesture-handler";
import { getMMKVString, setMMKVString } from "../../store/mmkv";
import { DEVELOPER_MODE } from "../../confAppConstants";
import { isPremiumMember } from "../Premium/PremiumConstants";
import { formatExpenseWithCurrency } from "../../util/string";
import { shouldShowOnboarding } from "../Rating/firstStartUtil";
import { Pressable } from "react-native";
import { constantScale, dynamicScale, scale } from "../../util/scalingUtil";
import { DeviceType, deviceType } from "expo-device";
import { OnboardingFlags } from "../../types/onboarding";

interface BudgetOverviewToastProps {
  travellerList: string[];
  travellerBudgets: number;
  travellerSplitExpenseSums: number[];
  currency: string;
  noTotalBudget: boolean;
  periodName: string;
  periodLabel: string;
  periodBudgetString: string;
  lastRateUnequal1: boolean;
  trafficLightActive: boolean;
  currentBudgetColor: string;
  averageDailySpending: number;
  dailyBudget: number;
  expenseSumNum: number;
  budgetNumber: number;
  text3?: string;
}

type TrafficLightStatus = "green" | "yellow" | "red" | null;

const MINHEIGHT = dynamicScale(60, true);
const MINHEIGHT_LOADINGBAR = dynamicScale(88, true);
const MAXHEIGHT = dynamicScale(100, true);
const MINWIDTH = dynamicScale(250);
const MAXWIDTH = dynamicScale(350);

const CONTENTCONTAINERSTYLE: ViewStyle = { paddingLeft: dynamicScale(10) };
const SIZESTYLES: ViewStyle = {
  minHeight: MINHEIGHT,
  maxHeight: MAXHEIGHT,
  minWidth: MINWIDTH,
  maxWidth: MAXWIDTH,
};

const toastConfig: ToastConfig = {
  success: (props) => (
    <BaseToast
      {...props}
      style={[
        {
          borderLeftColor: GlobalStyles.colors.primary500,
        },
        SIZESTYLES,
        GlobalStyles.wideStrongShadow,
      ]}
      contentContainerStyle={CONTENTCONTAINERSTYLE}
      text1Style={{
        fontSize: dynamicScale(17, false, 0.5),
        fontWeight: "500",
      }}
      text2Style={{
        fontSize: dynamicScale(15, false, 0.5),
        fontWeight: "400",
      }}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
      onPress={() => Toast.hide()}
    />
  ),
  error: (props) => (
    <ErrorToast
      {...props}
      style={[
        { borderLeftColor: GlobalStyles.colors.error500, minHeight: MINHEIGHT },
        GlobalStyles.wideStrongShadow,
        SIZESTYLES,
      ]}
      contentContainerStyle={CONTENTCONTAINERSTYLE}
      text1Style={{
        fontSize: dynamicScale(17, false, 0.5),
        fontWeight: "500",
      }}
      text2Style={{
        fontSize: dynamicScale(15, false, 0.5),
        fontWeight: "400",
      }}
      text1NumberOfLines={2}
      text2NumberOfLines={2}
      onPress={() => Toast.hide()}
    />
  ),
  loading: (props) => {
    const { progress } = props.props;
    const isTablet = deviceType === DeviceType.TABLET;
    const size = isTablet ? "large" : "small";
    const progressValid =
      progress && typeof progress == "number" && progress >= 0 && progress <= 1;
    const barWidth = dynamicScale(260, false, 0.4);
    const loadingColor = GlobalStyles.colors.cat8;
    const unfilledColor = GlobalStyles.colors.gray600;
    const loadingBarJSX = progressValid ? (
      <View style={GlobalStyles.strongShadow}>
        <Progress.Bar
          style={{
            marginTop: dynamicScale(-22, true),
            marginLeft: dynamicScale(14),
          }}
          progress={progress}
          color={loadingColor}
          unfilledColor={unfilledColor}
          borderWidth={0}
          borderRadius={dynamicScale(8, false, 0.5)}
          height={constantScale(14, 0.5)}
          width={barWidth}
        ></Progress.Bar>
      </View>
    ) : (
      <></>
    );
    return (
      <View style={[{ flex: 1 }, GlobalStyles.wideStrongShadow]}>
        <BaseToast
          {...props}
          style={[
            {
              borderLeftColor: GlobalStyles.colors.cat8,
              backgroundColor: GlobalStyles.colors.backgroundColor,
            },
            SIZESTYLES,
            GlobalStyles.wideStrongShadow,
            progressValid && {
              minHeight: MINHEIGHT_LOADINGBAR,
              paddingBottom: dynamicScale(16, true),
            },
          ]}
          contentContainerStyle={CONTENTCONTAINERSTYLE}
          text1Style={{
            fontSize: dynamicScale(17, false, 0.5),
            fontWeight: "500",
          }}
          text2Style={{
            fontSize: dynamicScale(15, false, 0.5),
            fontWeight: "400",
          }}
          text1NumberOfLines={2}
          text2NumberOfLines={2}
          renderTrailingIcon={() => (
            <View
              style={{
                flex: 1,
                marginRight: dynamicScale(30),
                marginTop: progressValid
                  ? dynamicScale(12, true)
                  : dynamicScale(18, true),
                maxHeight: MAXHEIGHT / 2,
                maxWidth: dynamicScale(20),
              }}
            >
              <LoadingBarOverlay
                containerStyle={{ maxHeight: MAXHEIGHT / 4 }}
                size={size}
              ></LoadingBarOverlay>
            </View>
          )}
          onPress={() => Toast.hide()}
        />
        {loadingBarJSX}
      </View>
    );
  },
  banner: (props) => (
    <Pressable
      onPress={() => {
        props.onPress();
      }}
      style={[styles.bannerContainerContainer, GlobalStyles.wideStrongShadow]}
    >
      <BackgroundGradient
        colors={GlobalStyles.gradientColors}
        style={[styles.bannerContainer]}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Pressable
            onPress={() => {
              props.onPress();
            }}
          >
            <View style={{ marginBottom: dynamicScale(8, true) }}>
              <Text style={styles.bannerText1}>{props.text1}</Text>
            </View>
            <Text style={styles.bannerText2}>{props.text2}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Toast.hide();
            }}
          >
            <View style={styles.xCloseContainer}>
              <View style={[styles.xCloseButton, GlobalStyles.strongShadow]}>
                <Text
                  style={{
                    color: GlobalStyles.colors.gray700,
                    fontSize: dynamicScale(16, false, 0.5),
                  }}
                >
                  X
                </Text>
              </View>
            </View>
          </Pressable>
        </View>
      </BackgroundGradient>
    </Pressable>
  ),
  budgetOverview: (props) => {
    const toastProps = props.props as BudgetOverviewToastProps;
    const {
      travellerList,
      travellerBudgets,
      travellerSplitExpenseSums,
      currency,
      noTotalBudget,
      periodName,
      trafficLightActive,
      currentBudgetColor,
      averageDailySpending,
      dailyBudget,
      expenseSumNum,
      budgetNumber,
    } = toastProps;

    const hasMultipleTravellers = travellerList && travellerList.length > 1;
    const travellerCount = travellerList?.length || 1;
    const isYellowStatus =
      trafficLightActive &&
      currentBudgetColor === GlobalStyles.colors.accent500;

    const getTrafficLightStatus = (): TrafficLightStatus => {
      if (
        !trafficLightActive ||
        noTotalBudget ||
        averageDailySpending <= 0 ||
        dailyBudget <= 0
      ) {
        return null;
      }

      if (expenseSumNum <= budgetNumber) {
        return "green";
      }

      if (averageDailySpending <= dailyBudget) {
        return "yellow";
      }

      return "red";
    };

    const trafficLightStatus = getTrafficLightStatus();

    return (
      <View
        style={[styles.budgetOverviewContainer, GlobalStyles.wideStrongShadow]}
      >
        <View style={styles.budgetOverviewHeader}>
          <Text style={styles.overviewTextTitle}>{i18n.t("overview")}</Text>
          <Pressable onPress={() => Toast.hide()}>
            <Text style={styles.overviewTextTitle}>X</Text>
          </Pressable>
        </View>

        {hasMultipleTravellers && (
          <FlatList
            data={travellerList}
            ListHeaderComponent={() => {
              return (
                <Text style={styles.overviewTextInfo}>
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
                  : isYellowStatus
                    ? GlobalStyles.colors.accent500
                    : GlobalStyles.colors.error300;
              const unfilledColor: string = noTotalBudget
                ? GlobalStyles.colors.primary500
                : budgetProgress <= 1
                  ? GlobalStyles.colors.gray600
                  : GlobalStyles.colors.gray600;
              const travellerName = item;
              return (
                <View style={styles.travellerItemContainer}>
                  <View
                    style={{
                      flexDirection: "row",
                      paddingHorizontal: dynamicScale(4),
                    }}
                  >
                    <Text style={styles.overviewTextSmall}>
                      {travellerName}
                    </Text>
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
                      width={scale(180)}
                      height={constantScale(20, 0.5)}
                      borderRadius={dynamicScale(8, false, 0.5)}
                    ></Progress.Bar>
                  </View>
                </View>
              );
            }}
          ></FlatList>
        )}
        {trafficLightStatus && (
          <Text style={styles.overviewTextInfo}>
            {trafficLightStatus === "green" &&
              `🟢 - ${i18n.t("averageDailySpending")}: ${formatExpenseWithCurrency(
                averageDailySpending / travellerCount,
                currency
              )}`}
            {trafficLightStatus === "yellow" &&
              `🟡 - ${i18n.t("overBudgetButAverage")}: ${formatExpenseWithCurrency(
                averageDailySpending / travellerCount,
                currency
              )}\n${i18n.t("underDailyBudget")}: ${formatExpenseWithCurrency(
                dailyBudget / travellerCount,
                currency
              )}`}
            {trafficLightStatus === "red" &&
              `🔴 - ${i18n.t("trafficLightOverBudgetAndAverage")}\n${i18n.t("averageDailySpending")}: ${formatExpenseWithCurrency(
                averageDailySpending / travellerCount,
                currency
              )}\n${i18n.t("dailyBudget")}: ${formatExpenseWithCurrency(
                dailyBudget / travellerCount,
                currency
              )}`}
          </Text>
        )}
      </View>
    );
  },
};

function isCalledToday() {
  const bannerTime = getMMKVString("BannerTime");
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

interface NavigationProp {
  navigate: (screen: string) => void;
}

export async function showBanner(
  navigation: NavigationProp,
  onboardingFlags?: OnboardingFlags,
  props: Record<string, unknown> = {}
) {
  const isPremium = !DEVELOPER_MODE && (await isPremiumMember());
  if (isPremium || isCalledToday()) return;

  if (onboardingFlags) {
    const shouldShowOnboardingFlow = await shouldShowOnboarding();
    const { freshlyCreated, needsTour } = onboardingFlags;

    if (shouldShowOnboardingFlow || freshlyCreated || needsTour) {
      return;
    }
  }

  Toast.show({
    type: "banner",
    text1: i18n.t("bannerText1"),
    text2: i18n.t("bannerText2"),
    autoHide: false,
    position: "top",
    topOffset: dynamicScale(10, true),
    onPress: () => {
      navigation.navigate("Paywall");
    },
    ...props,
  });
}

const ToastComponent = () => {
  return (
    <Toast
      topOffset={dynamicScale(10, true)}
      bottomOffset={dynamicScale(40, true)}
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
    paddingHorizontal: dynamicScale(30),
    paddingVertical: dynamicScale(12),
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
    minHeight: dynamicScale(40, true),
    overflow: "visible",
  },
  travellerItemProgressBarContainer: {
    padding: dynamicScale(2),
    overflow: "visible",
    zIndex: -1,
  },
  sumTextMoveRight: {
    left: dynamicScale(110),
    position: "absolute",
    zIndex: 999,
  },
  overviewTextInfo: {
    fontSize: dynamicScale(12, false, 0.5),
    fontWeight: "300",
    color: GlobalStyles.colors.textColor,
    textAlign: "left",
    paddingVertical: dynamicScale(8, true),
  },
  overviewTextSmall: {
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "200",
    color: GlobalStyles.colors.textColor,
    textAlign: "left",
    paddingVertical: dynamicScale(4, true),
  },
  overViewTextTravellerSum: {
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "500",
    color: GlobalStyles.colors.gray300,
    textAlign: "left",
    paddingTop: dynamicScale(5, true),
  },
  overviewTextTitle: {
    fontSize: dynamicScale(20, false, 0.5),
    fontWeight: "500",
    color: GlobalStyles.colors.textColor,
    textAlign: "left",
    paddingVertical: dynamicScale(8, true),
  },
  bannerContainerContainer: {
    borderColor: "black",
    borderRadius: 999,
    alignItems: "center",
  },
  xCloseContainer: {
    marginTop: dynamicScale(18, true),
    marginLeft: dynamicScale(4),
  },
  xCloseButton: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "white",
    padding: dynamicScale(4),
    backgroundColor: "white",
  },
  bannerContainer: {
    maxWidth: "90%",
    borderColor: "black",
    borderRadius: 36,
    paddingHorizontal: dynamicScale(30),
    paddingVertical: dynamicScale(12, true),
  },
  bannerText1: {
    fontSize: dynamicScale(18, false, 0.5),
    fontWeight: "400",
    color: GlobalStyles.colors.textColor,
    textAlign: "center",
  },
  bannerText2: {
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "300",
    color: GlobalStyles.colors.textColor,
    textAlign: "center",
  },
});
