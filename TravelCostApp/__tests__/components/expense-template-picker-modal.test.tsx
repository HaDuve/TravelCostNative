import * as React from "react";

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

import { fireEvent } from "@testing-library/react-native";

import ExpenseTemplateHelpModal from "../../components/ManageExpense/ExpenseTemplateHelpModal";
import ExpenseTemplatePickerModal from "../../components/ManageExpense/ExpenseTemplatePickerModal";
import { i18n } from "../../i18n/i18n";
import { makeExpense } from "../fixtures/expense";
import { renderWithAppProviders } from "../fixtures/app-providers";

describe("ExpenseTemplatePickerModal", () => {
  it("requests more templates when the list reaches the end", () => {
    const onLoadMore = jest.fn();
    const templates = [makeExpense({ id: "e-1", description: "Coffee shop" })];

    const screen = renderWithAppProviders(
      <ExpenseTemplatePickerModal
        isVisible
        onClose={jest.fn()}
        templates={templates}
        topDuplicateCount={0}
        onSelectTemplate={jest.fn()}
        onLoadMore={onLoadMore}
      />,
      { wrapNavigation: false }
    );

    fireEvent(screen.getByTestId("expense-template-picker-list"), "onEndReached");

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("shows a single confirm row without chevron in the help modal", () => {
    const screen = renderWithAppProviders(
      <ExpenseTemplateHelpModal isVisible onClose={jest.fn()} />,
      { wrapNavigation: false }
    );

    expect(screen.getByTestId("expense-template-help-modal")).toBeTruthy();
    expect(screen.getByText(i18n.t("confirm"))).toBeTruthy();
    expect(screen.queryByText("›")).toBeNull();
  });

  it("shows header cancel row without chevron", () => {
    const templates = [makeExpense({ id: "e-1", description: "Coffee shop" })];

    const screen = renderWithAppProviders(
      <ExpenseTemplatePickerModal
        isVisible
        onClose={jest.fn()}
        templates={templates}
        topDuplicateCount={0}
        onSelectTemplate={jest.fn()}
        onLoadMore={jest.fn()}
      />,
      { wrapNavigation: false }
    );

    expect(screen.getByTestId("expense-template-picker-close")).toBeTruthy();
    expect(screen.queryByText("›")).toBeNull();
  });
});
