import React, { StyleSheet, Image } from "react-native";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import Onboarding from "react-native-onboarding-swiper";
import { GlobalStyles } from "../constants/styles";
import PropTypes from "prop-types";
import { moderateScale, scale } from "../util/scalingUtil";

const OnboardingScreen = ({ navigation }) => {
  return (
    <Onboarding
      onDone={() => navigation.replace("Signup")}
      onSkip={() => navigation.replace("Signup")}
      pages={[
        {
          backgroundColor: GlobalStyles.colors.backgroundColor,
          image: (
            <Image source={require("../assets/Onboarding/Illustration1.png")} />
          ),
          title: i18n.t("onb1"),
          subtitle: i18n.t("onb1t"),
          titleStyles: styles.titleStyle,
        },
        {
          backgroundColor: GlobalStyles.colors.backgroundColor,
          image: (
            <Image source={require("../assets/Onboarding/Illustration2.png")} />
          ),
          title: i18n.t("onb2"),
          subtitle: i18n.t("onb2t"),
          titleStyles: styles.titleStyle,
        },
        {
          backgroundColor: GlobalStyles.colors.backgroundColor,
          image: (
            <Image source={require("../assets/Onboarding/Illustration3.png")} />
          ),
          title: i18n.t("onb3"),
          subtitle: i18n.t("onb3t"),
          titleStyles: styles.titleStyle,
        },
      ]}
    />
  );
};

export default OnboardingScreen;

OnboardingScreen.propTypes = {
  navigation: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  titleStyle: {
    paddingHorizontal: scale(20),
    marginTop: scale(-20),
    fontSize: moderateScale(28),
    fontWeight: "bold",
  },
});
