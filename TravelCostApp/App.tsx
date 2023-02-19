// Debug asyncStorage, set to true if you want all storage to be reset and user logged out
const DEBUG_RESET = false;
// Debug OfflineMode, set to true if you want the simulator to be offline
export const DEBUG_FORCE_OFFLINE = false;

import React from "react";
import { useContext, useEffect, useState, useLayoutEffect } from "react";
import { Alert, Text, SafeAreaView, View, Keyboard } from "react-native";
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
import { fetchUser, fetchTrip } from "./util/http";
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
import { en, de } from "./i18n/supportedLanguages";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
// i18n.locale = "en";
i18n.enableFallback = true;

// // NOTE: for beta testing we leave this here
// import { LogBox } from "react-native";
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
          padding: "0,5%",
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
            tabBarLabel: "Expenses",
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
            title: "Overview",
            tabBarLabel: "Overview",
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
      {UserCtx.isOnline && (
        <BottomTabs.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            // headerShown: false,
            title: "Profile",
            tabBarLabel: "Profile",
            tabBarIcon: ({ color }) => (
              <Ionicons name="person-circle-outline" size={24} color={color} />
            ),
          }}
        />
      )}
      {!FreshlyCreated && (
        <BottomTabs.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            // headerShown: false,
            title: "Settings",
            tabBarLabel: "Settings",
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
      console.log("onRootMount ~ onRootMount");
      if (DEBUG_RESET) await asyncStoreSafeClear();

      // offline check and set context
      await userCtx.checkConnectionUpdateUser(DEBUG_FORCE_OFFLINE);

      // fetch token and trip
      const storedToken = await asyncStoreGetItem("token");
      const storedUid = await asyncStoreGetItem("uid");
      const storedTripId = await asyncStoreGetItem("currentTripId");
      const freshlyCreated = await asyncStoreGetObject("freshlyCreated");

      console.log(
        "store loads: ",
        truncateString(storedToken, 10),
        truncateString(storedUid, 10),
        truncateString(storedTripId, 10),
        freshlyCreated
      );

      if (storedToken) {
        //// START OF IMPORTANT CHECKS BEFORE ACTUALLY LOGGING IN IN APP.tsx OR LOGIN.tsx
        // check if user is online
        if (!(await userCtx.checkConnectionUpdateUser(DEBUG_FORCE_OFFLINE))) {
          console.log("OFFLINE SETUP STARTED");
          await setupOfflineMount(true, storedToken);
          console.log("OFFLINE SETUP FINISHED");
          setAppIsReady(true);
          return;
        }
        // set tripId in context
        if (storedTripId) {
          console.log("onRootMount ~ storedTripId", storedTripId);
          await tripCtx.fetchAndSetCurrentTrip(storedTripId);
          tripCtx.setCurrentTravellers(storedTripId);
          tripCtx.setTripid(storedTripId);
        }

        // send offline queue if we have one
        await sendOfflineQueue();

        // check if user was only freshly created
        if (freshlyCreated) {
          userCtx.setFreshlyCreatedTo(freshlyCreated);
        }
        // check if user was deleted
        const checkUser = await fetchUser(storedUid);
        // Check if the user logged in but there is no userName, we deleted the account
        if (!checkUser || !checkUser.userName) {
          Alert.alert(
            "Your Account was deleted or AppData was reset, please create a new account!"
          );
          await AsyncStorage.clear();
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
        let tripData;
        try {
          const userData = checkUser;
          const tripid = userData.currentTrip;
          // console.log("onRootMount ~ userData", userData);
          userCtx.addUser(userData);
          tripData = await fetchTrip(tripid);
          tripCtx.setCurrentTrip(tripid, tripData);
          await asyncStoreSetItem("currentTripId", tripid);
        } catch (error) {
          Alert.alert(error);
        }

        authCtx.authenticate(storedToken);
      } else {
        authCtx.logout();
      }

      //TODO: we should fetch the expenses before setting this + implement the dirty system
      setAppIsReady(true);
    }

    onRootMount();
  }, []);

  useLayoutEffect(() => {
    async function hideSplashScreen() {
      await SplashScreen.hideAsync();
    }
    hideSplashScreen();
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
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
                    <Root />
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
