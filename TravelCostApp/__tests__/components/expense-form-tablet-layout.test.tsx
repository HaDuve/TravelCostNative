import * as React from "react";
import { Dimensions, StyleSheet, TextInput } from "react-native";
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
  MMKV_KEYS: { CATEGORY_LIST: "categoryList" },
}));

jest.mock("../../store/secure-storage", () => ({
  secureStoreSetItem: jest.fn(async () => {}),
}));

jest.mock("../../util/currencyExchange", () => ({
  getRate: jest.fn(async () => 1),
}));

jest.mock("../../components/Premium/PremiumConstants", () => ({
  isPremiumMember: jest.fn(async () => true),
  ENTITLEMENT_ID: "premium",
}));

jest.mock("../../components/UI/DatePickerContainer", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return function MockDatePickerContainer() {
    return React.createElement(Text, { testID: "expense-form-date" }, "date");
  };
});

jest.mock("../../components/UI/DatePickerModal", () => () => null);

jest.mock("../../components/ExpensesOutput/ExpenseCountryFlag", () => () => null);
jest.mock("../../components/Currency/CurrencyPicker", () => () => null);
jest.mock("../../components/UI/BackButton", () => {
  const React = require("react");
  const { View } = require("react-native");
  return function MockBackButton() {
    return React.createElement(View, { testID: "expense-form-back" });
  };
});

jest.mock("../../components/Currency/CountryPicker", () => () => null);

import ExpenseForm from "../../components/ManageExpense/ExpenseForm";
import LayoutContextProvider from "../../store/layout-context";
import { i18n } from "../../i18n/i18n";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";

function renderExpenseFormAt(width: number, height: number) {
  jest.spyOn(Dimensions, "get").mockReturnValue({
    width,
    height,
    scale: 3,
    fontScale: 1,
  });

  const navigation = { navigate: jest.fn(), pop: jest.fn(), popToTop: jest.fn() };

  return renderWithAppProviders(
    <LayoutContextProvider>
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
      />
    </LayoutContextProvider>,
    {
      wrapNavigation: false,
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
        lastCountry: "DE",
        lastCurrency: "EUR",
      },
    }
  );
}

describe("ExpenseForm tablet layout", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("uses a single column grid in portrait on tablet widths", async () => {
    const screen = renderExpenseFormAt(768, 1024);

    await waitFor(() => {
      expect(screen.getByTestId("expense-form-grid")).toBeTruthy();
    });

    expect(screen.queryAllByTestId("responsive-grid-column")).toHaveLength(0);
  });

  it("splits advanced fields into two columns in landscape", async () => {
    const screen = renderExpenseFormAt(1024, 768);

    await waitFor(() => {
      expect(screen.getByText(i18n.t("add"))).toBeTruthy();
    });

    fireEvent.press(screen.getByText(i18n.t("showMoreOptions")));
    fireEvent.changeText(screen.UNSAFE_getAllByType(TextInput)[0], "12");

    await waitFor(() => {
      expect(screen.getAllByTestId("responsive-grid-column")).toHaveLength(2);
    });

    expect(screen.getByTestId("expense-form-field-amount")).toBeTruthy();
    expect(screen.getByTestId("expense-form-field-date")).toBeTruthy();
    expect(screen.getByTestId("expense-form-field-country")).toBeTruthy();
    expect(screen.getByTestId("expense-form-field-who-paid")).toBeTruthy();
  });

  it("constrains submit actions on wide viewports", async () => {
    const screen = renderExpenseFormAt(1024, 768);

    await waitFor(() => {
      expect(screen.getByTestId("action-row-stack-frame")).toBeTruthy();
    });

    const frameStyle = StyleSheet.flatten(
      screen.getByTestId("action-row-stack-frame").props.style
    ) as Record<string, unknown>;

    expect(frameStyle.maxWidth).toBe(480);
    expect(frameStyle.alignSelf).toBe("center");
  });
});
