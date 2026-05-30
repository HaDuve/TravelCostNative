import * as React from "react";
import { fireEvent, waitFor } from "@testing-library/react-native";

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useFocusEffect: jest.fn(),
  };
});

jest.mock("@react-navigation/elements", () => ({
  useHeaderHeight: () => 0,
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
  NotificationFeedbackType: { Success: "Success" },
}));

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
  hide: jest.fn(),
  default: { show: jest.fn(), hide: jest.fn() },
}));

jest.mock("../../store/mmkv", () => ({
  getExpenseDraft: jest.fn(() => undefined),
  setExpenseDraft: jest.fn(),
  clearExpenseDraft: jest.fn(),
  getExpenseCat: jest.fn(() => undefined),
  clearExpenseCat: jest.fn(),
  getMMKVObject: jest.fn(() => undefined),
  setExpenseCat: jest.fn(),
  getRecentCurrencies: jest.fn(() => []),
  MMKV_KEYS: { CATEGORY_LIST: "categoryList" },
}));

jest.mock("../../store/secure-storage", () => ({
  secureStoreSetItem: jest.fn(async () => {}),
}));

jest.mock("../../util/currencyExchange", () => ({
  getRate: jest.fn(async () => 1),
}));

jest.mock("../../components/UI/DatePickerContainer", () => () => null);
jest.mock("../../components/UI/DatePickerModal", () => () => null);

jest.mock("../../components/Currency/CurrencyPicker", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return function MockCurrencyPicker({
    placeholder,
  }: {
    placeholder?: string;
  }) {
    return React.createElement(Text, null, placeholder ?? "");
  };
});

import ExpenseForm from "../../components/ManageExpense/ExpenseForm";
import { i18n } from "../../i18n/i18n";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";

function renderNewExpenseForm(
  overrides: Parameters<typeof renderWithAppProviders>[1] = {}
) {
  const navigation = { navigate: jest.fn(), pop: jest.fn(), popToTop: jest.fn() };
  return renderWithAppProviders(
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
        travellers: [
          { uid: "u1", userName: "Alice" },
          { uid: "u2", userName: "Bob" },
        ],
        fetchAndSetTravellers: jest.fn(async () => {}),
        ...overrides.trip,
      },
      user: {
        userName: "Alice",
        lastCountry: "DE",
        lastCurrency: "EUR",
        ...overrides.user,
      },
      expenses: {
        expenses: [makeExpense({ id: "e1", calcAmount: 75 })],
        isSyncing: false,
        updateExpenseId: undefined,
        getRecentExpenses: () => [makeExpense({ id: "e1", calcAmount: 75 })],
        loadExpensesFromStorage: jest.fn(async () => {}),
        ...overrides.expenses,
      },
    }
  );
}

describe("ExpenseForm", () => {
  it("renders when ManageExpense passes no defaultValues for a new expense", async () => {
    const navigation = {
      navigate: jest.fn(),
      pop: jest.fn(),
      popToTop: jest.fn(),
    };
    const screen = renderWithAppProviders(
      <ExpenseForm
        onCancel={jest.fn()}
        onSubmit={jest.fn(async () => {})}
        submitButtonLabel={i18n.t("add")}
        isEditing={false}
        defaultValues={undefined as unknown as ReturnType<typeof makeExpense>}
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
        user: { userName: "Alice", lastCurrency: "USD", lastCountry: "US" },
      }
    );

    await waitFor(() => {
      expect(screen.getByText(i18n.t("add"))).toBeTruthy();
    });
  });

  it("renders add-expense actions for a new expense", async () => {
    const screen = renderNewExpenseForm();

    await waitFor(() => {
      expect(screen.getByText(i18n.t("add"))).toBeTruthy();
      expect(screen.getByText(i18n.t("cancel"))).toBeTruthy();
    });
  });

  it("defaults new expense currency to latest-used currency instead of trip home currency", async () => {
    const screen = renderNewExpenseForm({
      trip: {
        tripid: "t1",
        tripCurrency: "EUR",
        travellers: [
          { uid: "u1", userName: "Alice" },
          { uid: "u2", userName: "Bob" },
        ],
        fetchAndSetTravellers: jest.fn(async () => {}),
      },
      user: {
        userName: "Alice",
        lastCountry: "US",
        lastCurrency: "USD",
      },
      expenses: {
        expenses: [
          makeExpense({
            id: "e1",
            currency: "EUR",
            country: "DE",
            calcAmount: 75,
          }),
        ],
        isSyncing: false,
        updateExpenseId: undefined,
        getRecentExpenses: () => [
          makeExpense({
            id: "e1",
            currency: "EUR",
            country: "DE",
            calcAmount: 75,
          }),
        ],
        loadExpensesFromStorage: jest.fn(async () => {}),
      },
    });

    await waitFor(() => {
      expect(screen.getByText(i18n.t("add"))).toBeTruthy();
    });

    fireEvent.press(screen.getByText(i18n.t("showMoreOptions")));

    await waitFor(() => {
      expect(screen.getByText("USD | $")).toBeTruthy();
    });
  });
});
