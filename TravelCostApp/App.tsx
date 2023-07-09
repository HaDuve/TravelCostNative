import React from "react";
import { useContext, useEffect, useState, useLayoutEffect } from "react";
import { Alert, LogBox } from "react-native";
LogBox.ignoreAllLogs(); //Ignore all log notifications
import {
  SafeAreaView,
  View,
  Keyboard,
  Platform,
  AppState,
  Image,
} from "react-native";
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
import RecentExpenses from "./screens/RecentExpenses";
import { GlobalStyles } from "./constants/styles";
import AuthContextProvider, { AuthContext } from "./store/auth-context";
import ExpensesContextProvider, {
  ExpensesContext,
} from "./store/expenses-context";
import ProfileScreen from "./screens/ProfileScreen";
import UserContextProvider, { UserContext } from "./store/user-context";
import { fetchUser, touchMyTraveler, dataResponseTime } from "./util/http";
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
  asyncStoreGetItem,
  asyncStoreGetObject,
  asyncStoreSafeClear,
  asyncStoreSetItem,
} from "./store/async-storage";
import LoadingOverlay from "./components/UI/LoadingOverlay";
import ImportGSScreen from "./screens/ImportGSScreen";
import FilteredExpenses from "./screens/FilteredExpenses";
import { sendOfflineQueue } from "./util/offline-queue";
import branch from "react-native-branch";

//localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "./i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
// i18n.locale = "en";
i18n.enableFallback = true;
import ManageCategoryScreen from "./screens/ManageCategoryScreen";
import ToastComponent from "./components/UI/ToastComponent";
import { DEBUG_RESET, DEBUG_POLLING_INTERVAL, DEV } from "./confAppConstants";
import SplashScreenOverlay from "./components/UI/SplashScreenOverlay";
import Toast from "react-native-toast-message";
import { useInterval } from "./components/Hooks/useInterval";
import { isForeground } from "./util/appState";
import { TourGuideProvider } from "rn-tourguide";
import { loadTourConfig } from "./util/tourUtil";
import { REVCAT_API_KEY } from "./components/Premium/PremiumConstants";
import PaywallScreen from "./components/Premium/PayWall";
import { SettingsProvider } from "./store/settings-context";
import { UserData } from "./store/user-context";
import FilteredPieCharts from "./screens/FilteredPieCharts";
import {
  handleFirstStart,
  shouldPromptForRating,
} from "./components/Rating/firstStartUtil";
import RatingModal from "./screens/RatingModal";
import NetworkContextProvider, {
  NetworkContext,
} from "./store/network-context";
import { Avatar, Text } from "react-native-paper";
import ConnectionBar from "./components/UI/ConnectionBar";
import { secureStoreGetItem, secureStoreSetItem } from "./store/secure-storage";
import { isConnectionFastEnough } from "./util/connectionSpeed";
import FinancialScreen from "./screens/FinancialScreen";
import FinderScreen from "./screens/FinderScreen";
import CustomerScreen from "./screens/CustomerScreen";
import CategoryMapTestScreen from "./screens/CategoryMapTestScreen";
import GPTDealScreen from "./screens/GPTDealScreen";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const BottomTabs = createMaterialTopTabNavigator();

