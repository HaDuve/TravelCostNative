import { StatusBar } from "expo-status-bar";
import { useContext, useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as Linking from "expo-linking";
import { Alert, Text } from "react-native";
import AppLoading from "expo-app-loading";
import SignupScreen from "./screens/SignupScreen";
import LoginScreen from "./screens/LoginScreen";

import ManageExpense from "./screens/ManageExpense";
import RecentExpenses from "./screens/RecentExpenses";
import { GlobalStyles } from "./constants/styles";
import IconButton from "./components/UI/IconButton";
import AuthContextProvider, { AuthContext } from "./store/auth-context";
import ExpensesContextProvider, {
  ExpensesContext,
} from "./store/expenses-context";
import ProfileScreen from "./screens/ProfileScreen";
import UserContextProvider, { UserContext } from "./store/user-context";
import { fetchUser } from "./util/http";
import TripContextProvider, { TripContext } from "./store/trip-context";
import TripForm from "./components/ManageTrip/TripForm";
import OnboardingScreen from "./screens/OnboardingScreen";
import JoinTrip from "./screens/JoinTrip";
import ShareTripButton from "./components/ProfileOutput/ShareTrip";
import OverviewScreen from "./screens/OverviewScreen";
import CategoryPickScreen from "./screens/CategoryPickScreen";

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const BottomTabs = createBottomTabNavigator();

const prefix = Linking.createURL("/");

function NotAuthenticatedStack() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        headerTintColor: "black",
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
            headerTintColor: "white",
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

function Home(authCtx) {
  const UserCtx = useContext(UserContext);
  const FreshlyCreated = UserCtx.freshlyCreated;
  const FirstScreen = FreshlyCreated ? "Profile" : "RecentExpenses";
  return (
    <BottomTabs.Navigator
      initialRouteName="Profile"
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: GlobalStyles.colors.primary500 },
        headerTintColor: "white",
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
            tabBarLabel: "",
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
            tabBarLabel: "",
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
          tabBarLabel: "",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </BottomTabs.Navigator>
  );
}

function Root() {
  const [isTryingLogin, setIsTryingLogin] = useState(true);

  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);

  useEffect(() => {
    async function onRootMount() {
      // DEBUG: if we ever want to clear all memory
      // await AsyncStorage.clear();

      // fetch token and trip
      const storedToken = await AsyncStorage.getItem("token");
      const storedUid = await AsyncStorage.getItem("uid");
      const storedTripId = await AsyncStorage.getItem("currentTripId");

      console.log("onRootMount ~ storedToken", storedToken);
      console.log("onRootMount ~ storedUid", storedUid);
      console.log("onRootMount ~ storedTripId", storedTripId);

      if (storedToken) {
        authCtx.setUserID(storedUid);
        try {
          const response = await fetchUser(storedUid);
          if (response) {
            userCtx.addUser(response);
            console.log("onRootMount ~ response.data", response);
            Alert.alert(`user wurde geadded. username: ${userCtx.userName}`);
          }
        } catch (error) {
          Alert.alert(error);
        }
        if (storedTripId) {
          tripCtx.fetchCurrentTrip(storedTripId);
          tripCtx.setCurrentTravellers(storedTripId);
        }
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
