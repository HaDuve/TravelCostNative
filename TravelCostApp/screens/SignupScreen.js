import { useContext, useState } from "react";
import { Alert } from "react-native";

import AuthContent from "../components/Auth/AuthContent";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { UserContext } from "../store/user-context";
import { createUser } from "../util/auth";
import { fetchUser, storeUser } from "../util/http";
import { AuthContext } from "./../store/auth-context";

function SignupScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);

  async function signupHandler({ name, email, password }) {
    setIsAuthenticating(true);
    try {
      const { token, uid } = await createUser(email, password);
      authCtx.authenticate(token);
      authCtx.setUserID(uid);
      const userdata = { name: name };
      storeUser(uid, userdata);
      userCtx.setName(name);
    } catch (error) {
      Alert.alert(
        "Authentication failed",
        "Could not create user, please check your input and try again later."
      );
      setIsAuthenticating(false);
    }
  }

  if (isAuthenticating) {
    return <LoadingOverlay message="Creating user..." />;
  }

  return <AuthContent onAuthenticate={signupHandler} />;
}

export default SignupScreen;
