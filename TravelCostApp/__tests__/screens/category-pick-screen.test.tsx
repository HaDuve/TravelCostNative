import * as React from "react";
import { Dimensions, FlatList } from "react-native";
import { fireEvent, waitFor } from "@testing-library/react-native";

jest.mock("@react-navigation/native", () => {
  const ReactActual = require("react");
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useFocusEffect: (cb: () => void | (() => void)) => {
      ReactActual.useEffect(() => {
        const cleanup = cb();
        return typeof cleanup === "function" ? cleanup : undefined;
      }, [cb]);
    },
  };
});

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

const mockSetExpenseCat = jest.fn();
const mockGetExpenseCat = jest.fn(() => undefined);

jest.mock("../../store/mmkv", () => ({
  setExpenseCat: (...args: unknown[]) => mockSetExpenseCat(...args),
  getExpenseCat: (...args: unknown[]) => mockGetExpenseCat(...args),
  getMMKVObject: jest.fn(() => null),
  setMMKVObject: jest.fn(),
  MMKV_KEYS: { CATEGORY_LIST: "categoryList" },
}));

jest.mock("../../util/category-list", () => {
  const actual = jest.requireActual("../../util/category-list");
  return {
    ...actual,
    createCategoryListStore: () => ({
      getCached: () => [
        {
          cat: "food",
          icon: "fast-food-outline",
          catString: "Food",
          color: "#434343",
        },
        {
          cat: "other",
          icon: "basket-outline",
          catString: "Other",
          color: "#434343",
        },
      ],
      setCached: jest.fn(),
      fetchRemote: jest.fn(async () => null),
      saveRemote: jest.fn(async () => {}),
    }),
    readCategoryList: jest.fn(async () => [
      {
        cat: "food",
        icon: "fast-food-outline",
        catString: "Food",
        color: "#434343",
      },
      {
        cat: "other",
        icon: "basket-outline",
        catString: "Other",
        color: "#434343",
      },
    ]),
  };
});

import CategoryPickScreen from "../../screens/CategoryPickScreen";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { en } from "../../i18n/supportedLanguages";

function renderScreen(
  routeParams: { expenseId?: string } = {},
  navigation = { navigate: jest.fn(), goBack: jest.fn() }
) {
  const screen = renderWithAppProviders(
    <CategoryPickScreen
      route={{ params: routeParams }}
      navigation={navigation}
    />,
    {
      wrapNavigation: false,
      network: { isConnected: true, strongConnection: true },
    }
  );
  return { screen, navigation };
}

describe("CategoryPickScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetExpenseCat.mockReturnValue(undefined);
  });

  it("picks a category into ManageExpense for a new Fast expense", async () => {
    const { screen, navigation } = renderScreen();

    await waitFor(() => {
      expect(screen.getByLabelText("Food")).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText("Food"));

    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith("ManageExpense", {
        pickedCat: "food",
        iconName: "fast-food-outline",
      });
    });
    expect(navigation.goBack).not.toHaveBeenCalled();
  });

  it("stores a temp category and goes back while editing an Expense", async () => {
    const { screen, navigation } = renderScreen({ expenseId: "exp-1" });

    await waitFor(() => {
      expect(screen.getByLabelText("Food")).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText("Food"));

    await waitFor(() => {
      expect(mockSetExpenseCat).toHaveBeenCalledWith("exp-1", {
        expenseId: "exp-1",
        category: "food",
      });
      expect(navigation.goBack).toHaveBeenCalled();
    });
    expect(navigation.navigate).not.toHaveBeenCalledWith(
      "ManageExpense",
      expect.anything()
    );
  });

  it("skips category with the same payload as the old Continue path", async () => {
    const { screen, navigation } = renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId("category-pick-skip")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("category-pick-skip"));

    expect(navigation.navigate).toHaveBeenCalledWith("ManageExpense", {
      pickedCat: "undefined",
    });
  });

  it("skips category while editing an Expense", async () => {
    const { screen, navigation } = renderScreen({ expenseId: "exp-1" });

    await waitFor(() => {
      expect(screen.getByTestId("category-pick-skip")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("category-pick-skip"));

    expect(mockSetExpenseCat).toHaveBeenCalledWith("exp-1", {
      expenseId: "exp-1",
      category: "undefined",
    });
    expect(navigation.goBack).toHaveBeenCalled();
  });

  it("highlights the Expense current category as selected", async () => {
    mockGetExpenseCat.mockReturnValue({
      expenseId: "exp-1",
      category: "food",
    });

    const { screen } = renderScreen({ expenseId: "exp-1" });

    await waitFor(() => {
      const food = screen.getByLabelText("Food");
      expect(food.props.accessibilityState?.selected).toBe(true);
    });

    const other = screen.getByLabelText("Other");
    expect(other.props.accessibilityState?.selected).toBeFalsy();
  });

  it("opens Manage categories from Edit categories", async () => {
    const { screen, navigation } = renderScreen();

    await waitFor(() => {
      expect(screen.getByLabelText(en.editCategories)).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText(en.editCategories));

    expect(navigation.navigate).toHaveBeenCalledWith("ManageCategory");
  });

  it("uses an adaptive column count on the category grid", async () => {
    jest.spyOn(Dimensions, "get").mockReturnValue({
      width: 390,
      height: 844,
      scale: 2,
      fontScale: 1,
    });

    const { screen } = renderScreen();

    await waitFor(() => {
      expect(screen.getByLabelText("Food")).toBeTruthy();
    });

    const list = screen.UNSAFE_getByType(FlatList);
    expect(list.props.numColumns).toBe(3);
  });

  it("shows a title and close control and no Cancel button", async () => {
    const { screen } = renderScreen();

    await waitFor(() => {
      expect(screen.getByText(en.pickCategoryTitle)).toBeTruthy();
      expect(screen.getByLabelText(en.close)).toBeTruthy();
    });

    expect(screen.queryByText(en.cancel)).toBeNull();
    expect(screen.queryByTestId("category-pick-back")).toBeNull();
    expect(screen.queryByTestId("category-pick-continue")).toBeNull();
  });
});
