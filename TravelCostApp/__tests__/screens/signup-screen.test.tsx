import * as React from "react";
import { readFileSync } from "fs";
import { join } from "path";

const signupSteps: string[] = [];

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useNavigation: () => ({
      replace: jest.fn(),
    }),
  };
});

jest.mock("@react-navigation/elements", () => ({
  useHeaderHeight: () => 0,
}));

jest.mock("../../store/async-storage", () => ({
  asyncStoreSafeClear: jest.fn(async () => {
    signupSteps.push("clear");
  }),
}));

jest.mock("../../util/auth", () => ({
  createUser: jest.fn(async () => {
    signupSteps.push("createUser");
    return { token: "fresh-id-token", uid: "new-user-uid" };
  }),
}));

jest.mock("../../util/http", () => ({
  storeUser: jest.fn(async () => {}),
  updateUser: jest.fn(async () => {}),
}));

jest.mock("../../util/axios-config", () => ({
  setAxiosAccessToken: jest.fn(),
}));

jest.mock("../../components/Premium/PremiumConstants", () => ({
  loadKeys: jest.fn(async () => ({ REVCAT_G: "", REVCAT_A: "" })),
  setAttributesAsync: jest.fn(async () => {}),
}));

jest.mock("react-native-purchases", () => ({
  configure: jest.fn(),
  collectDeviceIdentifiers: jest.fn(async () => {}),
}));

jest.mock("../../util/vexo-tracking", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("../../util/create-implicit-default-for-user", () => ({
  createImplicitDefaultForUser: jest.fn(async () => {}),
}));

jest.mock("../../store/secure-storage", () => ({
  secureStoreSetItem: jest.fn(async () => {}),
  secureStoreGetItem: jest.fn(async () => ""),
}));

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn(), hide: jest.fn() },
}));

import { fireEvent, waitFor } from "@testing-library/react-native";
import { TextInput } from "react-native";

import SignupScreen from "../../screens/SignupScreen";
import { i18n } from "../../i18n/i18n";
import { renderWithAppProviders } from "../fixtures/app-providers";
import { asyncStoreSafeClear } from "../../store/async-storage";
import { createUser } from "../../util/auth";

const appRoot = join(__dirname, "../..");

describe("SignupScreen", () => {
  beforeEach(() => {
    signupSteps.length = 0;
    jest.clearAllMocks();
  });

  it("clears local storage before createUser, not after auth", async () => {
    const screen = renderWithAppProviders(<SignupScreen />, {
      network: { isConnected: true, strongConnection: true },
      auth: {
        setUserID: jest.fn(async () => {}),
        authenticate: jest.fn(async () => {}),
      },
      user: {
        setUserName: jest.fn(async () => {}),
        setTripHistory: jest.fn(),
        setFreshlyCreatedTo: jest.fn(),
      },
      trip: {
        setCurrentTrip: jest.fn(),
        saveTripDataInStorage: jest.fn(async () => {}),
        saveTravellersInStorage: jest.fn(async () => {}),
      },
      expenses: {
        setExpenses: jest.fn(),
      },
    });

    const inputs = screen.UNSAFE_getAllByType(TextInput);
    fireEvent.changeText(inputs[0], "Alice");
    fireEvent.changeText(inputs[1], "alice@example.com");
    fireEvent.changeText(inputs[2], "secret12");

    fireEvent.press(
      screen.getAllByText(i18n.t("createAccountText")).slice(-1)[0]
    );

    await waitFor(() => expect(createUser).toHaveBeenCalled());
    expect(signupSteps).toEqual(["clear", "createUser"]);
    expect(asyncStoreSafeClear).toHaveBeenCalledTimes(1);
  });

  it("does not call asyncStoreSafeClear after createUser in source", () => {
    const src = readFileSync(join(appRoot, "screens/SignupScreen.tsx"), "utf8");
    const clearIndex = src.indexOf("await asyncStoreSafeClear()");
    const createUserIndex = src.indexOf("await createUser(email, password)");
    expect(clearIndex).toBeGreaterThan(-1);
    expect(createUserIndex).toBeGreaterThan(clearIndex);
    expect(src.slice(createUserIndex).includes("await asyncStoreSafeClear()")).toBe(
      false
    );
  });
});
