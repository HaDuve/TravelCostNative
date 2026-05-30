import * as React from "react";
import { StyleSheet } from "react-native";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light", Heavy: "Heavy" },
}));

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("rn-tourguide", () => ({
  TourGuideZone: ({ children }: { children?: React.ReactNode }) => children ?? null,
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

import { fireEvent } from "@testing-library/react-native";
import { Modal } from "react-native";

import { i18n } from "../../i18n/i18n";
import { VexoEvents } from "../../util/vexo-constants";
import { trackEvent } from "../../util/vexo-tracking";
import AddExpenseButton from "../../components/ManageExpense/AddExpenseButton";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { assertSolidBackgroundForShadow } from "../../util/shadow-styles";

function renderAddExpenseButtonWithTemplate(
  templateExpense = makeExpense({
    id: "e-template",
    description: "Coffee shop",
    amount: 42,
    calcAmount: 42,
    editedTimestamp: 2,
  })
) {
  const navigation = { navigate: jest.fn() };
  const screen = renderWithAppProviders(
    <AddExpenseButton navigation={navigation} />,
    {
      wrapNavigation: false,
      settings: {
        settings: {
          showFlags: true,
          showWhoPaid: true,
        },
      },
      expenses: {
        expenses: [templateExpense],
        getRecentExpenses: () => [templateExpense],
      },
    }
  );

  return { screen, navigation, templateExpense };
}

describe("AddExpenseButton", () => {
  beforeEach(() => {
    (trackEvent as jest.Mock).mockClear();
  });

  it("opens the template expense modal on long press with a ledger-style row", () => {
    const { screen, templateExpense } = renderAddExpenseButtonWithTemplate();

    fireEvent(screen.getByTestId("add-expense-fab"), "longPress");

    expect(screen.getByTestId("expense-template-picker-modal")).toBeTruthy();
    expect(screen.getByText(templateExpense.description)).toBeTruthy();
    expect(screen.getByText(/42/)).toBeTruthy();
    expect(screen.getByText(i18n.t("templateExpenses"))).toBeTruthy();
    expect(screen.getAllByTestId("expense-item-traveller-avatar").length).toBeGreaterThan(
      0
    );
  });

  it("shows a long template description in the modal", () => {
    const longDescription = "Airport lounge breakfast with the team";
    const { screen } = renderAddExpenseButtonWithTemplate(
      makeExpense({
        id: "e-template",
        description: longDescription,
        amount: 42,
        calcAmount: 42,
        editedTimestamp: 2,
      })
    );

    fireEvent(screen.getByTestId("add-expense-fab"), "longPress");

    expect(screen.getByText(longDescription)).toBeTruthy();
  });

  it("shows template descriptions on a narrow screen", () => {
    const useWindowDimensionsSpy = jest
      .spyOn(require("react-native"), "useWindowDimensions")
      .mockReturnValue({ width: 320, height: 600, scale: 2, fontScale: 1 });

    const { screen, templateExpense } = renderAddExpenseButtonWithTemplate();
    fireEvent(screen.getByTestId("add-expense-fab"), "longPress");

    expect(screen.getByText(templateExpense.description)).toBeTruthy();

    useWindowDimensionsSpy.mockRestore();
  });

  it("opens template help from the info button", () => {
    const { screen } = renderAddExpenseButtonWithTemplate();

    fireEvent(screen.getByTestId("add-expense-fab"), "longPress");
    fireEvent.press(screen.getByTestId("expense-template-picker-info"));

    expect(screen.getByTestId("expense-template-help-modal")).toBeTruthy();
    expect(screen.getByText(i18n.t("templateExpensesHelpTitle"))).toBeTruthy();
    expect(
      screen.getByText(i18n.t("templateExpensesHelpText"), { exact: false })
    ).toBeTruthy();
    expect(screen.getByTestId("expense-template-picker-modal")).toBeTruthy();
  });

  it("dismisses template help via confirm and keeps the picker open", () => {
    const { screen, templateExpense } = renderAddExpenseButtonWithTemplate();

    fireEvent(screen.getByTestId("add-expense-fab"), "longPress");
    fireEvent.press(screen.getByTestId("expense-template-picker-info"));
    fireEvent.press(screen.getByText(i18n.t("confirm")));

    expect(screen.queryByTestId("expense-template-help-modal")).toBeNull();
    expect(screen.getByTestId("expense-template-picker-modal")).toBeTruthy();
    expect(screen.getByText(templateExpense.description)).toBeTruthy();
  });

  it("dismisses template help via backdrop and keeps the picker open", () => {
    const { screen, templateExpense } = renderAddExpenseButtonWithTemplate();

    fireEvent(screen.getByTestId("add-expense-fab"), "longPress");
    fireEvent.press(screen.getByTestId("expense-template-picker-info"));
    fireEvent.press(screen.getByTestId("expense-template-help-backdrop"));

    expect(screen.queryByTestId("expense-template-help-modal")).toBeNull();
    expect(screen.getByTestId("expense-template-picker-modal")).toBeTruthy();
    expect(screen.getByText(templateExpense.description)).toBeTruthy();
  });

  it("dismisses the template picker after viewing help", () => {
    const { screen } = renderAddExpenseButtonWithTemplate();

    fireEvent(screen.getByTestId("add-expense-fab"), "longPress");
    fireEvent.press(screen.getByTestId("expense-template-picker-info"));
    fireEvent.press(screen.getByText(i18n.t("confirm")));
    fireEvent.press(screen.getByText(i18n.t("cancel")));

    expect(screen.queryByTestId("expense-template-picker-modal")).toBeNull();
    expect(screen.getByTestId("add-expense-fab")).toBeTruthy();
  });

  it("dismisses the template picker via backdrop and keeps the fab visible", () => {
    const navigation = { navigate: jest.fn() };
    const templateExpense = makeExpense({
      id: "e-template",
      description: "Coffee shop",
      editedTimestamp: 2,
    });

    const screen = renderWithAppProviders(
      <AddExpenseButton navigation={navigation} />,
      {
        wrapNavigation: false,
        expenses: {
          expenses: [templateExpense],
          getRecentExpenses: () => [templateExpense],
        },
      }
    );

    fireEvent(screen.getByTestId("add-expense-fab"), "longPress");
    expect(screen.getByTestId("expense-template-picker-modal")).toBeTruthy();

    fireEvent.press(screen.getByTestId("expense-template-picker-backdrop"));

    expect(screen.queryByTestId("expense-template-picker-modal")).toBeNull();
    expect(screen.getByTestId("add-expense-fab")).toBeTruthy();
  });

  it("dismisses the template picker via Cancel", () => {
    const { screen } = renderAddExpenseButtonWithTemplate();

    fireEvent(screen.getByTestId("add-expense-fab"), "longPress");
    fireEvent.press(screen.getByText(i18n.t("cancel")));

    expect(screen.queryByTestId("expense-template-picker-modal")).toBeNull();
    expect(screen.getByTestId("add-expense-fab")).toBeTruthy();
  });

  it("dismisses the template picker on Android back", () => {
    const { screen } = renderAddExpenseButtonWithTemplate();

    fireEvent(screen.getByTestId("add-expense-fab"), "longPress");
    fireEvent(screen.UNSAFE_getByType(Modal), "requestClose");

    expect(screen.queryByTestId("expense-template-picker-modal")).toBeNull();
    expect(screen.getByTestId("add-expense-fab")).toBeTruthy();
  });

  it("tracks long press when there are no template expenses", () => {
    const navigation = { navigate: jest.fn() };

    const screen = renderWithAppProviders(
      <AddExpenseButton navigation={navigation} />,
      {
        wrapNavigation: false,
        expenses: {
          expenses: [],
          getRecentExpenses: () => [],
        },
      }
    );

    fireEvent(screen.getByTestId("add-expense-fab"), "longPress");

    expect(screen.queryByTestId("expense-template-picker-modal")).toBeNull();
    expect(trackEvent).toHaveBeenCalledWith(
      VexoEvents.ADD_EXPENSE_BUTTON_LONGPRESS,
      {
        hasTemplates: false,
        templatesCount: 0,
      }
    );
  });

  it("prefills Manage expense from a template with today's date", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-05-30T10:00:00.000Z"));

    const navigation = { navigate: jest.fn() };
    const templateExpense = makeExpense({
      id: "e-template",
      description: "Coffee shop",
      amount: 42,
      calcAmount: 42,
      editedTimestamp: 2,
    });

    const screen = renderWithAppProviders(
      <AddExpenseButton navigation={navigation} />,
      {
        wrapNavigation: false,
        expenses: {
          expenses: [templateExpense],
          getRecentExpenses: () => [templateExpense],
        },
      }
    );

    fireEvent(screen.getByTestId("add-expense-fab"), "longPress");
    fireEvent.press(screen.getByText("Coffee shop"));

    expect(navigation.navigate).toHaveBeenCalledWith("ManageExpense", {
      pickedCat: templateExpense.category,
      tempValues: expect.objectContaining({
        description: "Coffee shop",
        date: "2026-05-30T10:00:00.000Z",
        startDate: "2026-05-30T10:00:00.000Z",
        endDate: "2026-05-30T10:00:00.000Z",
      }),
    });
    expect(
      (navigation.navigate as jest.Mock).mock.calls[0][1].tempValues
    ).not.toHaveProperty("id");

    jest.useRealTimers();
  });

  it("co-locates shadow and backgroundColor on the add expense fab", () => {
    const navigation = { navigate: jest.fn() };

    const screen = renderWithAppProviders(
      <AddExpenseButton navigation={navigation} />,
      { wrapNavigation: false }
    );

    const fab = screen.getByTestId("add-expense-fab");
    assertSolidBackgroundForShadow(
      StyleSheet.flatten(fab.props.style) as Record<string, unknown>
    );
  });
});
