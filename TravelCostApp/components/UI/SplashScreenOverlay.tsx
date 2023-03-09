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
const loadingColor = GlobalStyles.colors.primaryGrayed;
const SplashScreenOverlay = (containerStyle) => {
  const image = { uri: "/assets/splash.png" };
  return (
    <>
      <StatusBar hidden />
      <View style={{ flex: 1 }}>
        <ImageBackground
          source={require("../../assets/splash.png")}
          resizeMode={"cover"}
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <View
            style={{
              paddingTop: "60%",
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size={"large"} color={loadingColor} />
          </View>
        </ImageBackground>
      </View>
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
