import { StatusBar } from "expo-status-bar";
import { useContext, useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { Alert, Text } from "react-native";
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
import { setupHighscoreListener, storeHighScore } from "./firebase/testAuth";

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
            id: (id) => `${id}`,
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
      // NOTE: uncomment below for memory/login debugging
      // await AsyncStorage.clear();

      // fetch token and trip
      const storedToken = await AsyncStorage.getItem("token");
      const storedUid = await AsyncStorage.getItem("uid");
      const storedTripId = await AsyncStorage.getItem("currentTripId");
      const freshlyCreated = await AsyncStorage.getItem("freshlyCreated");

      // firebase stuff
      storeHighScore(storedUid, 1);
      setupHighscoreListener(storedUid);
      storeHighScore(storedUid, 2);
      storeHighScore(storedUid, 3);

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
          tripCtx.fetchCurrentTrip(storedTripId);
          tripCtx.setCurrentTravellers(storedTripId);

          const expenses = await getAllExpenses(storedTripId);
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
      <StatusBar style="dark" />
      <AuthContextProvider>
        <TripContextProvider>
          <UserContextProvider>
            <Root />
          </UserContextProvider>
        </TripContextProvider>
      </AuthContextProvider>
    </>
  );
}
