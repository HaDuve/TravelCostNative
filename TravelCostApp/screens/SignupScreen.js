import AsyncStorage from "@react-native-async-storage/async-storage";
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
      await AsyncStorage.clear();
      userCtx.setTripHistory([]);
      authCtx.setUserID(uid);
      const userdata = { name: name, tripHistory: [] };
      try {
        storeUser(uid, userdata);
      } catch (error) {
        console.log("signupHandler ~ error", error);
        Alert.alert(
          "Storing User failed",
          "Could not create user, please try other credentials or try again later."
        );
      }
      userCtx.setUserName(name);
      userCtx.setFreshlyCreatedTo(true);
      authCtx.authenticate(token);
    } catch (error) {
      console.log("signupHandler ~ error", error);
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
