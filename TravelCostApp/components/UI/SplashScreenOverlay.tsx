import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Image,
  StatusBar,
  ActivityIndicator,
} from "react-native";
// TODO: find out why other activity indicators dont animate?
// import { ActivityIndicator } from "react-native-paper";
// import * as Progress from "react-native-progress";

import React from "react";
import { GlobalStyles } from "../../constants/styles";
import Animated, {
  FadeIn,
  FadeOutDown,
  FadeOutLeft,
  SlideInDown,
  SlideInRight,
  SlideInUp,
  SlideOutDown,
  SlideOutLeft,
  ZoomIn,
  ZoomInDown,
  ZoomInUp,
  ZoomOut,
  ZoomOutDown,
} from "react-native-reanimated";
import { SPLASH_SCREEN_DELAY } from "../../confAppConstants";

const loadingColor = GlobalStyles.colors.backgroundColor;
const delay = SPLASH_SCREEN_DELAY;
const SplashScreenOverlay = (containerStyle) => {
  return (
    <>
      {/* <StatusBar hidden /> */}
      <Animated.View
        // entering={ZoomIn.duration(400)}
        // exiting={SlideOutLeft.duration(800).delay(3500)}
        // exiting={SlideOutDown.duration(1600).delay(3500)}
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
            {/* <Progress.CircleSnail color={["red", "green", "blue"]} /> */}
          </Animated.View>
        </ImageBackground>
      </Animated.View>
    </>
  );
};

export default SplashScreenOverlay;

const styles = StyleSheet.create({});
