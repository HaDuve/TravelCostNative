import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { ExpensesContext } from "../store/expenses-context";
import { UserContext } from "../store/user-context";
import { StyleSheet, View, RefreshControl, Pressable } from "react-native";
import { GlobalStyles } from "../constants/styles";
import { shadowRegressionStyles } from "../styles/shadow-regression-styles";
import TripPeriodChrome from "../components/layout/TripPeriodChrome";
import ContentFrame from "../components/layout/ContentFrame";
import { MemoizedExpensesOverview } from "../components/ExpensesOutput/ExpensesOverview";
import ToggleButton from "../assets/SVG/toggleButton";

import { i18n } from "../i18n/i18n";

import { DateTime } from "luxon";
import { _toShortFormat } from "../util/dateTime";
import PropTypes from "prop-types";
import { NetworkContext } from "../store/network-context";
import { useInterval } from "../components/Hooks/useInterval";
import { DEBUG_POLLING_INTERVAL } from "../confAppConstants";
import { ExpenseData } from "../util/expense";
import * as Haptics from "expo-haptics";
import { SettingsContext } from "../store/settings-context";
import { truncateString } from "../util/string";
import { TripContext } from "../store/trip-context";
import { useFocusEffect } from "@react-navigation/native";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { showBanner } from "../components/UI/ToastComponent";
import { constantScale, dynamicScale } from "../util/scalingUtil";
import { OrientationContext } from "../store/orientation-context";
import { useLayoutProfile } from "../store/layout-context";
import { OnboardingFlags } from "../types/onboarding";
import { refreshWithToast } from "../util/refreshWithToast";
import { getOfflineQueue } from "../util/offline-queue";
import { AuthContext } from "../store/auth-context";
import { trackEvent } from "../util/vexo-tracking";
import { VexoEvents } from "../util/vexo-constants";

