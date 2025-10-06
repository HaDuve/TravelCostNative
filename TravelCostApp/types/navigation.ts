import {
  MaterialTopTabNavigationProp,
  MaterialTopTabScreenProps,
} from "@react-navigation/material-top-tabs";
import { NavigatorScreenParams } from "@react-navigation/native";
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";

// Root Stack Navigator Types
export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Login: undefined;
  Signup: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  Join: { id: string };
  Paywall: undefined;
  Profile: undefined;
  ManageExpense: {
    expenseId?: string;
    pickedCat?: string;
    dateISO?: string;
    newCat?: string;
    iconName?: string;
  };
  FilteredExpenses: {
    expenses: any[];
    dayString: string;
    noList?: boolean;
  };
  FilteredPieCharts: {
    expenses: any[];
    dayString: string;
    noList?: boolean;
  };
  TripSummary: {
    tripid: string;
  };
  SplitSummary: {
    tripid: string;
  };
  CategoryPick: undefined;
  ManageCategory: undefined;
  ManageTrip: {
    tripId?: string;
    trips?: any;
  };
  Financial: undefined;
  Finder: undefined;
  RecentExpenses: undefined;
  Push: undefined;
  Changelog: undefined;
  Customer: undefined;
  ChatGPTDeal: undefined;
  Rating: undefined;
};

// Main Tab Navigator Types
export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Overview: undefined;
  Profile: undefined;
};

// Home Stack Navigator Types
export type HomeStackParamList = {
  RecentExpenses: undefined;
  Overview: undefined;
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  MaterialTopTabScreenProps<MainTabParamList, T>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  NativeStackScreenProps<HomeStackParamList, T>;

// Navigation Prop Types - Using correct navigator types that include all methods
export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type MainTabNavigationProp =
  MaterialTopTabNavigationProp<MainTabParamList>;
export type HomeStackNavigationProp =
  NativeStackNavigationProp<HomeStackParamList>;

// Route Prop Types
export type RootRouteProp<T extends keyof RootStackParamList> =
  RootStackScreenProps<T>["route"];
export type MainTabRouteProp<T extends keyof MainTabParamList> =
  MainTabScreenProps<T>["route"];
export type HomeStackRouteProp<T extends keyof HomeStackParamList> =
  HomeStackScreenProps<T>["route"];

// Note: NativeStackNavigationProp already includes all methods:
// - navigate(), goBack(), reset(), push()
// - replace() ✅, pop(count?) ✅, popToTop() ✅
// No manual extensions needed!

// Linking Configuration Type
export interface LinkingConfig {
  prefixes: string[];
  config: {
    screens: {
      Join: {
        path: string;
        parse: {
          id: (id: string) => string;
        };
      };
      Home: {
        screens: {
          RecentExpenses: string;
        };
      };
    };
  };
}
