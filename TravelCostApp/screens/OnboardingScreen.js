import { StyleSheet, Text, View, Image } from "react-native";
import Onboarding from "react-native-onboarding-swiper";
import { GlobalStyles } from "../constants/styles";

const OnboardingScreen = ({ navigation }) => {
  const titleStyle = styles.titleStyle;
  return (
    <Onboarding
      onDone={() => navigation.replace("Signup")}
      onSkip={() => navigation.replace("Signup")}
      pages={[
        {
          backgroundColor: "white",
          image: (
            <Image source={require("../assets/Onboarding/Illustration1.png")} />
          ),
          title: "Gain total control of your money",
          subtitle: "Become your own money manager and make every cent count.",
          titleStyles: titleStyle,
        },
        {
          backgroundColor: "white",
          image: (
            <Image source={require("../assets/Onboarding/Illustration2.png")} />
          ),
          title: "Know where your money goes",
          subtitle:
            "Track your transaction easily, with categories and financial report.",
          titleStyles: titleStyle,
        },
        {
          backgroundColor: "white",
          image: (
            <Image source={require("../assets/Onboarding/Illustration3.png")} />
          ),
          title: "Planning ahead",
          subtitle:
            "Setup your budget for each category so you stay in control.",
          titleStyles: titleStyle,
        },
      ]}
    />
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  titleStyle: {
    paddingHorizontal: 40,
    fontSize: 32,
    fontWeight: "bold",
  },
});