import * as StoreReview from "expo-store-review";
import React, { useContext } from "react";
import {
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Modal from "react-native-modal";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { de, en, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import PropTypes from "prop-types";
import FlatButton from "../components/UI/FlatButton";
import GradientButton from "../components/UI/GradientButton";
import { GlobalStyles } from "../constants/styles";
import { secureStoreSetObject } from "../store/secure-storage";
import {
  dynamicScale,
  moderateScale,
  scale,
  verticalScale,
} from "../util/scalingUtil";
import { OrientationContext } from "../store/orientation-context";

//TODO: set the according URLS when we are live!
export const APP_STORE_URL = `https://apps.apple.com/de/app/budget-for-nomads/id6446042796?l=${i18n.locale}`;
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.budgetfornomads.app";
export const neverAskAgain = async () => {
  await secureStoreSetObject("neverAskAgain", true);
};

const RatingModal = ({ isModalVisible, setIsModalVisible }) => {
  const { isPortrait } = useContext(OrientationContext);

  const handleRate = async () => {
    if (StoreReview.isAvailableAsync()) {
      // Request the in-app review
      await StoreReview.requestReview();
    } else {
      // Fallback to opening the app store
      const url = Platform.OS === "android" ? PLAY_STORE_URL : APP_STORE_URL;
      Linking.openURL(url);
    }
    await neverAskAgain();
    setIsModalVisible(false);
  };

  const handleClose = async () => {
    await secureStoreSetObject("remindLater", Date.now());
    setIsModalVisible(false);
  };

  const handleNeverAskAgain = async () => {
    await neverAskAgain();
    setIsModalVisible(false);
  };

  return (
    <Modal
      style={styles.modalStyle}
      animationInTiming={400}
      animationOutTiming={800}
      isVisible={isModalVisible}
      onSwipeComplete={handleClose}
      swipeDirection={["up", "left", "right", "down"]}
      onBackdropPress={handleClose}
      onBackButtonPress={handleClose}
    >
      <Pressable onPress={handleRate} style={styles.reviewContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{i18n.t("rateModalTitle")}</Text>
        </View>
        <Image
          source={require("../assets/icon2.png")}
          style={[
            {
              ...Platform.select({
                ios: {
                  width: dynamicScale(125, false, 0.6),
                  height: dynamicScale(125, false, 0.6),
                  margin: dynamicScale(12, false, 0.5),
                  // marginTop: "-4%",
                },
                android: {
                  width: dynamicScale(125, false, 0.5),
                  height: dynamicScale(125, false, 0.5),
                  margin: dynamicScale(12, false, 0.5),
                },
              }),
            },
            { overflow: "visible" },
          ]}
        />

        <Image
          source={require("../assets/stars.png")}
          style={[
            {
              width: dynamicScale(180),
              height: dynamicScale(24, true),
              marginBottom: dynamicScale(12, true),
            },
            { overflow: "visible" },
          ]}
        />

        <View style={styles.subTitleContainer}>
          <Text style={styles.subTitleText}>{i18n.t("rateModalSubTitle")}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <FlatButton onPress={handleNeverAskAgain}>
            {i18n.t("never")}
          </FlatButton>
          <FlatButton onPress={handleClose}>{i18n.t("later")}</FlatButton>
          <GradientButton onPress={handleRate}>
            {i18n.t("rateModalButton")}
          </GradientButton>
        </View>
      </Pressable>
    </Modal>
  );
};

export default RatingModal;

RatingModal.propTypes = {
  isModalVisible: PropTypes.bool.isRequired,
  setIsModalVisible: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  modalStyle: {
    justifyContent: "flex-end",
    marginBottom: dynamicScale(40, true),
  },
  imageContainer: {
    overflow: "visible",

    alignItems: "center",
    justifyContent: "center",
    marginBottom: dynamicScale(20, true),
  },
  titleContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: dynamicScale(20, true),
  },
  titleText: {
    fontSize: dynamicScale(20, false, 0.5),
    fontWeight: "bold",
    textAlign: "center",
    color: GlobalStyles.colors.textColor,
  },
  subTitleContainer: {
    marginBottom: dynamicScale(20, true),
  },
  subTitleText: {
    fontSize: dynamicScale(16, false, 0.5),
    textAlign: "center",
    color: GlobalStyles.colors.textColor,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
  },
  reviewContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    padding: dynamicScale(18),
    borderRadius: dynamicScale(10, false, 0.5),
    marginHorizontal: dynamicScale(12),
  },
});
