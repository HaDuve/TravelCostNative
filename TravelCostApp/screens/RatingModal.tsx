import { Button, StyleSheet, Text, View, Image, Pressable } from "react-native";
import React, { useState } from "react";
import Modal from "react-native-modal";
import { Linking, Platform } from "react-native";
import * as StoreReview from "expo-store-review";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
i18n.enableFallback = true;
// i18n.locale = "en";

import PropTypes from "prop-types";
import { GlobalStyles } from "../constants/styles";
import GradientButton from "../components/UI/GradientButton";
import FlatButton from "../components/UI/FlatButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { secureStoreSetObject } from "../store/secure-storage";

//TODO: set the according URLS when we are live!
export const APP_STORE_URL = `https://apps.apple.com/de/app/budget-for-nomads/id6446042796?l=${i18n.locale}`;
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.example.app";

export const neverAskAgain = async () => {
  await secureStoreSetObject("neverAskAgain", true);
};

const RatingModal = ({ isModalVisible, setIsModalVisible }) => {
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
                  width: 125,
                  height: 125,
                  margin: "4%",
                  // marginTop: "-4%",
                },
                android: {
                  width: 125,
                  height: 125,
                  margin: "4%",
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
              width: "80%",
              height: "10%",
              marginBottom: "20%",
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
    marginBottom: 40,
  },
  imageContainer: {
    overflow: "visible",

    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  titleContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  titleText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: GlobalStyles.colors.textColor,
  },
  subTitleContainer: {
    marginBottom: 20,
  },
  subTitleText: {
    fontSize: 16,
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
    padding: "6%",
    borderRadius: 10,
    marginHorizontal: "2%",
  },
});
