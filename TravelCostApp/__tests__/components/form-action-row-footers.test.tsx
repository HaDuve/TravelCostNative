import * as React from "react";
import { StyleSheet } from "react-native";
import { within } from "@testing-library/react-native";

jest.mock("../../util/http", () => ({
  storeTrip: jest.fn(),
  storeTripHistory: jest.fn(),
  updateUser: jest.fn(),
  fetchTrip: jest.fn(async () => ({
    tripName: "Beach budget",
    tripCurrency: "EUR",
    dailyBudget: "0",
    totalBudget: "0",
    isDynamicDailyBudget: false,
    travellers: [],
  })),
  updateTripHistory: jest.fn(),
  updateTrip: jest.fn(),
  getAllExpenses: jest.fn(async () => []),
  getTravellers: jest.fn(async () => [{ uid: "u1", userName: "Alice" }]),
  putTravelerInTrip: jest.fn(),
  deleteTrip: jest.fn(),
}));

jest.mock("../../util/connectionSpeed", () => ({
  isConnectionFastEnough: jest.fn(async () => true),
  isConnectionFastEnoughAsBool: jest.fn(async () => true),
}));

jest.mock("../../util/activate-trip", () => ({
  activateTrip: jest.fn(async () => {}),
}));

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn(), hide: jest.fn() },
}));

jest.mock("@react-navigation/elements", () => ({
  useHeaderHeight: () => 0,
}));

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useFocusEffect: jest.fn(),
  };
});

jest.mock("../../components/Currency/CurrencyPicker", () => () => null);
jest.mock("../../components/UI/DatePickerModal", () => () => null);
jest.mock("../../components/UI/DatePickerContainer", () => () => null);

jest.mock("../../store/mmkv", () => ({
  getExpenseDraft: jest.fn(() => undefined),
  setExpenseDraft: jest.fn(),
  clearExpenseDraft: jest.fn(),
  getExpenseCat: jest.fn(() => undefined),
  clearExpenseCat: jest.fn(),
  getMMKVObject: jest.fn(() => undefined),
  setExpenseCat: jest.fn(),
  MMKV_KEYS: { CATEGORY_LIST: "categoryList", EXPENSES: "expenses" },
}));

jest.mock("../../store/secure-storage", () => ({
  secureStoreGetItem: jest.fn(async () => "u1"),
  secureStoreSetItem: jest.fn(async () => {}),
}));

jest.mock("../../util/currencyExchange", () => ({
  getRate: jest.fn(async () => 1),
}));

jest.mock("../../components/Premium/PremiumConstants", () => ({
  isPremiumMember: jest.fn(async () => true),
  ENTITLEMENT_ID: "premium",
}));

import TripForm from "../../components/ManageTrip/TripForm";
import ExpenseForm from "../../components/ManageExpense/ExpenseForm";
import JoinTrip from "../../screens/JoinTrip";
import { i18n } from "../../i18n/i18n";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { makeExpense } from "../fixtures/expense";

const navigation = {
  navigate: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
};

function stackActionTestIds(stack: ReturnType<typeof renderWithAppProviders>) {
  const stackNode = stack.getByTestId("action-row-stack");
  return React.Children.toArray(stackNode.props.children).map(
    (child: React.ReactElement) => child.props.testID
  );
}

function rowShowsChevron(
  screen: ReturnType<typeof renderWithAppProviders>,
  testID: string
) {
  const row = screen.getByTestId(testID);
  return within(row).queryAllByText("›").length > 0;
}

