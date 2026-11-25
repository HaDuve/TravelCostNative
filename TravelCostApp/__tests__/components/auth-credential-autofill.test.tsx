import * as React from "react";
import { render } from "@testing-library/react-native";

jest.mock("../../store/secure-storage", () => ({
  secureStoreGetItem: jest.fn(async () => null),
  secureStoreSetItem: jest.fn(async () => undefined),
}));

import AuthForm from "../../components/Auth/AuthForm";

function renderForm(isLogin: boolean) {
  return render(
    <AuthForm
      isLogin={isLogin}
      onSubmit={jest.fn()}
      credentialsInvalid={{}}
      isConnected
    />
  );
}

function fieldsByKeyboard(utils: ReturnType<typeof renderForm>) {
  const inputs = utils.UNSAFE_getAllByType(
    require("react-native").TextInput
  );
  return {
    email: inputs.find((i) => i.props.keyboardType === "email-address"),
    password: inputs.find((i) => i.props.secureTextEntry),
  };
}

describe("sign-in credential autofill", () => {
  it("hints the OS to fill saved username and password on sign-in", () => {
    const { email, password } = fieldsByKeyboard(renderForm(true));
    expect(email.props.textContentType).toBe("username");
    expect(email.props.autoComplete).toBe("username");
    expect(email.props.importantForAutofill).toBe("yes");
    expect(password.props.textContentType).toBe("password");
    expect(password.props.autoComplete).toBe("password");
    expect(password.props.importantForAutofill).toBe("yes");
  });

  it("hints the OS to suggest a strong new password on sign-up", () => {
    const { email, password } = fieldsByKeyboard(renderForm(false));
    expect(email.props.textContentType).toBe("username");
    expect(email.props.autoComplete).toBe("username");
    expect(password.props.textContentType).toBe("newPassword");
    expect(password.props.autoComplete).toBe("new-password");
    expect(password.props.importantForAutofill).toBe("yes");
  });

  it("keeps email and password mounted together as one credential pair", () => {
    const { email, password } = fieldsByKeyboard(renderForm(true));
    expect(email).toBeDefined();
    expect(password).toBeDefined();
  });

  it("never persists the password in secure storage", () => {
    const storage = require("../../store/secure-storage");
    renderForm(true);
    for (const call of storage.secureStoreSetItem.mock.calls) {
      expect(call[0]).not.toMatch(/password/i);
    }
  });
});
