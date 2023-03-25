import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ImageBackground,
  Image,
  StatusBar,
} from "react-native";
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

const loadingColor = GlobalStyles.colors.backgroundColor;
const SplashScreenOverlay = (containerStyle) => {
  return (
    <>
      {/* <StatusBar hidden /> */}
      <Animated.View
        // entering={ZoomIn.duration(400)}
        // exiting={SlideOutLeft.duration(800).delay(3500)}
        // exiting={SlideOutDown.duration(1600).delay(3500)}
        exiting={FadeOutDown.duration(800).delay(3500)}
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
            exiting={ZoomOutDown.duration(1200).delay(3000)}
            style={{
              paddingTop: "60%",
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size={"large"} color={loadingColor} />
          </Animated.View>
        </ImageBackground>
      </Animated.View>
    </>
  );
};

export default SplashScreenOverlay;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  text: {
    color: loadingColor,
    fontSize: 18,
    fontWeight: "300",
    marginTop: 12,
  },
});
