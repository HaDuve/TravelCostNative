import { useContext } from "react";
import React, { StyleSheet, Text, View, Image } from "react-native";
import Onboarding from "react-native-onboarding-swiper";
import { GlobalStyles } from "../constants/styles";
import { UserContext } from "../store/user-context";

const OnboardingScreen = ({ navigation }) => {
  const titleStyle = styles.titleStyle;
  const userCtx = useContext(UserContext);
  const needsOnboarding = userCtx.needsTour;
  if (!needsOnboarding) {
    navigation.replace("Login");
    return <></>;
  }
  return (
    <Onboarding
      onDone={() => navigation.replace("Signup")}
      onSkip={() => navigation.replace("Login")}
      pages={[
        {
          backgroundColor: GlobalStyles.colors.backgroundColor,
          image: (
            <Image source={require("../assets/Onboarding/Illustration1.png")} />
          ),
          title: "Travel in Style on a Budget",
          subtitle:
            "Maximize your travel budget without sacrificing comfort or experiences.",
          titleStyles: titleStyle,
        },
        {
          backgroundColor: GlobalStyles.colors.backgroundColor,
          image: (
            <Image source={require("../assets/Onboarding/Illustration2.png")} />
          ),
          title: "Simplify Group Travel Expenses",
          subtitle:
            "Easily split and track travel costs with friends and family, and make the most of your budget.",
          titleStyles: titleStyle,
        },
        {
          backgroundColor: GlobalStyles.colors.backgroundColor,
          image: (
            <Image source={require("../assets/Onboarding/Illustration3.png")} />
          ),
          title: "Achieve Your Financial Goals",
          subtitle:
            "Take control of your finances and plan your dream trip with Budget for Nomads budgeting and tracking tools.",
          titleStyles: titleStyle,
        },
      ]}
    />
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  titleStyle: {
    paddingHorizontal: "10%",
    marginTop: "-10%",
    fontSize: 28,
    fontWeight: "bold",
  },
});
