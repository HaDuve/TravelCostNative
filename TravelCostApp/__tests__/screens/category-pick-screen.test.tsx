import * as React from "react";
import { Alert, FlatList, StyleSheet } from "react-native";
import { act, fireEvent, waitFor } from "@testing-library/react-native";

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
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium" },
}));

jest.mock("react-native-sortables", () => {
  const ReactActual = require("react");
  const { View } = require("react-native");
  const Passthrough = ({ children }: { children?: React.ReactNode }) =>
    ReactActual.createElement(View, null, children);
  return {
    __esModule: true,
    default: {
      Grid: ({
        data,
        renderItem,
      }: {
        data: unknown[];
        renderItem: (info: { item: unknown; index: number }) => React.ReactNode;
      }) =>
        ReactActual.createElement(
          View,
          { testID: "category-sortable-grid" },
          data.map((item, index) =>
            ReactActual.createElement(
              View,
              { key: String(index) },
              renderItem({ item, index })
            )
          )
        ),
      Handle: Passthrough,
      Touchable: Passthrough,
    },
  };
});

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

const mockIsConnectionFastEnoughAsBool = jest.fn(async () => false);
jest.mock("../../util/connectionSpeed", () => ({
  isConnectionFastEnoughAsBool: (...args: unknown[]) =>
    mockIsConnectionFastEnoughAsBool(...args),
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

const cachedCategories = [
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
];

let mockGetCached = jest.fn(() => cachedCategories);
let mockReadCategoryList = jest.fn(async () => cachedCategories);

jest.mock("../../util/category-list", () => {
  const actual = jest.requireActual("../../util/category-list");
  return {
    ...actual,
    createCategoryListStore: () => ({
      getCached: (...args: unknown[]) => mockGetCached(...args),
      setCached: jest.fn(),
      fetchRemote: jest.fn(async () => null),
      saveRemote: jest.fn(async () => {}),
    }),
    readCategoryList: (...args: unknown[]) => mockReadCategoryList(...args),
  };
});

import CategoryPickScreen from "../../screens/CategoryPickScreen";
import {
  renderWithAppProviders,
  type AppProviderOverrides,
} from "../fixtures/app-providers";
import { en } from "../../i18n/supportedLanguages";
import { layoutFor } from "../../util/layout";
import { categoryPickTileMinHeight } from "../../util/category-pick";

function renderScreen(
  routeParams: { expenseId?: string } = {},
  navigation = { navigate: jest.fn(), goBack: jest.fn() },
  overrides: AppProviderOverrides = {}
) {
  const screen = renderWithAppProviders(
    <CategoryPickScreen
      route={{ params: routeParams }}
      navigation={navigation}
    />,
    {
      wrapNavigation: false,
      network: { isConnected: true, strongConnection: true },
      user: {
        isPremium: true,
        checkPremium: jest.fn(async () => true),
        loadCatListFromAsyncInCtx: jest.fn(async () => {}),
      },
      ...overrides,
    }
  );
  return { screen, navigation };
}

describe("CategoryPickScreen", () => {
  let alertSpy: jest.SpyInstance;
  let useWindowDimensionsSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetExpenseCat.mockReturnValue(undefined);
    mockGetCached = jest.fn(() => cachedCategories);
    mockReadCategoryList = jest.fn(async () => cachedCategories);
    mockIsConnectionFastEnoughAsBool.mockResolvedValue(false);
    alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    useWindowDimensionsSpy = jest
      .spyOn(require("react-native"), "useWindowDimensions")
      .mockReturnValue({ width: 390, height: 844, scale: 2, fontScale: 1 });
  });

  afterEach(() => {
    alertSpy.mockRestore();
    useWindowDimensionsSpy.mockRestore();
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

  it("alerts when Edit categories is pressed offline", async () => {
    const { screen, navigation } = renderScreen(
      {},
      { navigate: jest.fn(), goBack: jest.fn() },
      { network: { isConnected: false, strongConnection: false } }
    );

    await waitFor(() => {
      expect(screen.getByLabelText(en.editCategories)).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByLabelText(en.editCategories));
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        en.alertOffline,
        en.alertNeedOnlineCategory
      );
    });
    expect(navigation.navigate).not.toHaveBeenCalledWith("ManageCategory");
  });

  it("uses an adaptive column count on the category grid", async () => {
    const { screen } = renderScreen();

    await waitFor(() => {
      expect(screen.getByLabelText("Food")).toBeTruthy();
    });

    const list = screen.UNSAFE_getByType(FlatList);
    expect(list.props.numColumns).toBe(3);
  });

  it("grows category tile minHeight with large Dynamic Type fontScale", async () => {
    useWindowDimensionsSpy.mockReturnValue({
      width: 390,
      height: 844,
      scale: 2,
      fontScale: 2,
    });

    const { screen } = renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId("category-pick-tile-food")).toBeTruthy();
    });

    const tile = screen.getByTestId("category-pick-tile-food");
    const styleProp = tile.props.style;
    const resolved =
      typeof styleProp === "function" ? styleProp({ pressed: false }) : styleProp;
    const style = StyleSheet.flatten(resolved) as { minHeight?: number };
    const layout = layoutFor({ width: 390, height: 844 });
    expect(style.minHeight).toBe(categoryPickTileMinHeight(layout, 2));
    expect(style.minHeight).toBeGreaterThan(
      categoryPickTileMinHeight(layout, 1)
    );
  });

  it("does not show a full-screen spinner when picking a cached category", async () => {
    const { screen, navigation } = renderScreen();

    await waitFor(() => {
      expect(screen.getByLabelText("Food")).toBeTruthy();
    });

    expect(screen.queryByTestId("category-pick-spinner")).toBeNull();

    fireEvent.press(screen.getByLabelText("Food"));

    expect(screen.queryByTestId("category-pick-spinner")).toBeNull();
    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith("ManageExpense", {
        pickedCat: "food",
        iconName: "fast-food-outline",
      });
    });
    expect(screen.queryByTestId("category-pick-spinner")).toBeNull();
  });

  it("shows a full-screen spinner only while loading with an empty cache", async () => {
    let resolveRead: (value: typeof cachedCategories) => void = () => {};
    mockGetCached = jest.fn(() => null);
    mockReadCategoryList = jest.fn(
      () =>
        new Promise((resolve) => {
          resolveRead = resolve;
        })
    );

    const { screen } = renderScreen();

    await waitFor(() => {
      expect(screen.getByTestId("category-pick-spinner")).toBeTruthy();
    });
    expect(screen.queryByTestId("category-pick-list")).toBeNull();

    await act(async () => {
      resolveRead(cachedCategories);
    });

    await waitFor(() => {
      expect(screen.queryByTestId("category-pick-spinner")).toBeNull();
      expect(screen.getByLabelText("Food")).toBeTruthy();
    });
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

  it("enters reorder mode on long-press and shows Done", async () => {
    const { screen, navigation } = renderScreen();

    await waitFor(() => {
      expect(screen.getByLabelText("Food")).toBeTruthy();
    });

    fireEvent(screen.getByLabelText("Food"), "onLongPress");

    await waitFor(() => {
      expect(screen.getByTestId("category-pick-reorder-done")).toBeTruthy();
      expect(screen.getByTestId("category-sortable-grid")).toBeTruthy();
    });
    expect(navigation.navigate).not.toHaveBeenCalledWith("Paywall");
    expect(screen.queryByTestId("category-pick-skip")).toBeNull();
  });

  it("does not enter reorder when offline and explains why", async () => {
    const { screen } = renderScreen(
      {},
      { navigate: jest.fn(), goBack: jest.fn() },
      { network: { isConnected: false, strongConnection: false } }
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Food")).toBeTruthy();
    });

    fireEvent(screen.getByLabelText("Food"), "onLongPress");

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        en.alertOffline,
        en.alertNeedOnlineCategory
      );
    });
    expect(screen.queryByTestId("category-pick-reorder-done")).toBeNull();
  });

  it("opens the paywall instead of reorder for non-premium travellers", async () => {
    const { screen, navigation } = renderScreen(
      {},
      { navigate: jest.fn(), goBack: jest.fn() },
      {
        user: {
          isPremium: false,
          checkPremium: jest.fn(async () => false),
          loadCatListFromAsyncInCtx: jest.fn(async () => {}),
        },
      }
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Food")).toBeTruthy();
    });

    fireEvent(screen.getByLabelText("Food"), "onLongPress");

    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith("Paywall");
    });
    expect(screen.queryByTestId("category-pick-reorder-done")).toBeNull();
  });
});
