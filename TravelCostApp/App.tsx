import React from "react";
import { useContext, useEffect, useState, useLayoutEffect } from "react";
import { View, Keyboard, Platform, AppState } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Purchases from "react-native-purchases";

import { StatusBar } from "expo-status-bar";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import * as SplashScreen from "expo-splash-screen";
import { shouldShowOnboarding } from "./components/Rating/firstStartUtil";

import { NetworkProvider } from "react-native-offline";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import SignupScreen from "./screens/SignupScreen";
import LoginScreen from "./screens/LoginScreen";

import ManageExpense from "./screens/ManageExpense";
import { GlobalStyles } from "./constants/styles";
import AuthContextProvider, { AuthContext } from "./store/auth-context";
import ExpensesContextProvider, {
  ExpensesContext,
} from "./store/expenses-context";
import ProfileScreen from "./screens/ProfileScreen";
import UserContextProvider, { UserContext } from "./store/user-context";
import {
  fetchUser,
  touchMyTraveler,
  dataResponseTime,
  updateUser,
} from "./util/http";
import TripContextProvider, {
  TripContext,
  TripData,
} from "./store/trip-context";
import TripForm from "./components/ManageTrip/TripForm";
import OnboardingScreen from "./screens/OnboardingScreen";
import JoinTrip from "./screens/JoinTrip";
import ShareTripButton from "./components/ProfileOutput/ShareTrip";
import OverviewScreen from "./screens/OverviewScreen";
import CategoryPickScreen from "./screens/CategoryPickScreen";
import SplitSummaryScreen from "./screens/SplitSummaryScreen";
import SettingsScreen from "./screens/SettingsScreen";
import {
  asyncStoreGetObject,
  asyncStoreSafeClear,
} from "./store/async-storage";
import LoadingOverlay from "./components/UI/LoadingOverlay";
import FilteredExpenses from "./screens/FilteredExpenses";
import { sendOfflineQueue } from "./util/offline-queue";

import { i18n } from "./i18n/i18n";

import ManageCategoryScreen from "./screens/ManageCategoryScreen";
import ToastComponent from "./components/UI/ToastComponent";
import {
  DEBUG_RESET_STORAGE,
  DEBUG_POLLING_INTERVAL,
} from "./confAppConstants";
import SplashScreenOverlay from "./components/UI/SplashScreenOverlay";
import Toast from "react-native-toast-message";
import { useInterval } from "./components/Hooks/useInterval";
import { isForeground } from "./util/appState";
import { TourGuideProvider, TooltipProps } from "rn-tourguide";
import { loadTourConfig } from "./util/tourUtil";
import { loadKeys, Keys } from "./components/Premium/PremiumConstants";
import PaywallScreen from "./components/Premium/PayWall";
import { SettingsProvider } from "./store/settings-context";
import { UserData } from "./store/user-context";
import FilteredPieCharts from "./screens/FilteredPieCharts";
import {
  handleFirstStart,
  shouldPromptForRating,
} from "./components/Rating/firstStartUtil";
import RatingModal from "./screens/RatingModal";
import NetworkContextProvider from "./store/network-context";
import { secureStoreGetItem } from "./store/secure-storage";
import { isConnectionFastEnough } from "./util/connectionSpeed";
import FinderScreen from "./screens/FinderScreen";
import CustomerScreen from "./screens/CustomerScreen";
import GPTDealScreen from "./screens/ChatGPTDealScreen";
import { MemoizedRecentExpenses } from "./screens/RecentExpenses";
import TripSummaryScreen from "./screens/TripSummaryScreen";
import { versionCheck } from "./util/version";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ChangelogScreen from "./screens/ChangelogScreen";
import { Badge } from "react-native-paper";
import { ExpenseData } from "./util/expense";

import safeLogError from "./util/error";
import { constantScale, dynamicScale } from "./util/scalingUtil";
import { CustomTooltip } from "./components/UI/Tourguide_Tooltip";
import OrientationContextProvider from "./store/orientation-context";
import {
  initializeVexo,
  identifyUser,
  VexoUserContext,
} from "./util/vexo-tracking";
import { VexoEvents } from "./util/vexo-constants";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const BottomTabs = createMaterialTopTabNavigator();

const IconSize = constantScale(24, 0.1);

const prefix = Linking.createURL("/");

// Paints the bottom safe-area only (to match the tab bar background)
function BottomInset({ color }: { color: string }) {
  const insets = useSafeAreaInsets();
  if (!insets.bottom) return null;
  return <View style={{ height: insets.bottom, backgroundColor: color }} />;
}

