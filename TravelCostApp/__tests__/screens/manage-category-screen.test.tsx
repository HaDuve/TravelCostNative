import * as React from "react";
import { Alert, Keyboard, StyleSheet } from "react-native";
import { act, fireEvent, waitFor, within } from "@testing-library/react-native";

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
import { formatCategoryIconLabel } from "../../util/category-icons";

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

function renderScreen(network?: {
  isConnected: boolean;
  strongConnection: boolean;
}) {
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

describe("ManageCategoryScreen add form", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReadCategoryList.mockResolvedValue([...mockCategories]);
    mockWriteCategoryList.mockResolvedValue({
      status: "saved",
      list: mockCategories,
    });
  });

  it("places the back control in the modal header above the add form", async () => {
    const screen = renderScreen();

    await screen.findByPlaceholderText(i18n.t("newCatNamePlaceholder"));

    const header = screen.getByTestId("manage-category-header");
    const back = within(header).getByTestId("manage-category-back");
    expect(
      within(screen.getByTestId("manage-category-footer")).queryByTestId(
        "manage-category-back"
      )
    ).toBeNull();

    fireEvent.press(back);
    expect(navigation.pop).toHaveBeenCalled();
  });

  it("does not autofocus the name field and keeps Add always visible", async () => {
    const screen = renderScreen();

    const nameField = await screen.findByPlaceholderText(
      i18n.t("newCatNamePlaceholder")
    );
    expect(nameField.props.autoFocus).toBeFalsy();

    expect(screen.getByTestId("manage-category-add")).toBeTruthy();
  });

  it("shows an inline hint when Add is tapped without a name or icon", async () => {
    const screen = renderScreen();

    await screen.findByPlaceholderText(i18n.t("newCatNamePlaceholder"));
    fireEvent.press(screen.getByTestId("manage-category-add"));

    expect(
      await screen.findByText(i18n.t("categoryAddMissingNameAndIcon"))
    ).toBeTruthy();
  });

  it("shows an inline hint when Add is tapped with a name but no icon", async () => {
    const screen = renderScreen();

    const nameField = await screen.findByPlaceholderText(
      i18n.t("newCatNamePlaceholder")
    );
    fireEvent.changeText(nameField, "Snacks");
    fireEvent.press(screen.getByTestId("manage-category-add"));

    expect(
      await screen.findByText(i18n.t("categoryAddMissingIcon"))
    ).toBeTruthy();
  });

  it("adds a category on the happy path and clears the form", async () => {
    mockWriteCategoryList.mockImplementation(async (_store, _tripid, list) => ({
      status: "saved",
      list,
    }));

    const screen = renderScreen();
    const nameField = await screen.findByPlaceholderText(
      i18n.t("newCatNamePlaceholder")
    );
    fireEvent.changeText(nameField, "Coffee");
    fireEvent.press(
      screen.getByLabelText(formatCategoryIconLabel("cafe-outline"))
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("manage-category-add"));
    });

    await waitFor(() => {
      expect(mockWriteCategoryList).toHaveBeenCalled();
    });

    expect(
      await screen.findByLabelText(
        i18n.t("deleteCategoryA11y", { name: "Coffee" })
      )
    ).toBeTruthy();
    expect(nameField.props.value).toBe("");
  });

  it("reverts an offline add and keeps the form filled", async () => {
    mockWriteCategoryList.mockResolvedValue({
      status: "offline",
      list: mockCategories,
    });

    const screen = renderScreen({
      isConnected: false,
      strongConnection: false,
    });
    const nameField = await screen.findByPlaceholderText(
      i18n.t("newCatNamePlaceholder")
    );
    fireEvent.changeText(nameField, "Coffee");
    fireEvent.press(
      screen.getByLabelText(formatCategoryIconLabel("cafe-outline"))
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("manage-category-add"));
    });

    await waitFor(() => {
      expect(mockWriteCategoryList).toHaveBeenCalled();
    });

    expect(
      screen.queryByLabelText(i18n.t("deleteCategoryA11y", { name: "Coffee" }))
    ).toBeNull();
    expect(nameField.props.value).toBe("Coffee");
  });

  it("shrinks the icon picker when the keyboard opens so Add stays reachable", async () => {
    const keyboardHandlers: Array<(e?: unknown) => void> = [];
    const addListenerSpy = jest
      .spyOn(Keyboard, "addListener")
      .mockImplementation((event, handler) => {
        if (event === "keyboardWillShow" || event === "keyboardDidShow") {
          keyboardHandlers.push(handler as (e?: unknown) => void);
        }
        return { remove: jest.fn() } as any;
      });

    const screen = renderScreen();
    await screen.findByPlaceholderText(i18n.t("newCatNamePlaceholder"));

    const pickerBefore = screen.getByTestId("manage-category-icon-picker");
    const styleBefore = StyleSheet.flatten(pickerBefore.props.style) as {
      maxHeight?: number;
    };
    const maxBefore = styleBefore.maxHeight ?? 0;

    expect(keyboardHandlers.length).toBeGreaterThan(0);
    await act(async () => {
      keyboardHandlers.forEach((handler) => handler());
    });

    const pickerAfter = screen.getByTestId("manage-category-icon-picker");
    const styleAfter = StyleSheet.flatten(pickerAfter.props.style) as {
      maxHeight?: number;
    };
    expect(styleAfter.maxHeight).toBeLessThan(maxBefore);
    expect(screen.getByTestId("manage-category-add")).toBeTruthy();

    addListenerSpy.mockRestore();
  });

  it("sizes the info modal to content instead of a fixed height", async () => {
    const screen = renderScreen();

    await screen.findByPlaceholderText(i18n.t("newCatNamePlaceholder"));
    fireEvent.press(screen.getByTestId("manage-category-info"));

    const modalBody = await screen.findByTestId("manage-category-info-modal");
    const style = Array.isArray(modalBody.props.style)
      ? Object.assign({}, ...modalBody.props.style)
      : modalBody.props.style;
    expect(style.height).toBeUndefined();
    expect(style.maxHeight).toBeUndefined();
  });
});
