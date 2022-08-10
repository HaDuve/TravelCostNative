import AuthContent from "../components/Auth/AuthContent";
import { useContext, useEffect, useState } from "react";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { login } from "../util/auth";
import { Alert } from "react-native";
import { AuthContext } from "./../store/auth-context";
import { UserContext } from "../store/user-context";
import { fetchUser } from "../util/http";

function LoginScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);

  async function loginHandler({ email, password }) {
    setIsAuthenticating(true);
    try {
      const { token, uid } = await login(email, password);
      console.log(
        "🚀 ~ file: LoginScreen.js ~ line 17 ~ loginHandler ~ uid",
        uid
      );

      authCtx.authenticate(token);
      authCtx.setUserID(uid);
    } catch (error) {
      console.log(error.message);
      Alert.alert(
        "Authentication failed!",
        "Failed to login. Wrong password or Username? Please try again later."
      );
      setIsAuthenticating(false);
    }
  }

  if (isAuthenticating) {
    return <LoadingOverlay message="Logging in user..." />;
  }

  return <AuthContent isLogin onAuthenticate={loginHandler} />;
}

export default LoginScreen;