// SafeAreaWrapper component that handles safe area insets properly
function SafeAreaWrapper({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        // Do not set paddingBottom here so we can paint it with a custom color
        paddingLeft: insets.left,
        paddingRight: insets.right,
        backgroundColor: GlobalStyles.colors.backgroundColor,
      }}
    >
      {children}
      {/* Color only the bottom inset to match the BottomTabBar */}
      <BottomInset color={GlobalStyles.colors.gray500} />
    </View>
  );
}
function NotAuthenticatedStack() {
  const [needOnboarding, setNeedOnboarding] = useState(false);
  const navigation = useNavigation();
  useEffect(() => {
    async function checkOnboarding() {
      const need = await shouldShowOnboarding();
      if (!need) return;
      setNeedOnboarding(need);
      navigation.navigate("Onboarding");
    }
    checkOnboarding();
  }, []);
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        headerTintColor: GlobalStyles.colors.textColor,
        contentStyle: { backgroundColor: GlobalStyles.colors.backgroundColor },
      }}
    >
      {needOnboarding && (
        <AuthStack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
      )}
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ headerShown: false }}
      />
    </AuthStack.Navigator>
  );
}

function AuthenticatedStack() {
  const navigation = useNavigation();
  return (
    <ExpensesContextProvider>
      <>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: GlobalStyles.colors.primary500 },
            headerTintColor: GlobalStyles.colors.backgroundColor,
          }}
        >
          <Stack.Screen
            name="Home"
            component={Home}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ManageExpense"
            component={ManageExpense}
            options={{
              headerShown: false,
              presentation: "modal",
              headerBackButtonMenuEnabled: false,
            }}
          />
          <Stack.Screen
            name="CategoryPick"
            component={CategoryPickScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="ManageCategory"
            component={ManageCategoryScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="ManageTrip"
            component={TripForm}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="Join"
            component={JoinTrip}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="Paywall"
            component={PaywallScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="Share"
            component={ShareTripButton}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="SplitSummary"
            component={SplitSummaryScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="TripSummary"
            component={TripSummaryScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="FilteredExpenses"
            component={FilteredExpenses}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="FilteredPieCharts"
            component={FilteredPieCharts}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="Finder"
            component={FinderScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="Customer"
            component={CustomerScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="GPTDeal"
            component={GPTDealScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />

          <Stack.Screen
            name="Changelog"
            component={ChangelogScreen}
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
        </Stack.Navigator>
      </>
    </ExpensesContextProvider>
  );
}

function Navigation() {
  const authCtx = useContext(AuthContext);
  const linking = {
    // If you are using universal links, you need to add your domain to the prefixes as well:
    // prefixes: [Linking.createURL('/'), 'https://app.example.com'],
    prefixes: [prefix],
    config: {
      screens: {
        Join: {
          path: "join/:id",
          parse: {
            id: (id: string) => {
              return `${id}`;
            },
          },
        },
        Home: {
          screens: {
            RecentExpenses: "recent",
          },
        },
      },
    },
  };

  return (
    <NavigationContainer
      linking={linking}
      fallback={
        <View
          style={{
            flex: 1,
            backgroundColor: GlobalStyles.colors.backgroundColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LoadingOverlay></LoadingOverlay>
        </View>
      }
    >
      {!authCtx.isAuthenticated && <NotAuthenticatedStack />}
      {authCtx.isAuthenticated && <AuthenticatedStack />}
    </NavigationContainer>
  );
}

function Home() {
  const { isShowingGraph, freshlyCreated, hasNewChanges } =
    useContext(UserContext);

  const FirstScreen = freshlyCreated ? "Profile" : "RecentExpenses";
  const expCtx = useContext(ExpensesContext);
  const expenses = expCtx.expenses;
  const hasExp = expenses?.length > 0;
  const hasExpensesWithSplit = expenses?.some(
    (exp: ExpenseData) => exp.splitList?.length > 0
  );
  const validSplitSummary = hasExp && hasExpensesWithSplit;
  return (
    <BottomTabs.Navigator
      initialRouteName={FirstScreen}
      backBehavior={"history"}
      tabBarPosition={"bottom"}
      screenOptions={() => ({
        headerStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        headerTintColor: GlobalStyles.colors.backgroundColor,
        tabBarStyle: {
          backgroundColor: GlobalStyles.colors.gray500,
          borderTopWidth: dynamicScale(1, false, 0.5),
          borderTopColor: GlobalStyles.colors.gray600,
        },
        tabBarActiveTintColor: GlobalStyles.colors.primary500,
        tabBarIndicatorStyle: {
          backgroundColor: GlobalStyles.colors.primary500,
          borderWidth: dynamicScale(1, true, 0.5),
          borderColor: GlobalStyles.colors.primary500,
        },
        tabBarBounces: true,
      })}
    >
      <BottomTabs.Screen
        name="RecentExpenses"
        component={MemoizedRecentExpenses}
        options={{
          tabBarShowLabel: false,
          tabBarLabel: i18n.t("expensesTab"),
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={IconSize} color={color} />
          ),
        }}
      />
      {/* DEBUG for push notifications */}
      {/* <BottomTabs.Screen
        name="Push"
        component={PushScreen}
        options={{
          // headerShown: false,
          tabBarShowLabel: false,
          title: i18n.t("overviewTab"),
          tabBarLabel: "Push",
          tabBarIcon: ({ color }) => (
            <Ionicons name={"push"} size={IconSize} color={color} />
          ),
        }}
      ></BottomTabs.Screen> */}

      <BottomTabs.Screen
        name="Overview"
        component={OverviewScreen}
        options={{
          tabBarShowLabel: false,
          title: i18n.t("overviewTab"),
          tabBarLabel: i18n.t("overviewTab"),
          tabBarIcon: ({ color }) => (
            <Ionicons
              name={isShowingGraph ? "bar-chart-outline" : "pie-chart-outline"}
              size={IconSize}
              color={color}
            />
          ),
        }}
      />
      {hasExp && (
        <BottomTabs.Screen
          name="Finder"
          component={FinderScreen}
          options={{
            title: i18n.t("settingsTab"),
            tabBarShowLabel: false,

            tabBarLabel: i18n.t("finderTab"),
            tabBarIcon: ({ color }) => (
              <Ionicons name="search-outline" size={IconSize} color={color} />
            ),
          }}
        />
      )}
      {validSplitSummary && (
        <BottomTabs.Screen
          name="Financial"
          component={SplitSummaryScreen}
          options={{
            title: i18n.t("settingsTab"),
            tabBarShowLabel: false,

            tabBarLabel: i18n.t("financialTab"),
            tabBarIcon: ({ color }) => (
              <Ionicons name="cash-outline" size={IconSize} color={color} />
            ),
          }}
        />
      )}
      <BottomTabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: i18n.t("profileTab"),
          tabBarShowLabel: false,

          tabBarLabel: i18n.t("myTrips"),
          tabBarIcon: ({ color }) => (
            <View>
              {hasNewChanges && (
                <Badge
                  style={{ position: "absolute" }}
                  size={dynamicScale(6, false, 0.5)}
                />
              )}
              <Ionicons name="globe-outline" size={IconSize} color={color} />
            </View>
          ),
        }}
      />
    </BottomTabs.Navigator>
  );
}

function Root() {
  // NOTE: batchedBridge debugging global (keep this code in case batchedBridge bugs)
  // if (global.__fbBatchedBridge) {
  //   const origMessageQueue = global.__fbBatchedBridge;
  //   const modules = origMessageQueue._remoteModuleTable;
  //   const methods = origMessageQueue._remoteMethodTable;
  //   global.findModuleByModuleAndMethodIds = (moduleId, methodId) => {
  //   };
  // }

  const [appIsReady, setAppIsReady] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [onlineSetupDone, setOnlineSetupDone] = useState(false);

  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const expensesCtx = useContext(ExpensesContext);

  // check regularly
  useInterval(
    () => {
      if (isForeground() && authCtx.isAuthenticated) {
        const asyncQueue = async () => {
          await sendOfflineQueue(
            userCtx.isSendingOfflineQueueMutex,
            userCtx.setIsSendingOfflineQueueMutex,
            { updateExpenseId: expensesCtx.updateExpenseId }
          );
        };
        asyncQueue();

        const delayedOnlineSetup = async () => {
          if (userCtx.freshlyCreated) return;
          if (!onlineSetupDone) {
            const { isFastEnough } = await isConnectionFastEnough();
            if (isFastEnough) {
              //prepare online setup
              const storedUid = await secureStoreGetItem("uid");
              if (!storedUid) return;
              const checkUser = await fetchUser(storedUid);
              if (!checkUser) return;
              const tripid = checkUser.currentTrip;
              const locale = checkUser.locale;
              if (!locale) {
                checkUser.locale = i18n.locale;
                await updateUser(storedUid, checkUser);
              }
              const tripData: TripData =
                await tripCtx.fetchAndSetCurrentTrip(tripid);
              if (!tripData) return;
              try {
                setOnlineSetupDone(true);
                await onlineSetup(tripData, checkUser, tripid, storedUid);
              } catch (error) {
                setOnlineSetupDone(false);
              }
            }
          }
        };

        delayedOnlineSetup();
      }
    },
    DEBUG_POLLING_INTERVAL * 1.7,
    false
  );

  const showModalIfNeeded = async () => {
    if (await shouldPromptForRating()) {
      setIsReviewModalVisible(true);
    }
  };

  async function onlineSetup(
    tripData: TripData,
    checkUser: UserData,
    storedTripId: string,
    storedUid: string
  ) {
    const userData: UserData = checkUser;
    const tripid = userData.currentTrip;
    if (!tripid || tripid?.length < 2) {
      return;
    }
    // save user Name in Ctx and async
    await loadKeys();
    try {
      await userCtx.addUserName(userData);
      await tripCtx.setCurrentTrip(tripid, tripData);
      await userCtx.loadCatListFromAsyncInCtx(tripid);
      await touchMyTraveler(storedTripId, storedUid);
    } catch (error) {
      await tripCtx.loadTripDataFromStorage();
    }
  }

  async function setupOfflineMount(
    isOfflineMode: boolean,
    storedToken: string
  ) {
    if (!isOfflineMode) {
      return null;
    }
    try {
      await userCtx.loadUserNameFromStorage();
      await tripCtx.loadTripDataFromStorage();
      await tripCtx.loadTravellersFromStorage();
      await userCtx.loadCatListFromAsyncInCtx("async");
      await authCtx.authenticate(storedToken);
    } catch (error) {
    }
  }

  useEffect(() => {
    async function onRootMount() {
      await handleFirstStart();
      if (DEBUG_RESET_STORAGE) await asyncStoreSafeClear();
      // offline check and set context
      const { isFastEnough } = await isConnectionFastEnough();
      const online = isFastEnough;
      if (isFastEnough) await versionCheck();
      // fetch token and trip
      const storedToken = await secureStoreGetItem("token");
      const storedUid = await secureStoreGetItem("uid");
      const storedTripId = await secureStoreGetItem("currentTripId");
      const freshlyCreated = await asyncStoreGetObject("freshlyCreated");

      let REVCAT_G, REVCAT_A, VEXO;
      try {
        // Add timeout to prevent hanging
        const keysPromise = loadKeys();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("loadKeys timeout after 5 seconds")),
            5000
          )
        );

        const keys = (await Promise.race([
          keysPromise,
          timeoutPromise,
        ])) as Keys;
        REVCAT_G = keys.REVCAT_G;
        REVCAT_A = keys.REVCAT_A;
        VEXO = keys.VEXO;
      } catch (error) {
        // Set default values or handle the error
        REVCAT_G = "";
        REVCAT_A = "";
        VEXO = "";
      }

      if (storedToken && storedUid && storedTripId) {
        // setup purchases
        if (Platform.OS === "android") {
          // Purchases
          Purchases.configure({
            apiKey: REVCAT_G,
            appUserID: storedUid,
          });
        } else if (Platform.OS === "ios" || Platform.OS === "macos") {
          // Purchases
          Purchases.configure({
            apiKey: REVCAT_A,
            appUserID: storedUid,
          });
        }
        Purchases.setLogLevel(Purchases.LOG_LEVEL.ERROR);
        await Purchases.collectDeviceIdentifiers();

        // Initialize Vexo for error and session tracking
        try {
          const vexoInitialized = await initializeVexo(VEXO);
          if (vexoInitialized) {
            await identifyUser(storedUid);
          }
        } catch (vexoError) {
          safeLogError(vexoError, "App.tsx", 692);
        }

        const needsTour = await loadTourConfig();
        userCtx.setNeedsTour(needsTour);

        // check if user is online
        if (!online) {
          await setupOfflineMount(true, storedToken);
          setAppIsReady(true);
          return;
        }

        // set tripId in context
        let tripData;
        if (storedTripId) {
          tripData = await tripCtx.fetchAndSetCurrentTrip(storedTripId);
          await tripCtx.fetchAndSetTravellers(storedTripId);
          tripCtx.setTripid(storedTripId);
        } else {
          Toast.show({
            type: "error",
            text1: i18n.t("toastLoginError1"),
            text2: i18n.t("toastLoginError2"),
            visibilityTime: 5000,
          });
          await asyncStoreSafeClear();
          authCtx.logout(tripCtx.tripid);
          setAppIsReady(true);
          return;
        }

        if (freshlyCreated) {
          await userCtx.setFreshlyCreatedTo(freshlyCreated);
        }
        // check if user was deleted
        const checkUser = await fetchUser(storedUid);
        if (!checkUser.userName) {
          Toast.show({
            type: "error",
            text1: i18n.t("toastAccountError1"),
            text2: i18n.t("toastAccountError1"),
            visibilityTime: 5000,
          });
          await asyncStoreSafeClear();
          setAppIsReady(true);
          return;
        }
        if (checkUser.userName && !checkUser.currentTrip) {
          await userCtx.setFreshlyCreatedTo(true);
        }
        // setup context
        await authCtx.setUserID(storedUid);
        await onlineSetup(tripData, checkUser, storedTripId, storedUid);
        await authCtx.authenticate(storedToken);
        setAppIsReady(true);
      } else {
        tripCtx.setIsLoading(false);
        await asyncStoreSafeClear();
        authCtx.logout();
        setAppIsReady(true);
      }
      setAppIsReady(true);
    }
    const test_onRootMount = dataResponseTime(onRootMount);

    try {
      test_onRootMount();
    } catch (error) {
      safeLogError(error);
      setAppIsReady(true);
    }

    // Safety timeout - ensure app is ready after 10 seconds regardless
    setTimeout(() => {
      if (!appIsReady) {
        setAppIsReady(true);
      }
    }, 10000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // only ask for review if the app goes from background to active
    const handler = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        showModalIfNeeded();
      }
    });
    return () => {
      handler.remove();
    };
  }, []);

  // Track appIsReady state changes
  useEffect(() => {
  }, [appIsReady]);

  useLayoutEffect(() => {
    async function hideSplashScreen() {
      await SplashScreen.hideAsync();
    }
    hideSplashScreen();
  }, [appIsReady]);

  if (!appIsReady) {
    return <SplashScreenOverlay></SplashScreenOverlay>;
  }

  return (
    <>
      <RatingModal
        setIsModalVisible={setIsReviewModalVisible}
        isModalVisible={isReviewModalVisible}
      />
      <Navigation />
    </>
  );
}

