import { StyleSheet, Text, View, Image } from "react-native";
import Onboarding from "react-native-onboarding-swiper";
import { GlobalStyles } from "../constants/styles";

const OnboardingScreen = ({ navigation }) => {
  const titleStyle = styles.titleStyle;
  // TODO: make onboarding only come once per installation
  // https://blog.openreplay.com/setting-up-onboarding-screens-in-react-native/
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
          title: "Gain total control of your money",
          subtitle: "Become your own money manager and make every cent count.",
          titleStyles: titleStyle,
        },
        {
          backgroundColor: GlobalStyles.colors.backgroundColor,
          image: (
            <Image source={require("../assets/Onboarding/Illustration2.png")} />
          ),
          title: "Know where your money goes",
          subtitle:
            "Track your transactions easily, with categories and financial report.",
          titleStyles: titleStyle,
        },
        {
          backgroundColor: GlobalStyles.colors.backgroundColor,
          image: (
            <Image source={require("../assets/Onboarding/Illustration3.png")} />
          ),
          title: "Planning ahead",
          subtitle:
            "Set up your budget for each category so you are in control.",
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
