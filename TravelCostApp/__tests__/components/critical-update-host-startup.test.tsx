/**
 * Startup seam for CriticalUpdateHost: mounted as a sibling of navigators
 * under NavigationContainer (same shape as App.tsx Navigation()).
 *
 * Symptom under test: first paint must complete without throw / max-update-depth
 * (whitescreen / ANR on cold start).
 */
import * as React from "react";
import { Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const mockRequestCheckAndFetch = jest.fn();
const mockApplyReload = jest.fn();

jest.mock("../../store/critical-ota-context", () => ({
  useCriticalOta: () => ({
    updateReady: false,
    isCritical: false,
    noteUpdateReady: jest.fn(),
    requestCheckAndFetch: (...args: unknown[]) =>
      mockRequestCheckAndFetch(...args),
    applyReload: (...args: unknown[]) => mockApplyReload(...args),
  }),
}));

import CriticalUpdateHost from "../../components/UI/CriticalUpdateHost";

const Stack = createNativeStackNavigator();

function StubHome() {
  return (
    <View>
      <Text>HomeReady</Text>
    </View>
  );
}

function StartupShell() {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 47, left: 0, right: 0, bottom: 34 },
      }}
    >
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={StubHome} />
        </Stack.Navigator>
        {/* Same sibling mount as App.tsx — must not use useNavigationState */}
        <CriticalUpdateHost focusedRouteName="Home" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

describe("CriticalUpdateHost cold-start mount (App.tsx shape)", () => {
  beforeEach(() => {
    mockRequestCheckAndFetch.mockReset();
    mockApplyReload.mockReset();
    mockRequestCheckAndFetch.mockResolvedValue({
      available: false,
      updateReady: false,
      isCritical: false,
    });
  });

  it("paints the navigator without throwing when Host is a NavigationContainer sibling", async () => {
    const screen = render(<StartupShell />);

    expect(await screen.findByText("HomeReady")).toBeTruthy();
    await waitFor(() => {
      expect(mockRequestCheckAndFetch).toHaveBeenCalled();
    });
  });
});
