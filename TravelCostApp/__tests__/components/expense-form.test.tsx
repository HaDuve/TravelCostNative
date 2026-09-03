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
  const { Pressable, Text, View } = require("react-native");
  return function MockCurrencyPicker({
    countryValue,
    setCountryValue,
    onChangeValue,
    inputCurrencyCode,
    placeholder,
  }: {
    countryValue?: string;
    setCountryValue?: (value: string) => void;
    onChangeValue?: (value: string | null) => void;
    inputCurrencyCode?: string;
    placeholder?: string;
  }) {
    // Mirror react-native-dropdown-picker: onChangeValue after value changes (not on mount).
    const initializedRef = React.useRef(false);
    React.useEffect(() => {
      if (initializedRef.current) {
        onChangeValue?.(countryValue ?? null);
      } else {
        initializedRef.current = true;
      }
      // Intentionally omit onChangeValue — same as DropDownPicker's [value, items] deps.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countryValue]);

    return React.createElement(
      View,
      null,
      React.createElement(
        Text,
        { testID: "expense-form-currency-value" },
        countryValue ?? placeholder ?? ""
      ),
      React.createElement(
        Text,
        { testID: "expense-form-currency-input" },
        inputCurrencyCode ?? ""
      ),
      React.createElement(Pressable, {
        testID: "expense-form-currency-pick-eur",
        onPress: () => setCountryValue?.("EUR | €"),
      }),
      React.createElement(Pressable, {
        testID: "expense-form-currency-pick-gbp",
        onPress: () => setCountryValue?.("GBP | £"),
      })
    );
  };
});

