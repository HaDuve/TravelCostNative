import * as React from "react";
import { within } from "@testing-library/react-native";

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

import MyBudgetsHubActions from "../../components/ProfileOutput/MyBudgetsHubActions";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { fireEvent } from "@testing-library/react-native";
import { trackEvent } from "../../util/vexo-tracking";
import { VexoEvents } from "../../util/vexo-constants";

const CHEVRON = "›";

describe("MyBudgetsHubActions", () => {
  beforeEach(() => {
    jest.mocked(trackEvent).mockClear();
  });

  it("shows chevrons on navigation rows to join or add another budget", () => {
    const screen = renderWithAppProviders(
      <MyBudgetsHubActions onJoin={jest.fn()} onAddAnother={jest.fn()} />,
      { wrapNavigation: false },
    );

    expect(
      within(screen.getByTestId("my-budgets-add-another")).getByText(CHEVRON),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("my-budgets-join")).getByText(CHEVRON),
    ).toBeTruthy();
  });

  it("shows hints on both hub actions", () => {
    const screen = renderWithAppProviders(
      <MyBudgetsHubActions onJoin={jest.fn()} onAddAnother={jest.fn()} />,
      { wrapNavigation: false },
    );

    expect(screen.getByText("New budgets start empty")).toBeTruthy();
    expect(screen.getByText("Enter an invite code or link")).toBeTruthy();
  });

  it("calls onJoin when Join budget is pressed", () => {
    const onJoin = jest.fn();
    const screen = renderWithAppProviders(
      <MyBudgetsHubActions onJoin={onJoin} onAddAnother={jest.fn()} />,
      { wrapNavigation: false },
    );

    fireEvent.press(screen.getByTestId("my-budgets-join"));
    expect(onJoin).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith(VexoEvents.TRIP_JOINED);
  });

  it("calls onAddAnother when Add another budget is pressed", () => {
    const onAddAnother = jest.fn();
    const screen = renderWithAppProviders(
      <MyBudgetsHubActions onJoin={jest.fn()} onAddAnother={onAddAnother} />,
      { wrapNavigation: false },
    );

    fireEvent.press(screen.getByTestId("my-budgets-add-another"));
    expect(onAddAnother).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith(
      VexoEvents.CREATE_TRIP_FROM_PROFILE_PRESSED,
    );
  });
});
