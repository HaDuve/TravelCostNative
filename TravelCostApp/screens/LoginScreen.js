import AuthContent from "../components/Auth/AuthContent";
import { useContext, useEffect, useState } from "react";
import LoadingOverlay from "../components/UI/LoadingOverlay";
import { login } from "../util/auth";
import { Alert } from "react-native";
import { AuthContext } from "./../store/auth-context";
import { UserContext } from "../store/user-context";
import { fetchTripHistory, fetchUser } from "../util/http";
import { TripContext } from "../store/trip-context";

function LoginScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);

  async function loginHandler({ email, password }) {
    setIsAuthenticating(true);
    try {
      const { token, uid } = await login(email, password);
      authCtx.authenticate(token);
      authCtx.setUserID(uid);
      const res = await fetchTripHistory(uid);
      tripCtx.fetchAndSetCurrentTrip(res[0]);
      // tripCtx.setCurrentTrip(tripid, tripdata);
      // tripCtx.setCurrentTravellers(tripid);
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