jest.mock("../../components/Currency/CountryPicker", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");
  return function MockCountryPicker({
    countryValue,
    setCountryValue,
    onChangeValue,
  }: {
    countryValue?: string;
    setCountryValue?: (value: string) => void;
    onChangeValue?: (value: string | null) => void;
  }) {
    const initializedRef = React.useRef(false);
    React.useEffect(() => {
      if (initializedRef.current) {
        onChangeValue?.(countryValue ?? null);
      } else {
        initializedRef.current = true;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [countryValue]);

    return React.createElement(
      View,
      null,
      React.createElement(
        Text,
        { testID: "expense-form-country-picker-value" },
        countryValue ?? ""
      ),
      React.createElement(Pressable, {
        testID: "expense-form-country-pick-de",
        onPress: () => setCountryValue?.("Germany"),
      })
    );
  };
});

import ExpenseForm from "../../components/ManageExpense/ExpenseForm";
import { i18n } from "../../i18n/i18n";
import { makeExpense } from "../fixtures/expense";
import { AppProviders, renderWithAppProviders } from "../fixtures/app-providers";
import { Alert } from "react-native";
import { getExpenseDraft } from "../../store/mmkv";
import type { RenderAPI } from "@testing-library/react-native";

function mockRangedSplitAlert() {
  return jest
    .spyOn(Alert, "alert")
    .mockImplementation((_title, _message, buttons) => {
      const splitButton = buttons?.find(
        (button) => button.text === i18n.t("splitUpExpenses")
      );
      splitButton?.onPress?.();
    });
}

function mockDraftRestoreAlert() {
  return jest
    .spyOn(Alert, "alert")
    .mockImplementation((_title, _message, buttons) => {
      const restoreButton = buttons?.find(
        (button) => button.text === i18n.t("restore")
      );
      restoreButton?.onPress?.();
    });
}

function confirmRangedDateSpan(screen: RenderAPI) {
  fireEvent.press(screen.getByText(i18n.t("showMoreOptions")));
  fireEvent.press(screen.getByTestId("open-date-range"));
  fireEvent.press(screen.getByTestId("confirm-ranged-dates"));
}

async function expectExpenseFormCurrencyInput(
  screen: RenderAPI,
  currency: string
) {
  await waitFor(() => {
    expect(screen.getByTestId("expense-form-currency-input")).toHaveTextContent(
      currency
    );
  });
}

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

function renderNewExpenseWithDeferredLastLocale(
  onSubmit: jest.Mock = jest.fn(async () => {}),
  { hydrateOnMount = true }: { hydrateOnMount?: boolean } = {}
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
    const [hydrate, setHydrate] = React.useState(hydrateOnMount);

    React.useEffect(() => {
      if (!hydrate) return;
      setLastCountry("US");
      setLastCurrency("USD");
    }, [hydrate]);

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
        {React.createElement(require("react-native").Pressable, {
          testID: "hydrate-last-locale",
          onPress: () => setHydrate(true),
        })}
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

    await expectExpenseFormCurrencyInput(screen, "USD");
  });

  it("keeps trip home currency when the user selects it after latest-used currency applied", async () => {
    // Bug: resolveLoadedLastCurrencyIfStale re-runs on currency change and treats
    // selecting EUR (trip default) as still-stale, snapping back to lastCurrency.
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

    fireEvent.press(screen.getByText(i18n.t("showMoreOptions")));
    await expectExpenseFormCurrencyInput(screen, "USD");

    fireEvent.press(screen.getByTestId("expense-form-currency-pick-eur"));

    await expectExpenseFormCurrencyInput(screen, "EUR");

    fireEvent.press(screen.getByTestId("expense-form-currency-pick-gbp"));

    await expectExpenseFormCurrencyInput(screen, "GBP");
  });

  it("keeps trip home currency when the user selects it before lastCurrency loads", async () => {
    const screen = renderNewExpenseWithDeferredLastLocale(jest.fn(async () => {}), {
      hydrateOnMount: false,
    });

    fireEvent.press(screen.getByText(i18n.t("showMoreOptions")));
    fireEvent.press(screen.getByTestId("expense-form-currency-pick-eur"));
    fireEvent.press(screen.getByTestId("hydrate-last-locale"));

    await expectExpenseFormCurrencyInput(screen, "EUR");
  });

  it("keeps trip country when the user selects it after latest-used country applied", async () => {
    const screen = renderNewExpenseForm({
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

    fireEvent.press(screen.getByText(i18n.t("showMoreOptions")));
    await waitFor(() => {
      expect(screen.getByTestId("expense-form-country-flag")).toHaveTextContent(
        "US"
      );
    });

    fireEvent.press(screen.getByTestId("expense-form-country-pick-de"));

    await waitFor(() => {
      expect(screen.getByTestId("expense-form-country-flag")).toHaveTextContent(
        "Germany"
      );
    });
  });

  it("applies latest-used country after secure storage loads on a new expense", async () => {
    const screen = renderNewExpenseWithDeferredLastLocale();

    fireEvent.press(screen.getByText(i18n.t("showMoreOptions")));

    await waitFor(() => {
      expect(screen.getByTestId("expense-form-country-flag")).toHaveTextContent(
        "US"
      );
    });
  });

  it("keeps latest-used country after confirming a ranged date span", async () => {
    const alertSpy = mockRangedSplitAlert();
    const screen = renderNewExpenseWithDeferredLastLocale();

    confirmRangedDateSpan(screen);

    await waitFor(() => {
      expect(screen.getByTestId("expense-form-country-flag")).toHaveTextContent(
        "US"
      );
    });

    alertSpy.mockRestore();
  });

  it("keeps latest-used currency after confirming a ranged date span", async () => {
    const alertSpy = mockRangedSplitAlert();
    const screen = renderNewExpenseWithDeferredLastLocale();

    confirmRangedDateSpan(screen);

    await expectExpenseFormCurrencyInput(screen, "USD");

    alertSpy.mockRestore();
  });

  it("submits latest-used country on advanced save after secure storage loads", async () => {
    jest.useFakeTimers();
    const onSubmit = jest.fn(async () => {});
    const screen = renderNewExpenseWithDeferredLastLocale(onSubmit);

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
    const screen = renderNewExpenseWithDeferredLastLocale(onSubmit);

    fireEvent.press(screen.getByText(i18n.t("showMoreOptions")));

    await expectExpenseFormCurrencyInput(screen, "USD");

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
    const alertSpy = mockRangedSplitAlert();
    const onSubmit = jest.fn(async () => {});
    const screen = renderNewExpenseWithDeferredLastLocale(onSubmit);

    confirmRangedDateSpan(screen);

    await expectExpenseFormCurrencyInput(screen, "USD");

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

    const alertSpy = mockDraftRestoreAlert();
    const screen = renderNewExpenseWithDeferredLastLocale();

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

    const alertSpy = mockDraftRestoreAlert();
    const screen = renderNewExpenseWithDeferredLastLocale();

    fireEvent.press(screen.getByText(i18n.t("showMoreOptions")));

    await expectExpenseFormCurrencyInput(screen, "USD");

    alertSpy.mockRestore();
    (getExpenseDraft as jest.Mock).mockReturnValue(undefined);
  });
});