const prefix = Linking.createURL("/");
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
            name="ImportGS"
            component={ImportGSScreen}
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
            name="CategoryMapTest"
            component={CategoryMapTestScreen}
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
  const userCtx = useContext(UserContext);
  const FreshlyCreated = userCtx.freshlyCreated;

  const FirstScreen = FreshlyCreated ? "Profile" : "RecentExpenses";

  return (
    <BottomTabs.Navigator
      initialRouteName={FirstScreen}
      backBehavior={"history"}
      tabBarPosition={"bottom"}
      // tabBar={(props) => <TabBar {...props} />}
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        headerTintColor: GlobalStyles.colors.backgroundColor,
        tabBarStyle: {
          backgroundColor: GlobalStyles.colors.gray500,
          // paddingTop: 4,
          borderTopWidth: 1,
          borderTopColor: GlobalStyles.colors.gray600,
        },
        tabBarItemStyle: {
          // width: "40%",
          borderWidth: 0,
          padding: "0%",
          // margin: "0%",
          marginTop: "-2%",
          // marginBottom: "1%",
          // paddingBottom: "1%",
        },
        tabBarLabelStyle: {
          fontSize: 10,
        },
        tabBarActiveTintColor: GlobalStyles.colors.primary500,
        tabBarIndicatorStyle: {
          backgroundColor: GlobalStyles.colors.primary500,
        },
        tabBarBounces: true,
      })}
    >
      <BottomTabs.Screen
        name="RecentExpenses"
        component={RecentExpenses}
        options={{
          tabBarShowLabel: false,
          // headerShown: false,
          // title: "Recent Expenses",
          tabBarLabel: i18n.t("expensesTab"),
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />

      <BottomTabs.Screen
        name="Overview"
        component={OverviewScreen}
        options={{
          // headerShown: false,
          tabBarShowLabel: false,
          title: i18n.t("overviewTab"),
          tabBarLabel: i18n.t("overviewTab"),
          tabBarIcon: ({ color }) => (
            <Ionicons
              name={
                userCtx.isShowingGraph
                  ? "bar-chart-outline"
                  : "pie-chart-outline"
              }
              size={24}
              color={color}
            />
          ),
        }}
      />
      <BottomTabs.Screen
        name="Finder"
        component={FinderScreen}
        options={{
          // headerShown: false,
          title: i18n.t("settingsTab"),
          tabBarShowLabel: false,

          tabBarLabel: "Finder", //i18n.t("settingsTab"),
          tabBarIcon: ({ color }) => (
            // image of a money bag
            <Ionicons name="search-outline" size={24} color={color} />
            // probably needs a new build for this icon to work
            // <Image
            //   source={require("./assets/money-bag.png")}
            //   style={{ width: 60, height: 60 }}
            // />
          ),
        }}
      />
      <BottomTabs.Screen
        name="Financial"
        component={SplitSummaryScreen}
        options={{
          // headerShown: false,
          title: i18n.t("settingsTab"),
          tabBarShowLabel: false,

          tabBarLabel: "Financial", //i18n.t("settingsTab"),
          tabBarIcon: ({ color }) => (
            // image of a money bag
            <Ionicons name="cash-outline" size={24} color={color} />
            // probably needs a new build for this icon to work
            // <Image
            //   source={require("./assets/money-bag.png")}
            //   style={{ width: 60, height: 60 }}
            // />
          ),
        }}
      />
      <BottomTabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          // headerShown: false,
          title: i18n.t("profileTab"),
          tabBarShowLabel: false,

          tabBarLabel: i18n.t("myTrips"),
          tabBarIcon: ({ color }) => (
            <Ionicons name="globe-outline" size={24} color={color} />
          ),
        }}
      />
    </BottomTabs.Navigator>
  );
}

