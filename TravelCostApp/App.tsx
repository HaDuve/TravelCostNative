import { Ionicons } from "@expo/vector-icons";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import * as Localization from "expo-localization";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { I18n } from "i18n-js";
import { useContext, useEffect, useLayoutEffect, useState } from "react";
import {
  AppState,
  Keyboard,
  Platform,
  SafeAreaView,
  StatusBar as StatusBarRN,
  View,
} from "react-native";
import { NetworkProvider } from "react-native-offline";
import Purchases from "react-native-purchases";

import TripForm from "./components/ManageTrip/TripForm";
import { shouldShowOnboarding } from "./components/Rating/firstStartUtil";
import { RootNavigationProp } from "./types/navigation";

import ShareTripButton from "./components/ProfileOutput/ShareTrip";
import LoadingOverlay from "./components/UI/LoadingOverlay";
import { GlobalStyles } from "./constants/styles";
import CategoryPickScreen from "./screens/CategoryPickScreen";
import FilteredExpenses from "./screens/FilteredExpenses";
import JoinTrip from "./screens/JoinTrip";
import LoginScreen from "./screens/LoginScreen";
import ManageExpense from "./screens/ManageExpense";
import OnboardingScreen from "./screens/OnboardingScreen";
import OverviewScreen from "./screens/OverviewScreen";
import ProfileScreen from "./screens/ProfileScreen";
import SettingsScreen from "./screens/SettingsScreen";
import SignupScreen from "./screens/SignupScreen";
import SplitSummaryScreen from "./screens/SplitSummaryScreen";
import {
  asyncStoreGetObject,
  asyncStoreSafeClear,
} from "./store/async-storage";
import AuthContextProvider, { AuthContext } from "./store/auth-context";
import ExpensesContextProvider, {
  ExpensesContext,
} from "./store/expenses-context";
import TripContextProvider, {
  TripContext,
  TripData,
} from "./store/trip-context";
import UserContextProvider, {
  UserContext,
  UserData,
} from "./store/user-context";
import {
  dataResponseTime,
  fetchUser,
  touchMyTraveler,
  updateUser,
} from "./util/http";
import { sendOfflineQueue } from "./util/offline-queue";

//localization

import { de, en, fr, ru } from "./i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
// i18n.locale = "en";
i18n.enableFallback = true;

import SplashScreenOverlay from "./components/UI/SplashScreenOverlay";
import ToastComponent from "./components/UI/ToastComponent";
import {
  DEBUG_POLLING_INTERVAL,
  DEBUG_RESET_STORAGE,
} from "./confAppConstants";
import ManageCategoryScreen from "./screens/ManageCategoryScreen";

import Toast from "react-native-toast-message";

import { useInterval } from "./components/Hooks/useInterval";
import { isForeground } from "./util/appState";

import { TooltipProps, TourGuideProvider } from "rn-tourguide";

import PaywallScreen from "./components/Premium/PayWall";
import { Keys, loadKeys } from "./components/Premium/PremiumConstants";
import {
  handleFirstStart,
  shouldPromptForRating,
} from "./components/Rating/firstStartUtil";
import GPTDealScreen from "./screens/ChatGPTDealScreen";
import CustomerScreen from "./screens/CustomerScreen";
import FilteredPieCharts from "./screens/FilteredPieCharts";
import FinderScreen from "./screens/FinderScreen";
import RatingModal from "./screens/RatingModal";
import { MemoizedRecentExpenses } from "./screens/RecentExpenses";
import TripSummaryScreen from "./screens/TripSummaryScreen";
import NetworkContextProvider from "./store/network-context";
import { secureStoreGetItem } from "./store/secure-storage";
import { SettingsProvider } from "./store/settings-context";
import { isConnectionFastEnough } from "./util/connectionSpeed";
import { constantScale, dynamicScale } from "./util/scalingUtil";
import { loadTourConfig } from "./util/tourUtil";
import { versionCheck } from "./util/version";

import { GestureHandlerRootView } from "react-native-gesture-handler";

import ChangelogScreen from "./screens/ChangelogScreen";

import { Badge } from "react-native-paper";

