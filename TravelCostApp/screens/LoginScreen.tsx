import AuthContent from "../components/Auth/AuthContent";
import { useContext, useEffect, useState } from "react";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { login } from "../util/auth";
import { Alert } from "react-native";
import { AuthContext } from "../store/auth-context";
import { UserContext } from "../store/user-context";
import {
  fetchCurrentTrip,
  fetchTrip,
  fetchTripHistory,
  fetchUser,
  fetchUserName,
} from "../util/http";
import { TripContext } from "../store/trip-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
      // check if user was deleted
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
        userCtx.setFreshlyCreatedTo(true);
      }
      //// END OF IMPORTANT CHECKS BEFORE ACTUALLY LOGGING IN IN APP.tsx OR LOGIN.tsx

      authCtx.setUserID(uid);
      authCtx.authenticate(token);
      try {
        const userData = await fetchUser(uid);
        const tripid = userData.currentTrip;
        if (userData) {
          userCtx.addUser(userData);
          const tripData = await fetchTrip(tripid);
          tripCtx.setCurrentTrip(tripid, tripData);
        }
      } catch (error) {
        Alert.alert(error);
      }
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
