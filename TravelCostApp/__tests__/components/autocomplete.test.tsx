import * as React from "react";
import { StyleSheet } from "react-native";
import { act, fireEvent } from "@testing-library/react-native";

import { TextInput as PaperTextInput } from "react-native-paper";

import Autocomplete, {
  AUTOCOMPLETE_BLUR_DISMISS_MS,
} from "../../components/UI/Autocomplete";
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

  it("shows readable suggestion titles when the menu opens", () => {
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

    const title = screen.getByTestId("autocomplete-suggestion-0-text");
    expect(title).toHaveTextContent("Tina");

    const titleStyle = flattenStyle(title.props.style);
    expect(titleStyle.color).toBe(GlobalStyles.colors.textColor);
    expect(titleStyle.opacity ?? 1).toBe(1);
  });

  it("renders the label above the outline instead of on the border", () => {
    const screen = renderWithAppProviders(
      <Autocomplete
        value=""
        label="Suchen"
        data={suggestions}
        onChange={jest.fn()}
      />,
      { wrapNavigation: false }
    );

    expect(screen.getByTestId("autocomplete-label")).toHaveTextContent("Suchen");

    const input = screen.UNSAFE_getByType(PaperTextInput);
    expect(input.props.label).toBeUndefined();
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

    const pressable = screen.getByTestId("autocomplete-suggestion-0");
    const itemStyle = flattenStyle(
      typeof pressable.props.style === "function"
        ? pressable.props.style({ pressed: false })
        : pressable.props.style
    );

    expect(itemStyle.paddingTop).toBe(itemStyle.paddingBottom);
  });

  it("keeps suggestions up briefly after blur so a keyboard-dismiss tap can still select", () => {
    jest.useFakeTimers();
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

    const field = screen.getByTestId("autocomplete-field");
    fireEvent(field, "focus");
    fireEvent(field, "blur");

    expect(screen.getByTestId("autocomplete-suggestions")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(AUTOCOMPLETE_BLUR_DISMISS_MS - 1);
    });
    expect(screen.getByTestId("autocomplete-suggestions")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryByTestId("autocomplete-suggestions")).toBeNull();

    jest.useRealTimers();
  });

  it("applies a suggestion when blur from keyboard dismiss precedes the press", () => {
    jest.useFakeTimers();
    const onChange = jest.fn();
    const screen = renderWithAppProviders(
      <Autocomplete
        value=""
        label="Suchen"
        data={suggestions}
        showOnEmpty
        onChange={onChange}
      />,
      { wrapNavigation: false }
    );

    fireEvent(screen.getByTestId("autocomplete-field"), "focus");
    fireEvent(screen.getByTestId("autocomplete-field"), "blur");

    const suggestion = screen.getByTestId("autocomplete-suggestion-0");
    act(() => {
      fireEvent(suggestion, "pressIn");
      fireEvent.press(suggestion);
    });

    expect(onChange).toHaveBeenCalledWith("Tina");
    expect(screen.queryByTestId("autocomplete-suggestions")).toBeNull();

    jest.useRealTimers();
  });

  it("selects a filtered suggestion on touchStart while typing", () => {
    const onChange = jest.fn();
    const screen = renderWithAppProviders(
      <Autocomplete
        value=""
        label="Description"
        data={["Tina", "Thomas", "Essen"]}
        showOnEmpty={false}
        onChange={onChange}
      />,
      { wrapNavigation: false }
    );

    fireEvent.changeText(screen.getByTestId("autocomplete-field"), "T");
    expect(screen.getByText("Tina")).toBeTruthy();

    fireEvent(screen.getByTestId("autocomplete-suggestion-0"), "touchStart");

    expect(onChange).toHaveBeenCalledWith("Tina");
    expect(screen.queryByTestId("autocomplete-suggestions")).toBeNull();
  });

  it("still applies a suggestion when an item is pressed", () => {
    const onChange = jest.fn();
    const screen = renderWithAppProviders(
      <Autocomplete
        value=""
        label="Suchen"
        data={suggestions}
        showOnEmpty
        onChange={onChange}
      />,
      { wrapNavigation: false }
    );

    fireEvent(screen.getByTestId("autocomplete-field"), "focus");
    fireEvent.press(screen.getByTestId("autocomplete-suggestion-0"));

    expect(onChange).toHaveBeenCalledWith("Tina");
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
