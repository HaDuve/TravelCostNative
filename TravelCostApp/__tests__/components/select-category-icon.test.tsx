import * as React from "react";
import { fireEvent } from "@testing-library/react-native";

import SelectCategoryIcon from "../../components/UI/selectCategoryIcon";
import { renderWithAppProviders } from "../fixtures/app-providers";

describe("SelectCategoryIcon", () => {
  it("exposes an accessibility label, selected state, and ≥48dp target", () => {
    const setSelectedIconName = jest.fn();
    const screen = renderWithAppProviders(
      <SelectCategoryIcon
        iconName="cafe-outline"
        selectedIconName="cafe-outline"
        setSelectedIconName={setSelectedIconName}
      />,
      { wrapNavigation: false }
    );

    const button = screen.getByLabelText("Cafe");
    expect(button.props.accessibilityRole).toBe("button");
    expect(button.props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true })
    );

    const style = Array.isArray(button.props.style)
      ? Object.assign({}, ...button.props.style)
      : button.props.style;
    expect(style.minWidth).toBeGreaterThanOrEqual(48);
    expect(style.minHeight).toBeGreaterThanOrEqual(48);

    fireEvent.press(button);
    expect(setSelectedIconName).toHaveBeenCalledWith("cafe-outline");
  });
});
