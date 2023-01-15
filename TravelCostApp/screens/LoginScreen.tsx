import AuthContent from "../components/Auth/AuthContent";
import React, { useContext, useState } from "react";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { login } from "../util/auth";
import { Alert } from "react-native";
import { AuthContext } from "../store/auth-context";
import { UserContext } from "../store/user-context";
import { fetchUser } from "../util/http";
import { TripContext } from "../store/trip-context";
import { asyncStoreSetItem } from "../store/async-storage";

function LoginScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);

  async function loginHandler({ email, password }) {
    setIsAuthenticating(true);
    try {
      const { token, uid } = await login(email, password);
      //// START OF IMPORTANT CHECKS BEFORE ACTUALLY LOGGING IN IN APP.tsx OR LOGIN.tsx
      const checkUser = await fetchUser(uid);
      console.log("loginHandler ~ checkUser", checkUser);
      // Check if the user logged in but there is no userName, we deleted the account
      if (!checkUser || !checkUser.userName) {
        Alert.alert(
          "Your Account was deleted or AppData was reset, please create a new account!"
        );
        authCtx.logout();
      }
      if (checkUser.userName && !checkUser.currentTrip) {
        // we infer freshly created if no current trip exists but we assigned a name already
        console.log(
          "loginHandler ~ we set to freshly because username but no current trip!"
        );
        userCtx.setFreshlyCreatedTo(true);
      }
      //// END OF IMPORTANT CHECKS BEFORE ACTUALLY LOGGING IN IN APP.tsx OR LOGIN.tsx
      try {
        const userData = await fetchUser(uid);
        console.log("loginHandler ~ userData", userData);
        const tripid = userData.currentTrip;
        asyncStoreSetItem("currentTripId", tripid);
        if (!userData) {
          console.error("no userData");
        } else {
          userCtx.addUser(userData);
          tripCtx.fetchAndSetCurrentTrip(tripid);
        }
      } catch (error) {
        Alert.alert("Errow while fetching user!!: ", error);
      }
      authCtx.setUserID(uid);
      authCtx.authenticate(token);
    } catch (error) {
      console.error(error);
      setIsAuthenticating(false);
      Alert.alert(
        "Authentication failed!",
        "Failed to login. Wrong password or Username? Please try again later."
      );
      authCtx.logout();
    }
  }

  if (isAuthenticating) {
    return <LoadingOverlay message="Logging in user..." />;
  }

  return <AuthContent isLogin onAuthenticate={loginHandler} />;
}

export default LoginScreen;
