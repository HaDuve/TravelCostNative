import * as React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { i18n } from "../../i18n/i18n";

jest.mock("../../store/secure-storage", () => ({
  secureStoreGetItem: jest.fn(async () => null),
  secureStoreSetItem: jest.fn(async () => undefined),
}));

import AuthForm from "../../components/Auth/AuthForm";

const secureStorage = require("../../store/secure-storage");

function renderForm(isLogin: boolean, onSubmit = jest.fn()) {
  const utils = render(
    <AuthForm
      isLogin={isLogin}
      onSubmit={onSubmit}
      credentialsInvalid={{}}
      isConnected
    />
  );
  return {
    ...utils,
    onSubmit,
    email: utils.getByTestId("auth-email-input"),
    password: utils.getByTestId("auth-password-input"),
  };
}

describe("sign-in credential autofill", () => {
  it("hints the OS to fill saved username and password on sign-in", () => {
    const { email, password } = renderForm(true);
    expect(email.props.textContentType).toBe("username");
    expect(email.props.autoComplete).toBe("username");
    expect(email.props.importantForAutofill).toBe("yes");
    expect(password.props.textContentType).toBe("password");
    expect(password.props.autoComplete).toBe("password");
    expect(password.props.importantForAutofill).toBe("yes");
  });

  it("hints the OS to suggest a strong new password on sign-up", () => {
    const { email, password } = renderForm(false);
    expect(email.props.textContentType).toBe("username");
    expect(email.props.autoComplete).toBe("username");
    expect(password.props.textContentType).toBe("newPassword");
    expect(password.props.autoComplete).toBe("new-password");
    expect(password.props.importantForAutofill).toBe("yes");
  });

  it("keeps the sign-up name field out of the credential pair", () => {
    const { getByTestId } = renderForm(false);
    expect(getByTestId("auth-name-input").props.textContentType).toBe("name");
  });

  it.each([true, false])(
    "renders email and password together in one form (isLogin=%s)",
    (isLogin) => {
      const { email, password, queryByTestId } = renderForm(isLogin);
      expect(email.props.secureTextEntry).toBeFalsy();
      expect(password.props.secureTextEntry).toBe(true);
      expect(queryByTestId("auth-name-input") !== null).toBe(!isLogin);
    }
  );

  it("never persists the password in secure storage or AsyncStorage", async () => {
    const secret = "S3cret-Pass-Word!";
    const asyncSet = jest.spyOn(AsyncStorage, "setItem");
    const { email, password, getAllByText, onSubmit } = renderForm(true);
    fireEvent.changeText(email, "me@example.com");
    fireEvent.changeText(password, secret);
    fireEvent.press(getAllByText(i18n.t("loginText")).slice(-1)[0]);
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    const writes = [
      ...secureStorage.secureStoreSetItem.mock.calls,
      ...asyncSet.mock.calls,
    ];
    expect(writes.length).toBeGreaterThan(0);
    expect(JSON.stringify(writes)).not.toContain(secret);
  });
});
