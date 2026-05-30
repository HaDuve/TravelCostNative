import { Platform, StyleSheet } from "react-native";

jest.mock("rn-tourguide", () => ({
  TourGuideZone: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("react-native-dropdown-picker", () => {
  const React = require("react");
  return function MockDropDownPicker() {
    return null;
  };
});

jest.mock("../../assets/SVG/toggleButton", () => {
  const React = require("react");
  return function MockToggleButton() {
    return null;
  };
});

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("../../components/UI/ToastComponent", () => ({
  showBanner: jest.fn(),
}));

jest.mock("react-native-toast-message/lib/src/Toast", () => ({
  Toast: { show: jest.fn(), hide: jest.fn() },
}));

jest.mock("../../components/ExpensesOverview/ExpenseChart", () => {
  const React = require("react");
  return function MockExpenseChart() {
    return null;
  };
});

jest.mock("../../components/ExpensesOverview/CategoryChart", () => {
  const React = require("react");
  return function MockCategoryChart() {
    return null;
  };
});
import { expenseGraphStyles } from "../../components/ExpensesOutput/ExpenseStatistics/ExpenseGraph";
import { overviewScreenStyles } from "../../screens/OverviewScreen";
import {
  assertSolidBackgroundForShadow,
  styleHasShadow,
} from "../../util/shadow-styles";

describe("shadow styles", () => {
  it("detects shadow props on a style object", () => {
    expect(styleHasShadow({ shadowColor: "#000", shadowOpacity: 0.5 })).toBe(
      true
    );
    expect(styleHasShadow({ backgroundColor: "#fff" })).toBe(false);
  });

  it("requires solid backgroundColor when shadow props are present", () => {
    expect(() =>
      assertSolidBackgroundForShadow({ shadowColor: "#000" })
    ).toThrow(/solid backgroundColor/);

    expect(() =>
      assertSolidBackgroundForShadow({
        shadowColor: "#000",
        backgroundColor: "#ffffff",
      })
    ).not.toThrow();
  });

  it("expense graph category card shadow includes backgroundColor", () => {
    assertSolidBackgroundForShadow(
      StyleSheet.flatten(expenseGraphStyles.categoryCard)
    );
  });

  it("overview dropdown and fab shadow styles include backgroundColor", () => {
    assertSolidBackgroundForShadow(
      StyleSheet.flatten(overviewScreenStyles.dropdownContainer)
    );
    assertSolidBackgroundForShadow(
      StyleSheet.flatten([
        overviewScreenStyles.fabToggleButton,
        Platform.select({ ios: {}, android: {} }),
      ])
    );
  });
});
