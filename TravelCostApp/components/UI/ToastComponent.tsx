import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import * as Progress from "react-native-progress";
import Toast, {
  BaseToast,
  ErrorToast,
  ToastConfig,
} from "react-native-toast-message";

import { DEVELOPER_MODE } from "../../confAppConstants";
import { GlobalStyles } from "../../constants/styles";
import { de, en, fr, ru } from "../../i18n/supportedLanguages";

import LoadingBarOverlay from "./LoadingBarOverlay";

//Localization

const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;
// i18n.locale = "en";

import BackgroundGradient from "./BackgroundGradient";

import { getMMKVString, setMMKVString } from "../../store/mmkv";
import { constantScale, dynamicScale, scale } from "../../util/scalingUtil";
import { formatExpenseWithCurrency } from "../../util/string";
import { isPremiumMember } from "../Premium/PremiumConstants";
import { shouldShowOnboarding } from "../Rating/firstStartUtil";

import { DeviceType, deviceType } from "expo-device";

import { OnboardingFlags } from "../../types/onboarding";

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
  success: props => (
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
  /*
      Overwrite 'error' type,
      by modifying the existing `ErrorToast` component
    */
  error: props => (
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
  /*
      Or create a completely new type - `tomatoToast`,
      building the layout from scratch.

      I can consume any custom `props` I want.
      They will be passed when calling the `show` method (see below)
    */
  loading: props => {
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
      // props.progress - is a number from 0 to 1 or -1 (indeterminate)
      <View style={[{ flex: 1 }, GlobalStyles.strongShadow]}>
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
              {/* Below is just the spinner, the loading BAR is in loadingBarJSX */}
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
  banner: props => (
    <TouchableOpacity
      onPress={() => {
        // console.log("Pressed Touchable in Config");
        props.onPress();
      }}
      style={[styles.bannerContainerContainer, GlobalStyles.wideStrongShadow]}
    >
      <BackgroundGradient style={styles.bannerContainer} colors={[]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <TouchableOpacity
            onPress={() => {
              // console.log("Pressed Touchable in Config");
              props.onPress();
            }}
          >
            <View style={{ marginBottom: dynamicScale(8, true) }}>
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
          </TouchableOpacity>
        </View>
      </BackgroundGradient>
    </TouchableOpacity>
  ),
  budgetOverview: props => {
    const travellerList = props.props.travellerList;
    const travellerBudgets = props.props.travellerBudgets;
    const travellerSplitExpenseSums = props.props.travellerSplitExpenseSums;
    const currency = props.props.currency;
    const noTotalBudget = props.props.noTotalBudget;
    const periodName = props.props.periodName;

    const hasMultipleTravellers = travellerList && travellerList.length > 1;

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
                  : GlobalStyles.colors.error300;
              const unfilledColor: string = noTotalBudget
                ? GlobalStyles.colors.primary500
                : budgetProgress <= 1
                  ? GlobalStyles.colors.gray600
                  : GlobalStyles.colors.errorGrayed;
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
export async function showBanner(
  navigation: any,
  onboardingFlags?: OnboardingFlags,
  props: any = {}
) {
  const isPremium = !DEVELOPER_MODE && (await isPremiumMember());
  if (isPremium || isCalledToday()) return;

  // Check if user is in onboarding state
  if (onboardingFlags) {
    const shouldShowOnboardingFlow = await shouldShowOnboarding();
    const { freshlyCreated, needsTour } = onboardingFlags;

    // Suppress banner if user is in any onboarding state
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
  bannerContainer: {
    // flex: 1,
    maxWidth: "90%",
    borderColor: "black",
    borderRadius: 36,
    paddingHorizontal: dynamicScale(30),
    paddingVertical: dynamicScale(12, true),
  },
  bannerContainerContainer: {
    // flex: 1,
    borderColor: "black",
    borderRadius: 999,
    alignItems: "center",
  },
  bannerText1: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(18, false, 0.5),
    fontWeight: "400",
    textAlign: "center",
  },
  bannerText2: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "300",
    textAlign: "center",
  },
  budgetOverviewContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColorLight,
    borderColor: GlobalStyles.colors.primaryGrayed,
    borderRadius: 36,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: dynamicScale(30),
    paddingVertical: dynamicScale(12),
  },
  budgetOverviewHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  overViewTextTravellerSum: {
    color: GlobalStyles.colors.gray300,
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "500",
    paddingTop: dynamicScale(5, true),
    textAlign: "left",
  },
  overviewTextInfo: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(18, false, 0.5),
    fontWeight: "300",
    paddingVertical: dynamicScale(8, true),
    textAlign: "left",
  },
  overviewTextSmall: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(16, false, 0.5),
    fontWeight: "200",
    paddingVertical: dynamicScale(4, true),
    textAlign: "left",
  },
  overviewTextTitle: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(20, false, 0.5),
    fontWeight: "500",
    paddingVertical: dynamicScale(8, true),
    textAlign: "left",
  },
  sumTextMoveRight: {
    left: dynamicScale(110),
    position: "absolute",
    zIndex: 999,
  },
  travellerItemContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: dynamicScale(40, true),
    overflow: "visible",
  },
  travellerItemProgressBarContainer: {
    overflow: "visible",
    padding: dynamicScale(2),
    zIndex: -1,
  },
  xCloseButton: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "white",
    padding: dynamicScale(4),
    // paddingHorizontal: 8,
    backgroundColor: "white",
  },
  xCloseContainer: {
    marginLeft: dynamicScale(4),
    marginTop: dynamicScale(18, true),
  },
});
