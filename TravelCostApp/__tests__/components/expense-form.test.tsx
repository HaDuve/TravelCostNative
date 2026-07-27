import * as React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";

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
  const { Pressable, Text } = require("react-native");
  return function MockDatePickerContainer({
    openDatePickerRange,
  }: {
    openDatePickerRange?: () => void;
  }) {
    return React.createElement(
      Pressable,
      { testID: "open-date-range", onPress: openDatePickerRange },
      React.createElement(Text, null, "open-range")
    );
  };
});

jest.mock("../../components/UI/DatePickerModal", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return function MockDatePickerModal({
    onConfirmRange,
  }: {
    onConfirmRange?: (expenseOut: {
      startDate: Date;
      endDate: Date;
    }) => void;
  }) {
    return React.createElement(
      Pressable,
      {
        testID: "confirm-ranged-dates",
        onPress: () =>
          onConfirmRange?.({
            startDate: new Date("2026-01-15T12:00:00.000Z"),
            endDate: new Date("2026-01-20T12:00:00.000Z"),
          }),
      },
      React.createElement(Text, null, "confirm-range")
    );
  };
});

jest.mock("../../components/ExpensesOutput/ExpenseCountryFlag", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return function MockExpenseCountryFlag({
    countryName,
  }: {
    countryName?: string;
  }) {
    return React.createElement(
      Text,
      { testID: "expense-form-country-flag" },
      countryName ?? ""
    );
  };
});

jest.mock("../../components/Currency/CurrencyPicker", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return function MockCurrencyPicker({
    countryValue,
    placeholder,
  }: {
    countryValue?: string;
    placeholder?: string;
  }) {
    return React.createElement(
      Text,
      { testID: "expense-form-currency-value" },
      countryValue ?? placeholder ?? ""
    );
  };
});

import ExpenseForm from "../../components/ManageExpense/ExpenseForm";
import { i18n } from "../../i18n/i18n";
import { makeExpense } from "../fixtures/expense";
import { AppProviders, renderWithAppProviders } from "../fixtures/app-providers";
import { Alert } from "react-native";
import { getExpenseDraft } from "../../store/mmkv";

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
        travellers: ["Alice", "Bob"],
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

