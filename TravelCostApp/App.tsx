import { useContext, useEffect, useState } from "react";
import { Alert, Text, SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import AppLoading from "expo-app-loading";
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
import { fetchExpenses, fetchUser, getAllExpenses } from "./util/http";
import TripContextProvider, { TripContext } from "./store/trip-context";
import TripForm from "./components/ManageTrip/TripForm";
import OnboardingScreen from "./screens/OnboardingScreen";
import JoinTrip from "./screens/JoinTrip";
import ShareTripButton from "./components/ProfileOutput/ShareTrip";
import OverviewScreen from "./screens/OverviewScreen";
import CategoryPickScreen from "./screens/CategoryPickScreen";
import SplitSummaryScreen from "./screens/SplitSummaryScreen";

import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de } from "./i18n/supportedLanguages";
const i18n = new I18n({ en, de });
i18n.locale = Localization.locale.slice(0, 2);
// i18n.locale = "en";
i18n.enableFallback = true;

// NOTE: for alpha testing we leave this here
import { LogBox } from "react-native";
LogBox.ignoreLogs(["Warning: ..."]); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const BottomTabs = createBottomTabNavigator();

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
    <NavigationContainer linking={linking} fallback={<Text>Loading...</Text>}>
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
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        headerTintColor: GlobalStyles.colors.backgroundColor,
        tabBarStyle: {
          backgroundColor: GlobalStyles.colors.gray500,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: GlobalStyles.colors.primary500,
      })}
    >
      {!FreshlyCreated && (
        <BottomTabs.Screen
          name="RecentExpenses"
          component={RecentExpenses}
          options={{
            headerShown: false,
            // title: "Recent Expenses",
            tabBarLabel: "Expenses",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="ios-list" size={size} color={color} />
            ),
          }}
        />
      )}
      {!FreshlyCreated && (
        <BottomTabs.Screen
          name="Overview"
          component={OverviewScreen}
          options={{
            headerShown: false,
            title: "Overview",
            tabBarLabel: "Overview",
            tabBarIcon: ({ color, size }) => (
              <Ionicons
                name="ios-stats-chart-outline"
                size={size}
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
          headerShown: false,
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
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

  const [isTryingLogin, setIsTryingLogin] = useState(true);

  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const expensesCtx = useContext(ExpensesContext);

  useEffect(() => {
    async function onRootMount() {
      console.log("onRootMount ~ onRootMount");
      // NOTE: uncomment below for memory/login debugging // flush memory
      await AsyncStorage.clear();

      // fetch token and trip
      const storedToken = await AsyncStorage.getItem("token");
      const storedUid = await AsyncStorage.getItem("uid");
      const storedTripId = await AsyncStorage.getItem("currentTripId");
      const freshlyCreated = await AsyncStorage.getItem("freshlyCreated");

      if (storedToken) {
        authCtx.setUserID(storedUid);
        try {
          const response = await fetchUser(storedUid);
          if (response) {
            userCtx.addUser(response);
            // userCtx.setTripHistory(response.tripHistory);
          }
        } catch (error) {
          Alert.alert(error);
        }
        if (storedTripId) {
          // TODO: figure out when we want to save or load from async storage,
          // right now this function seems to be confused
          tripCtx.fetchAndSetCurrentTrip(storedTripId);
          tripCtx.setCurrentTravellers(storedTripId);

          const expenses = await getAllExpenses(storedTripId, storedUid);
          expensesCtx.setExpenses(expenses);
        }
        if (freshlyCreated)
          userCtx.setFreshlyCreatedTo(JSON.parse(freshlyCreated));
        authCtx.authenticate(storedToken);
      }

      setIsTryingLogin(false);
    }

    onRootMount();
  }, []);

  if (isTryingLogin) {
    return <AppLoading />;
  }

  return <Navigation />;
}

export default function App() {
  return (
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
              <Root />
            </UserContextProvider>
          </TripContextProvider>
        </AuthContextProvider>
      </SafeAreaView>
    </>
  );
}
