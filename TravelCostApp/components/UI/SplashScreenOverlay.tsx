import { ImageBackground, ActivityIndicator } from "react-native";
import { reloadApp } from "../../util/appState";
import React from "react";
import { GlobalStyles } from "../../constants/styles";
import { useGlobalStyles } from "../../store/theme-context";
import Animated, {
  FadeOutDown,
  ZoomInDown,
  ZoomOutDown,
} from "react-native-reanimated";
import { SPLASH_SCREEN_DELAY } from "../../confAppConstants";
import FlatButton from "./FlatButton";
import { asyncStoreSafeClear } from "../../store/async-storage";
import IconButton from "./IconButton";

const delay = SPLASH_SCREEN_DELAY;
const SplashScreenOverlay = () => {
  const GlobalStyles = useGlobalStyles();
  const loadingColor = GlobalStyles.colors.backgroundColor;
  return (
    <>
      <Animated.View
        exiting={FadeOutDown.duration(800).delay(delay + 500)}
        style={{
          flex: 1,
          backgroundColor: GlobalStyles.colors.backgroundColor,
        }}
      >
        <ImageBackground
          source={require("../../assets/launch2.png")}
          resizeMode={"cover"}
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Animated.View
            entering={ZoomInDown.duration(1200).delay(200)}
            exiting={ZoomOutDown.duration(1200).delay(delay)}
            style={{
              paddingTop: "60%",
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size={"large"} color={loadingColor} />
          </Animated.View>
          <Animated.View
            entering={ZoomInDown.duration(1200).delay(3500)}
            style={{ flexDirection: "row" }}
          >
            <IconButton
              onPress={async () => {
                await asyncStoreSafeClear();
                await reloadApp();
              }}
              icon={"chevron-back-outline"}
              size={24}
              color={"black"}
            ></IconButton>
            <FlatButton
              textStyle={{ color: "black" }}
              onPress={async () => {
                await asyncStoreSafeClear();
                await reloadApp();
              }}
            >
              Login / Signup
            </FlatButton>
          </Animated.View>
        </ImageBackground>
      </Animated.View>
    </>
  );
};

export default SplashScreenOverlay;
