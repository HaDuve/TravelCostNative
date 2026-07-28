import { ImageBackground, ActivityIndicator } from "react-native";
import { reloadApp } from "../../util/appState";
import React from "react";
import { GlobalStyles } from "../../constants/styles";
import Animated, {
  FadeOutDown,
  ZoomInDown,
  ZoomOutDown,
} from "react-native-reanimated";
import { SPLASH_SCREEN_DELAY } from "../../confAppConstants";
import { asyncStoreSafeClear } from "../../store/async-storage";
import ActionRow from "./ActionRow";

const loadingColor = GlobalStyles.colors.backgroundColor;
const delay = SPLASH_SCREEN_DELAY;
const SplashScreenOverlay = () => {
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
          <Animated.View entering={ZoomInDown.duration(1200).delay(3500)}>
            <ActionRow
              tier="secondary"
              label="Login / Signup"
              icon="refresh-outline"
              onPress={async () => {
                await asyncStoreSafeClear();
                await reloadApp();
              }}
              style={{ marginHorizontal: 24 }}
            />
          </Animated.View>
        </ImageBackground>
      </Animated.View>
    </>
  );
};

export default SplashScreenOverlay;