describe("form ActionRow footers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("TripForm", () => {
    it("stacks primary confirm above cancel in the footer", () => {
      const screen = renderWithAppProviders(
        <TripForm navigation={navigation} route={{ params: {} }} />,
        {
          network: { isConnected: true, strongConnection: true },
          expenses: { expenses: [] },
        }
      );

      expect(stackActionTestIds(screen)).toEqual([
        "trip-form-confirm",
        "trip-form-cancel",
      ]);
    });

    it("hides chevrons on footer commits", () => {
      const screen = renderWithAppProviders(
        <TripForm navigation={navigation} route={{ params: {} }} />,
        {
          network: { isConnected: true, strongConnection: true },
          expenses: { expenses: [] },
        }
      );

      expect(rowShowsChevron(screen, "trip-form-confirm")).toBe(false);
      expect(rowShowsChevron(screen, "trip-form-cancel")).toBe(false);
    });

    it("shows join budget as a header navigation row with chevron", () => {
      const screen = renderWithAppProviders(
        <TripForm navigation={navigation} route={{ params: {} }} />,
        {
          network: { isConnected: true, strongConnection: true },
          expenses: { expenses: [] },
        }
      );

      expect(screen.getByTestId("trip-form-join")).toBeTruthy();
      expect(rowShowsChevron(screen, "trip-form-join")).toBe(true);
    });
  });

  describe("ExpenseForm", () => {
    it("stacks primary submit above cancel in the footer", async () => {
      const screen = renderWithAppProviders(
        <ExpenseForm
          onCancel={jest.fn()}
          onSubmit={jest.fn(async () => {})}
          submitButtonLabel={i18n.t("add")}
          isEditing={false}
          defaultValues={makeExpense({
            amount: 0,
            description: "",
            whoPaid: "",
            splitList: [],
            listEQUAL: [],
          })}
          pickedCat="food"
          navigation={navigation as any}
          editedExpenseId="TEMP_EXPENSE_ID"
          newCat={false}
          iconName="food"
          dateISO=""
        />,
        {
          trip: {
            tripid: "t1",
            tripCurrency: "EUR",
            travellers: [{ uid: "u1", userName: "Alice" }],
            fetchAndSetTravellers: jest.fn(async () => {}),
          },
          user: { userName: "Alice", lastCurrency: "EUR", lastCountry: "DE" },
        }
      );

      expect(stackActionTestIds(screen)).toEqual([
        "expense-form-submit",
        "expense-form-cancel",
      ]);
    });

    it("hides chevrons on footer commits", async () => {
      const screen = renderWithAppProviders(
        <ExpenseForm
          onCancel={jest.fn()}
          onSubmit={jest.fn(async () => {})}
          submitButtonLabel={i18n.t("add")}
          isEditing={false}
          defaultValues={makeExpense({
            amount: 0,
            description: "",
            whoPaid: "",
            splitList: [],
            listEQUAL: [],
          })}
          pickedCat="food"
          navigation={navigation as any}
          editedExpenseId="TEMP_EXPENSE_ID"
          newCat={false}
          iconName="food"
          dateISO=""
        />,
        {
          trip: {
            tripid: "t1",
            tripCurrency: "EUR",
            travellers: [{ uid: "u1", userName: "Alice" }],
            fetchAndSetTravellers: jest.fn(async () => {}),
          },
          user: { userName: "Alice", lastCurrency: "EUR", lastCountry: "DE" },
        }
      );

      expect(rowShowsChevron(screen, "expense-form-submit")).toBe(false);
      expect(rowShowsChevron(screen, "expense-form-cancel")).toBe(false);
    });

    it("shows contextual local price hint when product and country are set", () => {
      const screen = renderWithAppProviders(
        <ExpenseForm
          onCancel={jest.fn()}
          onSubmit={jest.fn(async () => {})}
          submitButtonLabel={i18n.t("update")}
          isEditing
          defaultValues={makeExpense({
            amount: 0,
            description: "Coffee",
            country: "Germany",
            currency: "EUR",
            whoPaid: "Alice",
            splitList: [{ userName: "Alice", amount: 0 }],
          })}
          pickedCat="food"
          navigation={navigation as any}
          editedExpenseId="e1"
          newCat={false}
          iconName="food"
          dateISO=""
        />,
        {
          trip: {
            tripid: "t1",
            tripCurrency: "EUR",
            travellers: [{ uid: "u1", userName: "Alice" }],
            fetchAndSetTravellers: jest.fn(async () => {}),
          },
          user: { userName: "Alice", lastCurrency: "EUR", lastCountry: "DE" },
        }
      );

      expect(screen.getByTestId("expense-form-get-local-price")).toBeTruthy();
      expect(
        screen.getByText('Get local price for "Coffee" in Germany')
      ).toBeTruthy();
      expect(rowShowsChevron(screen, "expense-form-get-local-price")).toBe(
        false
      );
    });
  });

  describe("JoinTrip", () => {
    it("stacks primary confirm above cancel when a budget is loaded", async () => {
      const screen = renderWithAppProviders(
        <JoinTrip navigation={navigation} route={{ params: { id: "t-beach" } }} />,
        {
          network: { isConnected: true, strongConnection: true },
          auth: { uid: "u1" },
          user: {
            userName: "Alice",
            freshlyCreated: false,
            tripHistory: [],
            setTripHistory: jest.fn(),
            loadCatListFromAsyncInCtx: jest.fn(async () => {}),
          },
          trip: {
            tripid: "t-other",
            getcurrentTrip: jest.fn(() => ({ tripid: "t-other" })),
            setCurrentTrip: jest.fn(async () => {}),
            saveTripDataInStorage: jest.fn(async () => {}),
            saveTravellersInStorage: jest.fn(async () => {}),
          },
          expenses: { expenses: [], setExpenses: jest.fn() },
        }
      );

      expect(await screen.findByTestId("join-trip-confirm")).toBeTruthy();

      const tree = JSON.stringify(screen.toJSON());
      expect(tree.indexOf('"testID":"join-trip-confirm"')).toBeLessThan(
        tree.indexOf('"testID":"join-trip-cancel"')
      );
    });

    it("shows a labeled cancel row with a back icon at full width", async () => {
      const screen = renderWithAppProviders(
        <JoinTrip navigation={navigation} route={{ params: {} }} />,
        {
          network: { isConnected: true, strongConnection: true },
        }
      );

      const cancelRow = await screen.findByTestId("join-trip-cancel");
      expect(within(cancelRow).getByText(i18n.t("cancel"))).toBeTruthy();
      expect(
        StyleSheet.flatten(cancelRow.props.style).alignSelf
      ).toBe("stretch");
    });

    it("hides chevrons on join and cancel commits", async () => {
      const screen = renderWithAppProviders(
        <JoinTrip navigation={navigation} route={{ params: { id: "t-beach" } }} />,
        {
          network: { isConnected: true, strongConnection: true },
          auth: { uid: "u1" },
          user: {
            userName: "Alice",
            freshlyCreated: false,
            tripHistory: [],
            setTripHistory: jest.fn(),
            loadCatListFromAsyncInCtx: jest.fn(async () => {}),
          },
          trip: {
            tripid: "t-other",
            getcurrentTrip: jest.fn(() => ({ tripid: "t-other" })),
            setCurrentTrip: jest.fn(async () => {}),
            saveTripDataInStorage: jest.fn(async () => {}),
            saveTravellersInStorage: jest.fn(async () => {}),
          },
          expenses: { expenses: [], setExpenses: jest.fn() },
        }
      );

      expect(await screen.findByTestId("join-trip-confirm")).toBeTruthy();
      expect(rowShowsChevron(screen, "join-trip-confirm")).toBe(false);
      expect(rowShowsChevron(screen, "join-trip-cancel")).toBe(false);
    });
  });
});
