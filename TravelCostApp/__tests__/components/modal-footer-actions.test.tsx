import * as React from "react";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light", Medium: "Medium" },
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.0.0" } },
}));

jest.mock("../../util/http", () => ({
  storeFeedback: jest.fn(async () => {}),
}));

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn(), hide: jest.fn() },
}));

jest.mock("expo-store-review", () => ({
  isAvailableAsync: jest.fn(async () => true),
  requestReview: jest.fn(async () => {}),
}));

jest.mock("../../store/secure-storage", () => ({
  secureStoreSetObject: jest.fn(async () => {}),
}));

jest.mock("react-native-modal", () => {
  const React = require("react");
  const { View } = require("react-native");
  return ({
    children,
    isVisible,
  }: {
    children: React.ReactNode;
    isVisible: boolean;
  }) => (isVisible ? <View testID="rating-modal-root">{children}</View> : null);
});

import { fireEvent } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import FeedbackForm from "../../components/FeedbackForm/FeedbackForm";
import ErrorOverlay from "../../components/UI/ErrorOverlay";
import RatingModal from "../../screens/RatingModal";
import { i18n } from "../../i18n/i18n";
import { storeFeedback } from "../../util/http";
import { renderWithAppProviders } from "../fixtures/app-providers";

describe("modal footer ActionRowStack pattern", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("FeedbackForm", () => {
    it("disables submit until feedback text is entered", () => {
      const screen = renderWithAppProviders(
        <FeedbackForm isVisible onClose={jest.fn()} />,
        { wrapNavigation: false }
      );

      const submitDisabledStyle = StyleSheet.flatten(
        typeof screen.getByTestId("feedback-submit").props.style === "function"
          ? screen.getByTestId("feedback-submit").props.style({ pressed: false })
          : screen.getByTestId("feedback-submit").props.style
      ) as Record<string, unknown>;
      expect(submitDisabledStyle.opacity).toBe(0.5);

      fireEvent.changeText(
        screen.getByPlaceholderText(i18n.t("feedbackPlaceholder")),
        "Love the budget splits!"
      );

      const submitEnabledStyle = StyleSheet.flatten(
        typeof screen.getByTestId("feedback-submit").props.style === "function"
          ? screen.getByTestId("feedback-submit").props.style({ pressed: false })
          : screen.getByTestId("feedback-submit").props.style
      ) as Record<string, unknown>;
      expect(submitEnabledStyle.opacity).toBeUndefined();
    });

    it("renders primary submit above secondary cancel without chevrons", () => {
      const screen = renderWithAppProviders(
        <FeedbackForm isVisible onClose={jest.fn()} />,
        { wrapNavigation: false }
      );

      expect(screen.getByTestId("action-row-stack")).toBeTruthy();
      expect(screen.getByText(i18n.t("submit"))).toBeTruthy();
      expect(screen.getByText(i18n.t("cancel"))).toBeTruthy();
      expect(screen.queryByText("›")).toBeNull();
    });

    it("does not submit when disabled", () => {
      const screen = renderWithAppProviders(
        <FeedbackForm isVisible onClose={jest.fn()} />,
        { wrapNavigation: false }
      );

      fireEvent.press(screen.getByTestId("feedback-submit"));
      expect(storeFeedback).not.toHaveBeenCalled();
    });
  });

  describe("RatingModal", () => {
    it("renders three stacked footer rows without chevrons", () => {
      const screen = renderWithAppProviders(
        <RatingModal isModalVisible setIsModalVisible={jest.fn()} />,
        { wrapNavigation: false }
      );

      expect(screen.getByTestId("rating-modal-rate")).toBeTruthy();
      expect(screen.getByTestId("rating-modal-later")).toBeTruthy();
      expect(screen.getByTestId("rating-modal-never")).toBeTruthy();
      expect(screen.queryByText("›")).toBeNull();
    });
  });

  describe("ErrorOverlay", () => {
    it("renders a single primary confirm row without chevron", () => {
      const onConfirm = jest.fn();
      const screen = renderWithAppProviders(
        <ErrorOverlay message="Sync failed" onConfirm={onConfirm} />,
        { wrapNavigation: false }
      );

      expect(screen.getByText(i18n.t("okay"))).toBeTruthy();
      expect(screen.queryByText("›")).toBeNull();

      fireEvent.press(screen.getByText(i18n.t("okay")));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });
});
