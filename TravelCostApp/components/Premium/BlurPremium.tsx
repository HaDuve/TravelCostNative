import { Alert, Platform, StyleSheet } from "react-native";
import React, { useContext, useEffect, useState } from "react";
import { BlurView } from "expo-blur";
import GradientButton from "../UI/GradientButton";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { GlobalStyles } from "../../constants/styles";
import { useGlobalStyles } from "../../store/theme-context";

import { i18n } from "../../i18n/i18n";

import Animated, { SlideInDown } from "react-native-reanimated";
import { Card } from "react-native-paper";
import { sleep } from "../../util/appState";
import { NetworkContext } from "../../store/network-context";
import { UserContext } from "../../store/user-context";
import FlatButton from "../UI/FlatButton";
import PropTypes from "prop-types";
import { shouldShowOnboarding } from "../Rating/firstStartUtil";
import { trackEvent } from "../../util/vexo-tracking";
import { VexoEvents } from "../../util/vexo-constants";

const BlurPremium = ({ canBack = false }) => {
  const GlobalStyles = useGlobalStyles();
  const styles = getStyles(GlobalStyles);
  const netCtx = useContext(NetworkContext);
  const userCtx = useContext(UserContext);
  const [isPremium, setIsPremium] = useState(false);
  const [focused, setFocused] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const startIntensity = 5;
  const [blurIntensity, setBlurIntensity] = useState(startIntensity);
  const navigation = useNavigation();
  const isAndroid = Platform.OS === "android";
  useEffect(() => {
    async function checkOnboardingState() {
      // Check if user is in onboarding state
      const shouldShowOnboardingFlow = await shouldShowOnboarding();
      const isFreshlyCreated = userCtx.freshlyCreated;
      const needsTour = userCtx.needsTour;

      // Suppress popup if user is in any onboarding state
      return shouldShowOnboardingFlow || isFreshlyCreated || needsTour;
    }
    async function checkPremium() {
      const checkPremi = await userCtx.checkPremium();
      const isOnboarding = await checkOnboardingState();
      setIsPremium(checkPremi && !isOnboarding);
    }
    checkPremium();
  }, [userCtx.isPremium, userCtx.freshlyCreated, userCtx.needsTour]);

  const isConnected = netCtx.isConnected && netCtx.strongConnection;

  const timeSteps = [
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    30,
  ];
  const blurIntensities = [
    1, 2, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 9, 9, 9, 9, 9,
  ];

  async function increaseIntensity() {
    for (let i = 0; i < timeSteps?.length; i++) {
      const sleepTime = timeSteps[i];
      await sleep(sleepTime);
      setBlurIntensity(blurIntensity + blurIntensities[i]);
    }
  }
  useFocusEffect(
    React.useCallback(() => {
      setFocused(true);
      if (blurIntensity < 20) increaseIntensity();
      return () => {
        setBlurIntensity(startIntensity);
        setFocused(false);
      };
    }, [])
  );

  const showBlurredCardJSX = (
    <BlurView
      intensity={isAndroid ? blurIntensity * 22 : blurIntensity}
      style={styles.titleContainerBlur}
    >
      {focused && (
        <Animated.View
          entering={SlideInDown.delay(600).springify().damping(11)}
        >
          <Card
            elevation={1}
            style={{
              //   backgroundColor: GlobalStyles.colors.gray300,
              padding: 30,
              // marginLeft: -55,
            }}
          >
            <GradientButton
              darkText
              buttonStyle={{}}
              colors={GlobalStyles.gradientColorsButton}
              onPress={() => {
                if (!isConnected) {
                  Alert.alert(
                    i18n.t("noConnection"),
                    i18n.t("checkConnectionError")
                  );
                  return;
                }
                trackEvent(VexoEvents.PREMIUM_BLUR_CARD_PRESSED);
                navigation.navigate("Paywall");
              }}
            >
              {i18n.t("paywallTitle")}
            </GradientButton>
            {canBack && (
              <FlatButton
                onPress={() => navigation.goBack()}
                textStyle={{ marginTop: 12, marginBottom: isAndroid ? 0 : -12 }}
              >
                Back
              </FlatButton>
            )}
          </Card>
        </Animated.View>
      )}
    </BlurView>
  );

  return <>{!isPremium && showBlurredCardJSX}</>;
};

export default BlurPremium;

BlurPremium.propTypes = {
  canBack: PropTypes.bool,
};

const getStyles = (GlobalStyles) =>
  StyleSheet.create({
  titleContainerBlur: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",

    ...Platform.select({
      ios: {
        paddingBottom: "2%",
        width: "100%",
        height: "100%",
      },
      android: {
        paddingBottom: "0%",
        width: "100%",
        height: "105%",
      },
    }),
  },
});