import { CustomTooltip } from "./components/UI/Tourguide_Tooltip";
import OrientationContextProvider from "./store/orientation-context";
import safeLogError from "./util/error";
import { ExpenseData } from "./util/expense";
import { identifyUser, initializeVexo } from "./util/vexo-tracking";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const BottomTabs = createMaterialTopTabNavigator();

const IconSize = constantScale(24, 0.1);

const prefix = Linking.createURL("/");
function NotAuthenticatedStack() {
  const [needOnboarding, setNeedOnboarding] = useState(false);
  const navigation = useNavigation<RootNavigationProp>();
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
      id={undefined}
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
  const navigation = useNavigation<RootNavigationProp>();
  return (
    <ExpensesContextProvider>
      <>
        <Stack.Navigator
          id={undefined}
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
        } as any,
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
      id={undefined}
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
  //     console.log(
  //       `The problematic line code is in: ${modules[moduleId]}.${methods[moduleId][methodId]}`
  //     );
  //   };
  // }

  const [appIsReady, setAppIsReady] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [onlineSetupDone, setOnlineSetupDone] = useState(false);

  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);

  // check regularly
  useInterval(
    () => {
      if (isForeground() && authCtx.isAuthenticated) {
        const asyncQueue = async () => {
          await sendOfflineQueue(
            userCtx.isSendingOfflineQueueMutex,
            userCtx.setIsSendingOfflineQueueMutex
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
              // console.log("delayedOnlineSetup ~ locale:", locale);
              if (!locale) {
                checkUser.locale = i18n.locale;
                // console.log(
                // "delayedOnlineSetup ~ checkUser.locale before updating:",
                //   checkUser.locale
                // );
                await updateUser(storedUid, checkUser);
              }
              const tripData: TripData =
                await tripCtx.fetchAndSetCurrentTrip(tripid);
              if (!tripData) return;
              try {
                setOnlineSetupDone(true);
                await onlineSetup(tripData, checkUser, tripid, storedUid);

                // console.log("delayedOnlineSetup ~ DONE");
              } catch (error) {
                // console.log("delayedOnlineSetup ~ error", error);
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
    console.log("🔧 [App.tsx] onlineSetup started");
    const userData: UserData = checkUser;
    const tripid = userData.currentTrip;
    if (!tripid || tripid?.length < 2) {
      console.log("❌ [App.tsx] onlineSetup: Invalid tripid:", tripid);
      return;
    }
    console.log("🔧 [App.tsx] onlineSetup: Loading keys and setting up user");
    // save user Name in Ctx and async
    await loadKeys();
    try {
      console.log("🔧 [App.tsx] onlineSetup: Adding user name to context");
      await userCtx.addUserName(userData);
      console.log("🔧 [App.tsx] onlineSetup: Setting current trip");
      await tripCtx.setCurrentTrip(tripid, tripData);
      // console.log("onlineSetup ~ tripid before setItem:", tripid);
      console.log("🔧 [App.tsx] onlineSetup: Loading category list");
      await userCtx.loadCatListFromAsyncInCtx(tripid);
      console.log("🔧 [App.tsx] onlineSetup: Touching traveler");
      await touchMyTraveler(storedTripId, storedUid);
      console.log("✅ [App.tsx] onlineSetup completed successfully");
    } catch (error) {
      console.log("❌ [App.tsx] onlineSetup failed:", error);
      // console.log("onlineSetup ~ error", error);
      await tripCtx.loadTripDataFromStorage();
    }
  }

  async function setupOfflineMount(
    isOfflineMode: boolean,
    storedToken: string
  ) {
    if (!isOfflineMode) {
      console.log("🌐 [App.tsx] setupOfflineMount: Online mode, skipping");
      return null;
    }
    console.log("📱 [App.tsx] setupOfflineMount: Setting up offline mode");
    try {
      console.log(
        "📱 [App.tsx] setupOfflineMount: Loading user name from storage"
      );
      await userCtx.loadUserNameFromStorage();
      console.log(
        "📱 [App.tsx] setupOfflineMount: Loading trip data from storage"
      );
      await tripCtx.loadTripDataFromStorage();
      console.log(
        "📱 [App.tsx] setupOfflineMount: Loading travellers from storage"
      );
      await tripCtx.loadTravellersFromStorage();
      console.log(
        "📱 [App.tsx] setupOfflineMount: Loading category list from storage"
      );
      await userCtx.loadCatListFromAsyncInCtx("async");
      console.log(
        "📱 [App.tsx] setupOfflineMount: Authenticating with stored token"
      );
      await authCtx.authenticate(storedToken);
      console.log("✅ [App.tsx] setupOfflineMount completed successfully");
    } catch (error) {
      console.log("❌ [App.tsx] setupOfflineMount failed:", error);
    }
  }

  useEffect(() => {
    async function onRootMount() {
      console.log("🚀 [App.tsx] onRootMount started");
      await handleFirstStart();
      if (DEBUG_RESET_STORAGE) await asyncStoreSafeClear();
      // offline check and set context
      const { isFastEnough } = await isConnectionFastEnough();
      const online = isFastEnough;
      console.log(
        "🌐 [App.tsx] Connection check - isFastEnough:",
        isFastEnough,
        "online:",
        online
      );
      if (isFastEnough) await versionCheck();
      // fetch token and trip
      const storedToken = await secureStoreGetItem("token");
      const storedUid = await secureStoreGetItem("uid");
      const storedTripId = await secureStoreGetItem("currentTripId");
      const freshlyCreated = await asyncStoreGetObject("freshlyCreated");
      console.log(
        "🔑 [App.tsx] Stored credentials - token:",
        !!storedToken,
        "uid:",
        !!storedUid,
        "tripId:",
        !!storedTripId,
        "freshlyCreated:",
        freshlyCreated
      );

      console.log("🔑 [App.tsx] About to load keys...");
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
        console.log("🔑 [App.tsx] Keys loaded successfully");
      } catch (error) {
        console.log("❌ [App.tsx] Failed to load keys:", error);
        // Set default values or handle the error
        REVCAT_G = "";
        REVCAT_A = "";
        VEXO = "";
      }

      if (storedToken && storedUid && storedTripId) {
        console.log(
          "✅ [App.tsx] All credentials present, proceeding with setup"
        );
        // setup purchases
        if (Platform.OS === "android") {
          console.log("🤖 [App.tsx] Configuring Android purchases");
          // Purchases
          Purchases.configure({
            apiKey: REVCAT_G,
            appUserID: storedUid,
          });
        } else if (Platform.OS === "ios" || Platform.OS === "macos") {
          console.log("🍎 [App.tsx] Configuring iOS/macOS purchases");
          // Purchases
          Purchases.configure({
            apiKey: REVCAT_A,
            appUserID: storedUid,
          });
        }
        Purchases.setLogLevel(Purchases.LOG_LEVEL.ERROR);
        await Purchases.collectDeviceIdentifiers();
        console.log("💳 [App.tsx] Purchases configured successfully");

        // Initialize Vexo for error and session tracking
        try {
          console.log("📊 [App.tsx] Initializing Vexo tracking");
          const vexoInitialized = await initializeVexo(VEXO);
          if (vexoInitialized) {
            await identifyUser(storedUid);
            console.log(
              "📊 [App.tsx] Vexo tracking initialized and user identified"
            );
          }
        } catch (vexoError) {
          console.log("❌ [App.tsx] Vexo initialization failed:", vexoError);
          safeLogError(vexoError, "App.tsx", 692);
        }

        const needsTour = await loadTourConfig();
        userCtx.setNeedsTour(needsTour);
        console.log("🎯 [App.tsx] Tour config loaded, needsTour:", needsTour);

        // check if user is online
        if (!online) {
          console.log(
            "📱 [App.tsx] Offline mode detected, setting up offline mount"
          );
          await setupOfflineMount(true, storedToken);
          console.log("✅ [App.tsx] OFFLINE: setAppIsReady(true) called");
          setAppIsReady(true);
          return;
        }

        // set tripId in context
        console.log("🌍 [App.tsx] Online mode - fetching trip data");
        let tripData;
        if (storedTripId) {
          console.log(
            "📋 [App.tsx] Fetching trip data for tripId:",
            storedTripId
          );
          tripData = await tripCtx.fetchAndSetCurrentTrip(storedTripId);
          await tripCtx.fetchAndSetTravellers(storedTripId);
          tripCtx.setTripid(storedTripId);
          console.log("📋 [App.tsx] Trip data fetched successfully");
        } else {
          console.log(
            "❌ [App.tsx] No storedTripId found, showing error and logging out"
          );
          Toast.show({
            type: "error",
            text1: i18n.t("toastLoginError1"),
            text2: i18n.t("toastLoginError2"),
            visibilityTime: 5000,
          });
          await asyncStoreSafeClear();
          authCtx.logout(tripCtx.tripid);
          console.log("✅ [App.tsx] NO_TRIP_ID: setAppIsReady(true) called");
          setAppIsReady(true);
          return;
        }

        // Always set freshlyCreated value from storage
        console.log(
          "🆕 [App.tsx] Setting freshlyCreated flag:",
          freshlyCreated
        );
        await userCtx.setFreshlyCreatedTo(freshlyCreated || false);
        // check if user was deleted
        console.log("👤 [App.tsx] Checking user status");
        const checkUser = await fetchUser(storedUid);
        if (!checkUser.userName) {
          console.log(
            "❌ [App.tsx] User account deleted or invalid, showing error"
          );
          Toast.show({
            type: "error",
            text1: i18n.t("toastAccountError1"),
            text2: i18n.t("toastAccountError1"),
            visibilityTime: 5000,
          });
          await asyncStoreSafeClear();
          console.log("✅ [App.tsx] USER_DELETED: setAppIsReady(true) called");
          setAppIsReady(true);
          return;
        }
        if (checkUser.userName && !checkUser.currentTrip) {
          console.log(
            "🆕 [App.tsx] User has no current trip, setting freshlyCreated"
          );
          await userCtx.setFreshlyCreatedTo(true);
        }
        // setup context
        console.log("⚙️ [App.tsx] Setting up user context and authentication");
        await authCtx.setUserID(storedUid);
        await onlineSetup(tripData, checkUser, storedTripId, storedUid);
        await authCtx.authenticate(storedToken);
        console.log("✅ [App.tsx] ONLINE_SUCCESS: setAppIsReady(true) called");
        setAppIsReady(true);
      } else {
        console.log(
          "❌ [App.tsx] Missing credentials, clearing storage and logging out"
        );
        console.log(
          "❌ [App.tsx] Credential check - token:",
          !!storedToken,
          "uid:",
          !!storedUid,
          "tripId:",
          !!storedTripId
        );
        tripCtx.setIsLoading(false);
        await asyncStoreSafeClear();
        authCtx.logout();
        console.log("✅ [App.tsx] NO_CREDENTIALS: setAppIsReady(true) called");
        setAppIsReady(true);
      }
      console.log(
        "⚠️ [App.tsx] FALLBACK: setAppIsReady(true) called (this should not happen)"
      );
      setAppIsReady(true);
    }
    const test_onRootMount = dataResponseTime(onRootMount);

    try {
      console.log("🚀 [App.tsx] Starting onRootMount execution");
      test_onRootMount();
    } catch (error) {
      console.log("❌ [App.tsx] onRootMount execution failed:", error);
      safeLogError(error);
      console.log("✅ [App.tsx] ERROR_CATCH: setAppIsReady(true) called");
      setAppIsReady(true);
    }

    // Safety timeout - ensure app is ready after 10 seconds regardless
    setTimeout(() => {
      if (!appIsReady) {
        console.log(
          "⚠️ [App.tsx] SAFETY_TIMEOUT: setAppIsReady(true) called after 10 seconds"
        );
        setAppIsReady(true);
      }
    }, 10000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // only ask for review if the app goes from background to active
    const handler = AppState.addEventListener("change", nextAppState => {
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
    console.log("📱 [App.tsx] appIsReady state changed to:", appIsReady);
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
    <View
      style={{
        flex: 1,
      }}
      onStartShouldSetResponder={handleUnhandledTouches}
    >
      <View
        style={{
          flex: 1,
        }}
      >
        <SafeAreaView
          style={{
            flex: 0,
            backgroundColor: GlobalStyles.colors.backgroundColor,
            paddingTop:
              Platform.OS === "android" ? StatusBarRN.currentHeight : 0,
          }}
        />
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: GlobalStyles.colors.gray500,
          }}
        >
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
        </SafeAreaView>
      </View>
    </View>
  );
}
