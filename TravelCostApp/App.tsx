import React from "react";
import { useContext, useEffect, useState, useLayoutEffect } from "react";
import {
  Alert,
  Text,
  SafeAreaView,
  View,
  Keyboard,
  Platform,
} from "react-native";
import Purchases, { PurchasesOffering } from "react-native-purchases";

import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import * as SplashScreen from "expo-splash-screen";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { NetworkProvider, checkInternetConnection } from "react-native-offline";
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
import {
  fetchUser,
  fetchTrip,
  touchTraveler,
  getAllExpenses,
  touchMyTraveler,
  dataResponseTime,
} from "./util/http";
import TripContextProvider, { TripContext } from "./store/trip-context";
import TripForm from "./components/ManageTrip/TripForm";
import OnboardingScreen from "./screens/OnboardingScreen";
import JoinTrip from "./screens/JoinTrip";
import ShareTripButton from "./components/ProfileOutput/ShareTrip";
import OverviewScreen from "./screens/OverviewScreen";
import CategoryPickScreen from "./screens/CategoryPickScreen";
import SplitSummaryScreen from "./screens/SplitSummaryScreen";
import SettingsScreen from "./screens/SettingsScreen";
import * as Device from "expo-device";
import {
  asyncStoreGetItem,
  asyncStoreGetObject,
  asyncStoreSafeClear,
  asyncStoreSetItem,
} from "./store/async-storage";
import { truncateString } from "./util/string";
import LoadingOverlay from "./components/UI/LoadingOverlay";
import ImportGSScreen from "./screens/ImportGSScreen";
import FilteredExpenses from "./screens/FilteredExpenses";
import { sendOfflineQueue } from "./util/offline-queue";

//localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr } from "./i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr });
i18n.locale = Localization.locale.slice(0, 2);
// i18n.locale = "en";
i18n.enableFallback = true;

// // NOTE: for beta testing we leave this here
// import { LogBox } from "react-native";
import ManageCategoryScreen from "./screens/ManageCategoryScreen";
import ToastComponent from "./components/UI/ToastComponent";
import {
  DEBUG_FORCE_OFFLINE,
  DEBUG_RESET,
  DEBUG_POLLING_INTERVAL,
} from "./confApp";
import SplashScreenOverlay from "./components/UI/SplashScreenOverlay";
import Toast from "react-native-toast-message";
import { offlineLoad } from "./components/ExpensesOutput/RecentExpensesUtil";
import { useInterval } from "./components/Hooks/useInterval";
import { isForeground } from "./util/appState";
import { TourGuideProvider } from "rn-tourguide";
import { loadTourConfig } from "./util/tourUtil";
import PremiumScreen from "./screens/PremiumScreen";
import { API_KEY } from "./components/Premium/PremiumConstants";
// LogBox.ignoreLogs(["Warning: ..."]); // Ignore log notification by message
// LogBox.ignoreAllLogs(); //Ignore all log notifications

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const BottomTabs = createMaterialTopTabNavigator();

