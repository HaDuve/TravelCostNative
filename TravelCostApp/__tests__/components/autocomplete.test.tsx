import * as React from "react";
import { StyleSheet } from "react-native";
import { fireEvent } from "@testing-library/react-native";

import { Menu, TextInput as PaperTextInput } from "react-native-paper";

import Autocomplete from "../../components/UI/Autocomplete";
import { GlobalStyles } from "../../constants/styles";
import { renderWithAppProviders } from "../fixtures/app-providers";

function flattenStyle(style: unknown): Record<string, unknown> {
  return StyleSheet.flatten(style as object) as Record<string, unknown>;
}

describe("Autocomplete", () => {
  const suggestions = ["Tina", "Essen", "Hotel"];

  it("renders the suggestion list above following content with positive z-index", () => {
    const screen = renderWithAppProviders(
      <Autocomplete
        value=""
        label="Suchen"
        data={suggestions}
        showOnEmpty
        onChange={jest.fn()}
        menuStyle={{ marginLeft: 8 }}
      />,
      { wrapNavigation: false }
    );

    fireEvent(screen.getByTestId("autocomplete-field"), "focus");

    const menu = screen.getByTestId("autocomplete-suggestions");
    const menuStyle = flattenStyle(menu.props.style);

    expect(Number(menuStyle.zIndex)).toBeGreaterThan(0);
    expect(Number(menuStyle.elevation ?? 0)).toBeGreaterThan(0);
  });

  it("gives the outlined label a solid background matching the field surface", () => {
    const screen = renderWithAppProviders(
      <Autocomplete
        value=""
        label="Suchen"
        data={suggestions}
        onChange={jest.fn()}
        style={{ backgroundColor: GlobalStyles.colors.backgroundColorLight }}
      />,
      { wrapNavigation: false }
    );

    const input = screen.UNSAFE_getByType(PaperTextInput);
    const background = input.props.theme?.colors?.background;

    expect(background).toBe(GlobalStyles.colors.backgroundColorLight);
    expect(background).not.toBe("transparent");
  });

  it("uses Paper roundness above 6 and matching outline radius for label edge cover", () => {
    const screen = renderWithAppProviders(
      <Autocomplete
        value=""
        label="Suchen"
        data={suggestions}
        onChange={jest.fn()}
        style={{
          backgroundColor: GlobalStyles.colors.backgroundColorLight,
          borderRadius: 5,
        }}
      />,
      { wrapNavigation: false }
    );

    const input = screen.UNSAFE_getByType(PaperTextInput);
    const roundness = input.props.theme?.roundness as number;
    const outlineRadius = StyleSheet.flatten(input.props.outlineStyle)
      ?.borderRadius as number;

    expect(roundness).toBeGreaterThan(6);
    expect(outlineRadius).toBe(roundness);
  });

  it("pads the suggestion list horizontally instead of offsetting with margin", () => {
    const screen = renderWithAppProviders(
      <Autocomplete
        value=""
        label="Suchen"
        data={suggestions}
        showOnEmpty
        onChange={jest.fn()}
      />,
      { wrapNavigation: false }
    );

    fireEvent(screen.getByTestId("autocomplete-field"), "focus");

    const menuStyle = flattenStyle(
      screen.getByTestId("autocomplete-suggestions").props.style
    );

    expect(menuStyle.marginLeft).toBeUndefined();
    expect(Number(menuStyle.paddingHorizontal ?? 0)).toBeGreaterThan(0);
  });

  it("vertically centers suggestion text with balanced item padding", () => {
    const screen = renderWithAppProviders(
      <Autocomplete
        value=""
        label="Suchen"
        data={suggestions}
        showOnEmpty
        onChange={jest.fn()}
      />,
      { wrapNavigation: false }
    );

    fireEvent(screen.getByTestId("autocomplete-field"), "focus");

    const item = screen.UNSAFE_getAllByType(Menu.Item)[0];
    const itemStyle = flattenStyle(item.props.style);
    const titleStyle = flattenStyle(item.props.titleStyle);

    expect(itemStyle.paddingTop).toBe(itemStyle.paddingBottom);
    expect(titleStyle.paddingTop ?? 0).toBe(0);
    expect(titleStyle.paddingBottom ?? 0).toBe(0);
  });

  it("raises the container stacking while suggestions are visible", () => {
    const screen = renderWithAppProviders(
      <Autocomplete
        value=""
        label="Suchen"
        data={suggestions}
        showOnEmpty
        onChange={jest.fn()}
      />,
      { wrapNavigation: false }
    );

    fireEvent(screen.getByTestId("autocomplete-field"), "focus");

    const containerStyle = flattenStyle(
      screen.getByTestId("autocomplete-container").props.style
    );
    expect(Number(containerStyle.zIndex)).toBeGreaterThan(1);
  });
});
