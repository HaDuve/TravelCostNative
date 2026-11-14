import * as React from "react";
import { Alert, StyleSheet } from "react-native";
import { act, fireEvent, waitFor } from "@testing-library/react-native";

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

jest.mock("../../components/Premium/BlurPremium", () => () => null);
jest.mock("../../components/UI/selectCategoryIcon", () => () => null);
jest.mock("../../components/UI/InfoButton", () => () => null);
jest.mock("react-native-modal", () => () => null);

const mockCategories = [
  { cat: "food", icon: "fast-food-outline", catString: "Food" },
  { cat: "travel", icon: "airplane-outline", catString: "Travel" },
];

const mockWriteCategoryList = jest.fn();
const mockReadCategoryList = jest.fn(async () => mockCategories);

jest.mock("../../util/category-list", () => {
  const actual = jest.requireActual("../../util/category-list");
  return {
    ...actual,
    createCategoryListStore: jest.fn(() => ({})),
    readCategoryList: (...args: unknown[]) => mockReadCategoryList(...args),
    writeCategoryList: (...args: unknown[]) => mockWriteCategoryList(...args),
  };
});

import Toast from "react-native-toast-message";
import ManageCategoryScreen from "../../screens/ManageCategoryScreen";
import { i18n } from "../../i18n/i18n";
import { renderWithAppProviders } from "../fixtures/app-providers";

const navigation = {
  navigate: jest.fn(),
  pop: jest.fn(),
};

function deletedCategoryUndoToastCalls() {
  return (Toast.show as jest.Mock).mock.calls.filter(
    ([payload]) =>
      payload?.text1 === i18n.t("toastDeletedCategory1") ||
      payload?.type === "deletedExpense"
  );
}

function renderScreen(network?: { isConnected: boolean; strongConnection: boolean }) {
  return renderWithAppProviders(
    <ManageCategoryScreen
      route={{ params: {} }}
      navigation={navigation as any}
    />,
    {
      wrapNavigation: false,
      network: network ?? { isConnected: true, strongConnection: true },
      user: {
        loadCatListFromAsyncInCtx: jest.fn(async () => {}),
        checkPremium: jest.fn(async () => true),
        freshlyCreated: false,
      },
      trip: { tripid: "trip-1" },
    }
  );
}

describe("ManageCategoryScreen delete persist", () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReadCategoryList.mockResolvedValue([...mockCategories]);
    alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it("does not show undo toast when writeCategoryList returns offline", async () => {
    mockWriteCategoryList.mockResolvedValue({
      status: "offline",
      list: [mockCategories[1]],
    });

    const screen = renderScreen({
      isConnected: false,
      strongConnection: false,
    });

    await waitFor(() => {
      expect(
        screen.getByLabelText(i18n.t("deleteCategoryA11y", { name: "Food" }))
      ).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(
        screen.getByLabelText(i18n.t("deleteCategoryA11y", { name: "Food" }))
      );
    });

    await waitFor(() => {
      expect(mockWriteCategoryList).toHaveBeenCalled();
    });

    expect(deletedCategoryUndoToastCalls()).toHaveLength(0);
    // Offline reverts optimistic delete so Done→remount cannot drop the category.
    expect(
      screen.getByLabelText(i18n.t("deleteCategoryA11y", { name: "Food" }))
    ).toBeTruthy();
  });

  it("does not show undo toast when writeCategoryList returns error", async () => {
    mockWriteCategoryList.mockResolvedValue({
      status: "error",
      list: [mockCategories[1]],
      error: new Error("save failed"),
    });

    const screen = renderScreen();

    await waitFor(() => {
      expect(
        screen.getByLabelText(i18n.t("deleteCategoryA11y", { name: "Food" }))
      ).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(
        screen.getByLabelText(i18n.t("deleteCategoryA11y", { name: "Food" }))
      );
    });

    await waitFor(() => {
      expect(mockWriteCategoryList).toHaveBeenCalled();
    });

    expect(deletedCategoryUndoToastCalls()).toHaveLength(0);
  });

  it("shows undo toast when writeCategoryList returns saved", async () => {
    mockWriteCategoryList.mockResolvedValue({
      status: "saved",
      list: [mockCategories[1]],
    });

    const screen = renderScreen();

    await waitFor(() => {
      expect(
        screen.getByLabelText(i18n.t("deleteCategoryA11y", { name: "Food" }))
      ).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(
        screen.getByLabelText(i18n.t("deleteCategoryA11y", { name: "Food" }))
      );
    });

    await waitFor(() => {
      expect(deletedCategoryUndoToastCalls().length).toBeGreaterThan(0);
    });
  });

  it("keeps rename and delete touch targets at least 48dp", async () => {
    mockWriteCategoryList.mockResolvedValue({
      status: "saved",
      list: mockCategories,
    });

    const screen = renderScreen();

    await waitFor(() => {
      expect(
        screen.getByLabelText(i18n.t("deleteCategoryA11y", { name: "Food" }))
      ).toBeTruthy();
    });

    const deleteButton = screen.getByLabelText(
      i18n.t("deleteCategoryA11y", { name: "Food" })
    );
    const deleteStyle = StyleSheet.flatten(deleteButton.props.style) as {
      minWidth?: number;
      minHeight?: number;
    };
    expect(deleteStyle.minWidth).toBeGreaterThanOrEqual(48);
    expect(deleteStyle.minHeight).toBeGreaterThanOrEqual(48);

    const renameInput = screen.getByLabelText(
      i18n.t("renameCategoryA11y", { name: "Food" })
    );
    const renameStyle = StyleSheet.flatten(renameInput.props.style) as {
      minHeight?: number;
    };
    expect(renameStyle.minHeight).toBeGreaterThanOrEqual(48);
  });
});