const prefix = Linking.createURL("/");
function NotAuthenticatedStack() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        headerTintColor: GlobalStyles.colors.textColor,
        contentStyle: { backgroundColor: GlobalStyles.colors.backgroundColor },
      }}
    >
      <AuthStack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
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
              presentation: "formSheet",
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
            name="Premium"
            component={PremiumScreen}
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
  const UserCtx = useContext(UserContext);
  const FreshlyCreated = UserCtx.freshlyCreated;
  const FirstScreen = FreshlyCreated ? "Profile" : "RecentExpenses";
  return (
    <BottomTabs.Navigator
      initialRouteName={FirstScreen}
      backBehavior={"history"}
      tabBarPosition={"bottom"}
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        headerTintColor: GlobalStyles.colors.backgroundColor,
        tabBarStyle: {
          backgroundColor: GlobalStyles.colors.gray500,
          paddingTop: 4,
          borderTopWidth: 1,
          borderTopColor: GlobalStyles.colors.gray600,
        },
        tabBarItemStyle: {
          // width: "40%",
          borderWidth: 0,
          padding: "0%",
          margin: "0%",
          marginBottom: "1%",
          paddingBottom: "1%",
        },
        tabBarLabelStyle: {
          fontSize: 10,
        },
        tabBarActiveTintColor: GlobalStyles.colors.primary500,
        tabBarIndicatorStyle: {
          backgroundColor: UserCtx.isOnline
            ? GlobalStyles.colors.primary500
            : "black",
        },
        tabBarBounces: true,
      })}
    >
      {!FreshlyCreated && (
        <BottomTabs.Screen
          name="RecentExpenses"
          component={RecentExpenses}
          options={{
            // headerShown: false,
            // title: "Recent Expenses",
            tabBarLabel: i18n.t("expensesTab"),
            tabBarIcon: ({ color }) => (
              <Ionicons name="ios-list" size={24} color={color} />
            ),
          }}
        />
      )}
      {!FreshlyCreated && (
        <BottomTabs.Screen
          name="Overview"
          component={OverviewScreen}
          options={{
            // headerShown: false,
            title: i18n.t("overviewTab"),
            tabBarLabel: i18n.t("overviewTab"),
            tabBarIcon: ({ color }) => (
              <Ionicons
                name="ios-stats-chart-outline"
                size={24}
                color={color}
              />
            ),
          }}
        />
      )}

      <BottomTabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          // headerShown: false,
          title: i18n.t("profileTab"),
          tabBarLabel: i18n.t("profileTab"),
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle-outline" size={24} color={color} />
          ),
        }}
      />

      {!FreshlyCreated && (
        <BottomTabs.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            // headerShown: false,
            title: i18n.t("settingsTab"),
            tabBarLabel: i18n.t("settingsTab"),
            tabBarIcon: ({ color }) => (
              <Ionicons name="cog-outline" size={24} color={color} />
            ),
          }}
        />
      )}
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

  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const expensesCtx = useContext(ExpensesContext);

  // check regularly
  useInterval(
    () => {
      if (isForeground() && authCtx.isAuthenticated) {
        const asyncQueue = async () => {
          await sendOfflineQueue();
        };
        asyncQueue();
      }
    },
    DEBUG_POLLING_INTERVAL * 1.7,
    false
  );
  async function setupOfflineMount(
    isOfflineMode: boolean,
    storedToken: string
  ) {
    if (!isOfflineMode) {
      console.log("Online mode");
      return null;
    }
    console.log("Offline mode");
    await expensesCtx.loadExpensesFromStorage();
    await userCtx.loadUserNameFromStorage();
    await tripCtx.loadTripDataFromStorage();
    await tripCtx.loadTravellersFromStorage();
    authCtx.offlineAuthenticate(storedToken);
  }

  useEffect(() => {
    async function onRootMount() {
      // wrap functions to test dataResponseTime
      const test_tripCtx_fetchAndSetCurrentTrip = dataResponseTime(
        tripCtx.fetchAndSetCurrentTrip
      );
      const test_fetchUser = dataResponseTime(fetchUser);
      const test_touchMyTraveler = dataResponseTime(touchMyTraveler);
      const test_userCtx_checkConnectionUpdateUser = dataResponseTime(
        userCtx.checkConnectionUpdateUser
      );
      // end wrap
      console.log("onRootMount ~ onRootMount");

      if (Platform.OS === "android") {
        // Purchases
        Purchases.configure({ apiKey: "<public_google_sdk_key>" });
      } else if (Platform.OS === "ios") {
        // Purchases
        Purchases.configure({ apiKey: API_KEY });
      }

      if (DEBUG_RESET) await asyncStoreSafeClear();

      // offline check and set context
      const online = await test_userCtx_checkConnectionUpdateUser();
      console.log("onRootMount ~ online:", online);
      // await userCtx.checkConnectionUpdateUser();

      // fetch token and trip
      const storedToken = await asyncStoreGetItem("token");
      const storedUid = await asyncStoreGetItem("uid");
      const storedTripId = await asyncStoreGetItem("currentTripId");
      const freshlyCreated = await asyncStoreGetObject("freshlyCreated");

      // console.log(
      //   "store loaded: ",
      //   truncateString(storedToken, 10),
      //   truncateString(storedUid, 10),
      //   truncateString(storedTripId, 10),
      //   freshlyCreated
      // );

      if (storedToken) {
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
          tripData = await test_tripCtx_fetchAndSetCurrentTrip(storedTripId);
          tripCtx.setCurrentTravellers(storedTripId);
          tripCtx.setTripid(storedTripId);
        } else {
          Toast.show({
            type: "error",
            text1: "Login error",
            text2: "Please login again!",
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
          userCtx.setFreshlyCreatedTo(freshlyCreated);
        }
        // check if user was deleted
        const checkUser = await test_fetchUser(storedUid);
        // Check if the user logged in but there is no userName, we deleted the account
        if (!checkUser || !checkUser.userName) {
          Toast.show({
            type: "error",
            text1: "Account not found",
            text2: "Please create a new account!",
            visibilityTime: 5000,
          });
          await asyncStoreSafeClear();
          setAppIsReady(true);
          return;
        }
        if (checkUser.userName && !checkUser.currentTrip) {
          userCtx.setFreshlyCreatedTo(true);
        }
        // TODO: fix status when user disconnedcted while freshlyCreated=true
        //// END OF IMPORTANT CHECKS BEFORE ACTUALLY LOGGING IN IN APP.tsx OR LOGIN.tsx

        // setup context
        authCtx.setUserID(storedUid);

        // console.log("getExpenses ~ expenses", expenses);

        const userData = checkUser;
        const tripid = userData.currentTrip;
        console.log("onRootMount ~ userData", userData);
        userCtx.addUser(userData);
        const lastCountry = await asyncStoreGetItem("lastCountry");
        const lastCurrency = await asyncStoreGetItem("lastCurrency");
        if (lastCountry) userCtx.setLastCountry(lastCountry);
        if (lastCurrency) userCtx.setLastCurrency(lastCurrency);
        tripCtx.setCurrentTrip(tripid, tripData);
        await asyncStoreSetItem("currentTripId", tripid);
        const isLoaded = await offlineLoad(expensesCtx);
        console.log("onRootMount ~ isLoaded:", isLoaded);
        authCtx.authenticate(storedToken);
        await touchMyTraveler(tripid, storedUid);
        const needsTour = await loadTourConfig();
        console.log("onRootMount ~ needsTour:", needsTour);
        userCtx.setNeedsTour(needsTour);
        console.log("Root end reached");
      } else {
        authCtx.logout();
      }
      setAppIsReady(true);
    }
    const test_onRootMount = dataResponseTime(onRootMount);
    test_onRootMount();
    // onRootMount();
    return () => {
      expensesCtx.saveExpensesInStorage(expensesCtx.expenses);
      console.log("!onRootMount ~ !onRootMount END");
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

  return <Navigation />;
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
          <StatusBar style="dark" />
          <AuthContextProvider>
            <TripContextProvider>
              <UserContextProvider>
                <NetworkProvider>
                  <ExpensesContextProvider>
                    <TourGuideProvider
                      {...{ borderRadius: 16, key: "settings" }}
                    >
                      <Root />
                      <ToastComponent />
                    </TourGuideProvider>
                  </ExpensesContextProvider>
                </NetworkProvider>
              </UserContextProvider>
            </TripContextProvider>
          </AuthContextProvider>
        </SafeAreaView>
      </>
    </View>
  );
}