function Root() {
  // NOTE: batchedBridge debugging global
  if (global.__fbBatchedBridge) {
    const origMessageQueue = global.__fbBatchedBridge;
    const modules = origMessageQueue._remoteModuleTable;
    const methods = origMessageQueue._remoteMethodTable;
    global.findModuleByModuleAndMethodIds = (moduleId, methodId) => {
      console.log(
        `The problematic line code is in: ${modules[moduleId]}.${methods[moduleId][methodId]}`
      );
    };
  }

  const [appIsReady, setAppIsReady] = useState(false);
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [onlineSetupDone, setOnlineSetupDone] = useState(false);

  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const netCtx = useContext(NetworkContext);
  const expensesCtx = useContext(ExpensesContext);

  // check regularly
  useInterval(
    () => {
      if (isForeground() && authCtx.isAuthenticated) {
        const asyncQueue = async () => {
          await sendOfflineQueue();
        };
        asyncQueue();

        const delayedOnlineSetup = async () => {
          if (userCtx.freshlyCreated) return;
          if (!onlineSetupDone) {
            const { isFastEnough } = await isConnectionFastEnough();
            if (isFastEnough) {
              setOnlineSetupDone(true);
              try {
                //prepare online setup
                const storedUid = await secureStoreGetItem("uid");
                if (!storedUid) return;
                const checkUser = await fetchUser(storedUid);
                if (!checkUser) return;
                const tripid = checkUser.currentTrip;
                const tripData = await tripCtx.fetchAndSetCurrentTrip(tripid);
                if (!tripData) return;
                await onlineSetup(tripData, checkUser, tripid, storedUid);
                console.log("delayedOnlineSetup ~ DONE");
              } catch (error) {
                console.log("delayedOnlineSetup ~ error", error);
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
    if (!tripid || tripid?.length < 2) return;
    // console.log("onRootMount ~ userData", userData);
    // save user Name in Ctx and async
    try {
      await userCtx.addUserName(userData);
      await tripCtx.setCurrentTrip(tripid, tripData);
      console.log("onlineSetup ~ tripid before setItem:", tripid);
      await userCtx.loadCatListFromAsyncInCtx(tripid);
      await touchMyTraveler(storedTripId, storedUid);
    } catch (error) {
      console.log("onlineSetup ~ error", error);
      await tripCtx.loadTripDataFromStorage();
    }
  }

  async function setupOfflineMount(
    isOfflineMode: boolean,
    storedToken: string
  ) {
    if (!isOfflineMode) {
      console.log("Online mode");
      return null;
    }
    console.log("Offline mode");
    await userCtx.loadUserNameFromStorage();
    await tripCtx.loadTripDataFromStorage();
    await tripCtx.loadTravellersFromStorage();
    await userCtx.loadCatListFromAsyncInCtx("async");
    await authCtx.authenticate(storedToken);
  }

  useEffect(() => {
    async function onRootMount() {
      // first start
      await handleFirstStart();

      // wrap functions to test dataResponseTime
      const test_tripCtx_fetchAndSetCurrentTrip = dataResponseTime(
        tripCtx.fetchAndSetCurrentTrip
      );
      const test_fetchUser = dataResponseTime(fetchUser);

      // end wrap
      console.log("onRootMount ~ onRootMount");

      if (DEBUG_RESET) await asyncStoreSafeClear();

      // offline check and set context
      const { isFastEnough, speed } = await isConnectionFastEnough();
      console.log("onRootMount ~ speed:", speed);
      console.log("onRootMount ~ isFastEnough:", isFastEnough);
      const online = isFastEnough;

      console.log("onRootMount ~ online:", online, speed?.toFixed(2), " mbps");

      // fetch token and trip
      const storedToken = await secureStoreGetItem("token");
      const storedUid = await secureStoreGetItem("uid");
      const storedTripId = await secureStoreGetItem("currentTripId");
      const freshlyCreated = await asyncStoreGetObject("freshlyCreated");

      if (storedToken && storedUid && storedTripId) {
        // setup purchases
        if (Platform.OS === "android") {
          // Purchases
          Purchases.configure({
            apiKey: "<public_google_sdk_key>",
            appUserID: storedUid,
          });
        } else if (Platform.OS === "ios" || Platform.OS === "macos") {
          // Purchases
          Purchases.configure({ apiKey: REVCAT_API_KEY, appUserID: storedUid });
          console.log("onRootMount ~ storedUid:", storedUid);
        }

        const needsTour = await loadTourConfig();
        console.log("onRootMount ~ needsTour:", needsTour);
        userCtx.setNeedsTour(needsTour);

        //// START OF IMPORTANT CHECKS BEFORE ACTUALLY LOGGING IN IN APP.tsx OR LOGIN.tsx
        // check if user is online
        if (!online) {
          console.log("OFFLINE SETUP STARTED");
          await setupOfflineMount(true, storedToken);
          console.log("OFFLINE SETUP FINISHED");
          setAppIsReady(true);
          return;
        }

        // set tripId in context
        let tripData;
        if (storedTripId) {
          // console.log("onRootMount ~ storedTripId", storedTripId);
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
          await authCtx.logout();
          setAppIsReady(true);
          return;
        }

        // send offline queue if we have one
        await sendOfflineQueue();

        // check if user was only freshly created
        if (freshlyCreated) {
          await userCtx.setFreshlyCreatedTo(freshlyCreated);
        }
        // check if user was deleted
        const checkUser = await fetchUser(storedUid);
        console.log("onRootMount ~ checkUser:", checkUser);
        // Check if the user logged in but there is no userName, we deleted the account
        if (!checkUser || !checkUser.userName) {
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
        // TODO: fix status when user disconnedcted while freshlyCreated=true
        //// END OF IMPORTANT CHECKS BEFORE ACTUALLY LOGGING IN IN APP.tsx OR LOGIN.tsx

        // setup context
        await authCtx.setUserID(storedUid);
        await onlineSetup(tripData, checkUser, storedTripId, storedUid);
        await authCtx.authenticate(storedToken);
        console.log("Root end reached");
      } else {
        await asyncStoreSafeClear();
        await authCtx.logout();
      }
      setAppIsReady(true);
    }
    const test_onRootMount = dataResponseTime(onRootMount);
    try {
      test_onRootMount();
    } catch (error) {
      console.error("onRootMount ~ error", error);
    }
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
  return false;
}

export default function App() {
  return (
    <View
      style={{ flex: 1 }}
      onStartShouldSetResponder={handleUnhandledTouches}
    >
      <>
        <SafeAreaView
          style={{
            flex: 0,
            backgroundColor: GlobalStyles.colors.backgroundColor,
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
                        <TourGuideProvider
                          {...{
                            borderRadius: 16,
                            key: "settings",
                            labels: {
                              previous: i18n.t("tourGuideLabelPrevious"),
                              next: i18n.t("tourGuideLabelNext"),
                              skip: i18n.t("tourGuideLabelSkip"),
                              finish: i18n.t("tourGuideLabelFinish"),
                            },
                          }}
                        >
                          <Root />
                          {/* {DEV && <ConnectionBar />} */}
                          <ToastComponent />
                        </TourGuideProvider>
                      </ExpensesContextProvider>
                    </NetworkProvider>
                  </SettingsProvider>
                </UserContextProvider>
              </TripContextProvider>
            </NetworkContextProvider>
          </AuthContextProvider>
        </SafeAreaView>
      </>
    </View>
  );
}
