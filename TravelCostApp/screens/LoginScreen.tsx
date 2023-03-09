import AuthContent from "../components/Auth/AuthContent";
import React, { useContext, useState } from "react";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { login } from "../util/auth";
import { Alert } from "react-native";
import { AuthContext } from "../store/auth-context";
import { UserContext } from "../store/user-context";
import { fetchUser } from "../util/http";
import { TripContext } from "../store/trip-context";
import { asyncStoreSetItem, asyncStoreSetObject } from "../store/async-storage";
import Toast from "react-native-toast-message";

function LoginScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);

  async function loginHandler({ email, password }) {
    setIsAuthenticating(true);
    // Check internet connection first
    if (!(await userCtx.checkConnectionUpdateUser())) {
      Alert.alert("No internet connection", "Please try again later.");
      setIsAuthenticating(false);
      return;
    }
    try {
      const { token, uid } = await login(email, password);
      //// START OF IMPORTANT CHECKS BEFORE ACTUALLY LOGGING IN IN APP.tsx OR LOGIN.tsx
      const checkUser = await fetchUser(uid);
      console.log("loginHandler ~ checkUser", checkUser);
      // Check if the user logged in but there is no userName, we deleted the account
      if (!checkUser || !checkUser.userName) {
        Toast.show({
          type: "error",
          position: "top",
          text1: "Exceptional Error",
          text2: "Please try again later!",
          visibilityTime: 4000,
        });
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
        if (!userData) {
          console.error("no userData");
        } else {
          asyncStoreSetItem("currentTripId", tripid);
          tripCtx.setTripid(tripid);
          userCtx.addUser(userData);
          await tripCtx.fetchAndSetCurrentTrip(tripid);
          tripCtx.refresh();
        }
      } catch (error) {
        Alert.alert("Error while logging in: ", error);
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
