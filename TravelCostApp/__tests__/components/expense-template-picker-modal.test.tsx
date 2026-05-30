import * as React from "react";

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

import { fireEvent } from "@testing-library/react-native";

import ExpenseTemplatePickerModal from "../../components/ManageExpense/ExpenseTemplatePickerModal";
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
});