function handleUnhandledTouches() {
  Keyboard.dismiss();
  Toast.hide();
  return false;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <View
        style={{
          flex: 1,
        }}
        onStartShouldSetResponder={handleUnhandledTouches}
      >
        <SafeAreaWrapper>
          <StatusBar style="auto" />
          <AuthContextProvider>
            <NetworkContextProvider>
              <TripContextProvider>
                <UserContextProvider>
                  <SettingsProvider>
                    <NetworkProvider>
                      <ExpensesContextProvider>
                        <OrientationContextProvider>
                          <GestureHandlerRootView style={{ flex: 1 }}>
                            <TourGuideProvider
                              key="settings"
                              borderRadius={16}
                              labels={{
                                previous: i18n.t("tourGuideLabelPrevious"),
                                next: i18n.t("tourGuideLabelNext"),
                                skip: i18n.t("tourGuideLabelSkip"),
                                finish: i18n.t("tourGuideLabelFinish"),
                              }}
                              tooltipComponent={({
                                isFirstStep,
                                isLastStep,
                                handleNext,
                                handlePrev,
                                handleStop,
                                currentStep,
                                labels,
                              }: TooltipProps) =>
                                CustomTooltip({
                                  isFirstStep,
                                  isLastStep,
                                  handleNext,
                                  handlePrev,
                                  handleStop,
                                  currentStep,
                                  labels,
                                })
                              }
                            >
                              <Root />

                              <ToastComponent />
                            </TourGuideProvider>
                          </GestureHandlerRootView>
                        </OrientationContextProvider>
                      </ExpensesContextProvider>
                    </NetworkProvider>
                  </SettingsProvider>
                </UserContextProvider>
              </TripContextProvider>
            </NetworkContextProvider>
          </AuthContextProvider>
        </SafeAreaWrapper>
      </View>
    </SafeAreaProvider>
  );
}