function renderNewExpenseWithDeferredLastCountry(
  onSubmit: jest.Mock = jest.fn(async () => {})
) {
  const navigation = {
    navigate: jest.fn(),
    pop: jest.fn(),
    popToTop: jest.fn(),
  };
  const tripExpense = makeExpense({
    id: "e1",
    currency: "EUR",
    country: "DE",
    calcAmount: 75,
  });

  function Host() {
    const [lastCountry, setLastCountry] = React.useState("");
    const [lastCurrency, setLastCurrency] = React.useState("");

    React.useEffect(() => {
      setLastCountry("US");
      setLastCurrency("USD");
    }, []);

    return (
      <AppProviders
        overrides={{
          trip: {
            tripid: "t1",
            tripCurrency: "EUR",
            travellers: ["Alice", "Bob"],
            fetchAndSetTravellers: jest.fn(async () => {}),
          },
          user: {
            userName: "Alice",
            lastCountry,
            lastCurrency,
            setLastCountry: jest.fn(),
            setLastCurrency: jest.fn(),
            setPeriodString: jest.fn(),
            isSendingOfflineQueueMutex: false,
            setIsSendingOfflineQueueMutex: jest.fn(),
          },
          expenses: {
            expenses: [tripExpense],
            isSyncing: false,
            updateExpenseId: undefined,
            getRecentExpenses: () => [tripExpense],
            loadExpensesFromStorage: jest.fn(async () => {}),
          },
        }}
      >
        <ExpenseForm
          onCancel={jest.fn()}
          onSubmit={onSubmit}
          submitButtonLabel={i18n.t("add")}
          isEditing={false}
          defaultValues={makeExpense({
            amount: 25,
            description: "Hotel stay",
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
      </AppProviders>
    );
  }

  return render(<Host />);
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
          travellers: ["Alice"],
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
        travellers: ["Alice", "Bob"],
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
      expect(screen.getByTestId("expense-form-currency-value")).toHaveTextContent(
        "USD"
      );
    });
  });

  it("applies latest-used country after secure storage loads on a new expense", async () => {
    const screen = renderNewExpenseWithDeferredLastCountry();

    fireEvent.press(screen.getByText(i18n.t("showMoreOptions")));

    await waitFor(() => {
      expect(screen.getByTestId("expense-form-country-flag")).toHaveTextContent(
        "US"
      );
    });
  });

  it("keeps latest-used country after confirming a ranged date span", async () => {
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        const splitButton = buttons?.find(
          (button) => button.text === i18n.t("splitUpExpenses")
        );
        splitButton?.onPress?.();
      });

    const screen = renderNewExpenseWithDeferredLastCountry();

    fireEvent.press(screen.getByText(i18n.t("showMoreOptions")));
    fireEvent.press(screen.getByTestId("open-date-range"));
    fireEvent.press(screen.getByTestId("confirm-ranged-dates"));

    await waitFor(() => {
      expect(screen.getByTestId("expense-form-country-flag")).toHaveTextContent(
        "US"
      );
    });

    alertSpy.mockRestore();
  });

  it("keeps latest-used currency after confirming a ranged date span", async () => {
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        const splitButton = buttons?.find(
          (button) => button.text === i18n.t("splitUpExpenses")
        );
        splitButton?.onPress?.();
      });

    const screen = renderNewExpenseWithDeferredLastCountry();

    fireEvent.press(screen.getByText(i18n.t("showMoreOptions")));
    fireEvent.press(screen.getByTestId("open-date-range"));
    fireEvent.press(screen.getByTestId("confirm-ranged-dates"));

    await waitFor(() => {
      expect(
        screen.getByTestId("expense-form-currency-value")
      ).toHaveTextContent("USD");
    });

    alertSpy.mockRestore();
  });

  it("submits latest-used country on advanced save after secure storage loads", async () => {
    jest.useFakeTimers();
    const onSubmit = jest.fn(async () => {});
    const screen = renderNewExpenseWithDeferredLastCountry(onSubmit);

    fireEvent.press(screen.getByText(i18n.t("showMoreOptions")));

    await waitFor(() => {
      expect(screen.getByTestId("expense-form-country-flag")).toHaveTextContent(
        "US"
      );
    });

    await act(async () => {
      fireEvent.press(screen.getAllByText(i18n.t("add")).pop()!);
      jest.advanceTimersByTime(600);
    });

    expect(onSubmit).toHaveBeenCalled();
    expect(onSubmit.mock.calls[0][0].country).toBe("US");
    jest.useRealTimers();
  });

  it("submits latest-used currency on advanced save after secure storage loads", async () => {
    jest.useFakeTimers();
    const onSubmit = jest.fn(async () => {});
    const screen = renderNewExpenseWithDeferredLastCountry(onSubmit);

    fireEvent.press(screen.getByText(i18n.t("showMoreOptions")));

    await waitFor(() => {
      expect(
        screen.getByTestId("expense-form-currency-value")
      ).toHaveTextContent("USD");
    });

    await act(async () => {
      fireEvent.press(screen.getAllByText(i18n.t("add")).pop()!);
      jest.advanceTimersByTime(600);
    });

    expect(onSubmit).toHaveBeenCalled();
    expect(onSubmit.mock.calls[0][0].currency).toBe("USD");
    jest.useRealTimers();
  });

  it("submits latest-used currency after confirming a ranged date span", async () => {
    jest.useFakeTimers();
    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        const splitButton = buttons?.find(
          (button) => button.text === i18n.t("splitUpExpenses")
        );
        splitButton?.onPress?.();
      });
    const onSubmit = jest.fn(async () => {});
    const screen = renderNewExpenseWithDeferredLastCountry(onSubmit);

    fireEvent.press(screen.getByText(i18n.t("showMoreOptions")));
    fireEvent.press(screen.getByTestId("open-date-range"));
    fireEvent.press(screen.getByTestId("confirm-ranged-dates"));

    await waitFor(() => {
      expect(
        screen.getByTestId("expense-form-currency-value")
      ).toHaveTextContent("USD");
    });

    await act(async () => {
      fireEvent.press(screen.getAllByText(i18n.t("add")).pop()!);
      jest.advanceTimersByTime(600);
    });

    expect(onSubmit).toHaveBeenCalled();
    expect(onSubmit.mock.calls[0][0].currency).toBe("USD");

    alertSpy.mockRestore();
    jest.useRealTimers();
  });

  it("applies latest-used country after restoring a draft with an empty country", async () => {
    const draftExpense = makeExpense({
      amount: 25,
      description: "Hotel stay",
      country: "",
      currency: "EUR",
    });
    (getExpenseDraft as jest.Mock).mockReturnValue(draftExpense);

    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        const restoreButton = buttons?.find(
          (button) => button.text === i18n.t("restore")
        );
        restoreButton?.onPress?.();
      });

    const screen = renderNewExpenseWithDeferredLastCountry();

    fireEvent.press(screen.getByText(i18n.t("showMoreOptions")));

    await waitFor(() => {
      expect(screen.getByTestId("expense-form-country-flag")).toHaveTextContent(
        "US"
      );
    });

    alertSpy.mockRestore();
    (getExpenseDraft as jest.Mock).mockReturnValue(undefined);
  });

  it("applies latest-used currency after restoring a draft with an empty currency", async () => {
    const draftExpense = makeExpense({
      amount: 25,
      description: "Hotel stay",
      country: "DE",
      currency: "",
    });
    (getExpenseDraft as jest.Mock).mockReturnValue(draftExpense);

    const alertSpy = jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _message, buttons) => {
        const restoreButton = buttons?.find(
          (button) => button.text === i18n.t("restore")
        );
        restoreButton?.onPress?.();
      });

    const screen = renderNewExpenseWithDeferredLastCountry();

    fireEvent.press(screen.getByText(i18n.t("showMoreOptions")));

    await waitFor(() => {
      expect(
        screen.getByTestId("expense-form-currency-value")
      ).toHaveTextContent("USD");
    });

    alertSpy.mockRestore();
    (getExpenseDraft as jest.Mock).mockReturnValue(undefined);
  });
});