const OverviewScreen = ({ navigation }) => {
  const expensesCtx = useContext(ExpensesContext);
  const tripCtx = useContext(TripContext);
  const userCtx = useContext(UserContext);
  const netCtx = useContext(NetworkContext);
  const { settings } = useContext(SettingsContext);
  const authCtx = useContext(AuthContext);
  const uid = authCtx.uid;
  const tripid = tripCtx.tripid;

  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const [dateTimeString, setDateTimeString] = useState("");
  // strong connection state

  async function toggleContent() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newState = !userCtx.isShowingGraph;
    userCtx.setIsShowingGraph(newState);
    trackEvent(VexoEvents.GRAPH_CHART_VIEW_TOGGLED, {
      showGraph: newState,
    });
  }
  const [offlineString, setOfflineString] = useState("");
  const PeriodValue = userCtx.periodName;

  // set in useEffect
  const showInternetSpeed = settings.showInternetSpeed;
  const lastConnectionSpeedInMbps = netCtx.lastConnectionSpeedInMbps ?? 0;
  const connectionSpeedString = showInternetSpeed
    ? " - " +
      lastConnectionSpeedInMbps?.toFixed(2) +
      ` ${i18n.t("megaBytePerSecond")}`
    : "";
  const isOnline = netCtx.isConnected && netCtx.strongConnection;

  useFocusEffect(
    React.useCallback(() => {
      const onboardingFlags: OnboardingFlags = {
        freshlyCreated: userCtx.freshlyCreated,
      };
      showBanner(navigation, onboardingFlags);
    }, [navigation, userCtx.freshlyCreated]),
  );

  useEffect(() => {
    if (isOnline) {
      setOfflineString(connectionSpeedString);
    } else {
      if (netCtx.isConnected && !netCtx.strongConnection) {
        setOfflineString(`` + connectionSpeedString);
      } else setOfflineString(` - ${i18n.t("offlineMode")}`);
    }
  }, [
    isOnline,
    netCtx.isConnected,
    netCtx.strongConnection,
    connectionSpeedString,
  ]);

  useInterval(
    React.useCallback(() => {
      setDateTimeString(_toShortFormat(DateTime.now()));
    }, []),
    DEBUG_POLLING_INTERVAL * 13,
    true,
  );

  const [items, setItems] = useState([
    { label: i18n.t("todayLabel"), value: "day" },
    { label: i18n.t("weekLabel"), value: "week" },
    { label: i18n.t("monthLabel"), value: "month" },
    { label: i18n.t("yearLabel"), value: "year" },
    { label: i18n.t("totalLabel"), value: "total" },
  ]);

  const onRefresh = useCallback(async () => {
    // Track refresh
    trackEvent(VexoEvents.EXPENSES_REFRESHED);

    // check if we have a offline queue
    const offlineQueue = await getOfflineQueue();
    // if we have a offline queue return
    if (offlineQueue && offlineQueue?.length > 0) {
      return;
    }

    try {
      await refreshWithToast({
        showRefIndicator: true,
        showAnyIndicator: true,
        setIsFetching,
        setRefreshing,
        expensesCtx,
        tripid,
        uid,
        tripCtx,
      });
    } catch (error) {
      // Error handling is done in refreshWithToast
    }
  }, [expensesCtx, tripid, uid, tripCtx, setIsFetching, setRefreshing]);

  const recentExpenses: Array<ExpenseData> = useMemo(
    () => expensesCtx.getRecentExpenses(PeriodValue),
    [PeriodValue, expensesCtx.expenses, dateTimeString],
  );
  // const expensesSum = recentExpenses.reduce((sum, expense) => {
  //   if (isNaN(Number(expense.calcAmount))) return sum;
  //   return sum + Number(expense.calcAmount);
  // }, 0);
  // const expensesSumString = formatExpenseWithCurrency(
  //   expensesSum,
  //   tripCtx.tripCurrency
  // );
  const { isTablet } = useContext(OrientationContext);
  const layout = useLayoutProfile();
  const compactFab = layout.breakpoint === "wide";

  return (
    <View style={[styles.container, isTablet && styles.tabletPaddingTop]}>
      <ContentFrame
        layout={layout}
        style={styles.contentFrame}
        testID="overview-content-frame"
      >
        <TripPeriodChrome
          tripLabel={`${truncateString(tripCtx.tripName, dynamicScale(23, false, 0.5))} - ${dateTimeString}${offlineString}`}
          periodValue={PeriodValue}
          periodItems={items}
          periodOpen={open}
          onPeriodOpenChange={(nextOpen) => {
            requestAnimationFrame(() => {
              setOpen(nextOpen);
              Toast.hide();
            });
          }}
          onPeriodValueChange={(callback) => {
            userCtx.setPeriodString(callback(PeriodValue));
          }}
          onPeriodItemsChange={setItems}
          periodModalProps={{
            animationType: "slide",
          }}
          onPeriodOpen={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          onPeriodClose={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          onPeriodSelectItem={(item) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            trackEvent(VexoEvents.PERIOD_SELECTOR_CHANGED, {
              period: item?.value,
            });
          }}
          expenses={recentExpenses}
          summaryStyle={styles.customSummaryStyle}
        />

        <View style={{ flex: 1 }}>
          <MemoizedExpensesOverview
            navigation={navigation}
            expenses={recentExpenses}
            periodName={PeriodValue}
            refreshControl={
              <RefreshControl
                refreshing={refreshing || isFetching}
                onRefresh={onRefresh}
                tintColor={GlobalStyles.colors.textColor}
                colors={[GlobalStyles.colors.textColor]}
                style={{
                  backgroundColor: "transparent",
                }}
              />
            }
          />
        </View>
      </ContentFrame>

      {/* FAB Toggle Button */}
      <Pressable
        testID="overview-graph-toggle"
        onPress={toggleContent}
        style={({ pressed }) => [
          styles.fabToggleButton,
          compactFab && styles.fabToggleButtonCompact,
          pressed && GlobalStyles.pressedWithShadow,
        ]}
      >
        <ToggleButton toggled={userCtx.isShowingGraph} compact={compactFab} />
      </Pressable>
    </View>
  );
};

export default OverviewScreen;

OverviewScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabletPaddingTop: {
    paddingTop: constantScale(12, 0.5),
  },
  contentFrame: {
    flex: 1,
    paddingHorizontal: 0,
  },
  customSummaryStyle: {
    marginTop: dynamicScale(2, true),
  },
  fabToggleButton: {
    ...shadowRegressionStyles.overviewFabToggleButton,
  },
  fabToggleButtonCompact: {
    marginLeft: constantScale(-39, 0.06),
    bottom: constantScale(16, 0.5),
  },
});
