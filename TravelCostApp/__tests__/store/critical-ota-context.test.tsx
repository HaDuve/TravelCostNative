import * as React from "react";
import { Text, Pressable } from "react-native";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { render } from "@testing-library/react-native";

const mockCheckAndFetchOtaUpdate = jest.fn();
const mockReload = jest.fn();

jest.mock("../../util/check-and-fetch-ota-update", () => ({
  checkAndFetchOtaUpdate: (...args: unknown[]) =>
    mockCheckAndFetchOtaUpdate(...args),
}));

jest.mock("../../util/ota-apply-client", () => ({
  createExpoOtaApplyClient: () => ({
    isEnabled: true,
    checkForUpdate: jest.fn(),
    fetchUpdate: jest.fn(),
    fetchChangelog: jest.fn(),
    reload: (...args: unknown[]) => mockReload(...args),
  }),
}));

import {
  CriticalOtaProvider,
  useCriticalOta,
} from "../../store/critical-ota-context";

function Probe() {
  const { requestCheckAndFetch, updateReady, isCritical } = useCriticalOta();
  return (
    <>
      <Text>{`ready:${updateReady}:critical:${isCritical}`}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="check"
        onPress={() => {
          void requestCheckAndFetch();
        }}
      />
    </>
  );
}

describe("CriticalOtaProvider", () => {
  beforeEach(() => {
    mockCheckAndFetchOtaUpdate.mockReset();
    mockReload.mockReset();
  });

  it("coalesces overlapping checkAndFetch calls into one in-flight request", async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    mockCheckAndFetchOtaUpdate.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    const screen = render(
      <CriticalOtaProvider>
        <Probe />
      </CriticalOtaProvider>
    );

    fireEvent.press(screen.getByRole("button", { name: "check" }));
    fireEvent.press(screen.getByRole("button", { name: "check" }));

    await waitFor(() => {
      expect(mockCheckAndFetchOtaUpdate).toHaveBeenCalledTimes(1);
    });

    resolveFetch({
      available: true,
      updateReady: true,
      isCritical: true,
    });

    await waitFor(() => {
      expect(screen.getByText("ready:true:critical:true")).toBeTruthy();
    });
  });
});
