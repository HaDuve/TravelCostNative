import * as React from "react";
import { fireEvent } from "@testing-library/react-native";

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "Light" },
}));

jest.mock("../../store/mmkv", () => ({
  getMMKVString: jest.fn(() =>
    [
      "__Newest Changes:",
      "",
      "1.2.3",
      "- Added dark mode",
      "",
      "__Other Changes:",
      "",
      "1.1.0",
      "- Bug fixes",
    ].join("\n")
  ),
  setMMKVString: jest.fn(),
  MMKV_KEYS: {
    CHANGELOG_TXT: "changelogTxt",
    CURRENT_VERSION: "currentVersion",
  },
}));

jest.mock("../../util/http", () => ({
  fetchChangelog: jest.fn(async () => ""),
}));

jest.mock("../../util/version", () => ({
  versionCheck: jest.fn(async () => null),
}));

import ChangelogScreen from "../../screens/ChangelogScreen";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { assertNoNestedVerticalFlatLists } from "../../test-utils/scroll-composition";
import { assertSolidBackgroundForShadow } from "../../util/shadow-styles";
import { StyleSheet } from "react-native";

describe("Changelog screen", () => {
  it("renders changelog entries when sections are expanded", () => {
    const navigation = { navigate: jest.fn(), pop: jest.fn() };
    const screen = renderWithAppProviders(
      <ChangelogScreen navigation={navigation as any} />,
      {
        network: { strongConnection: false, isConnected: true },
      }
    );

    expect(screen.getByText(/1\.2\.3/)).toBeTruthy();
    expect(screen.getByText(/Added dark mode/)).toBeTruthy();
    expect(screen.getByText(/1\.1\.0/)).toBeTruthy();
  });

  it("does not nest vertical FlatList inside ScrollView", () => {
    const navigation = { navigate: jest.fn(), pop: jest.fn() };
    const screen = renderWithAppProviders(
      <ChangelogScreen navigation={navigation as any} />,
      {
        network: { strongConnection: false, isConnected: true },
      }
    );

    assertNoNestedVerticalFlatLists(screen.root);
  });

  it("co-locates shadow and backgroundColor on section headers", () => {
    const navigation = { navigate: jest.fn(), pop: jest.fn() };
    const screen = renderWithAppProviders(
      <ChangelogScreen navigation={navigation as any} />,
      {
        network: { strongConnection: false, isConnected: true },
      }
    );

    assertSolidBackgroundForShadow(
      StyleSheet.flatten(
        screen.getByTestId("changelog-section-whats-new").props.style
      ) as Record<string, unknown>
    );
    assertSolidBackgroundForShadow(
      StyleSheet.flatten(
        screen.getByTestId("changelog-section-other-changes").props.style
      ) as Record<string, unknown>
    );
  });

  it("hides whats-new entries when the section header is collapsed", () => {
    const navigation = { navigate: jest.fn(), pop: jest.fn() };
    const screen = renderWithAppProviders(
      <ChangelogScreen navigation={navigation as any} />,
      {
        network: { strongConnection: false, isConnected: true },
      }
    );

    fireEvent.press(screen.getByText("Whats new?"));
    expect(screen.queryByText(/1\.2\.3/)).toBeNull();
  });
});
