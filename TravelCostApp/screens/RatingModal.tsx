import { Button, StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import Modal from "react-native-modal";
import { Linking, Platform } from "react-native";
import * as StoreReview from "expo-store-review";
import PropTypes from "prop-types";
import { GlobalStyles } from "../constants/styles";
import GradientButton from "../components/UI/GradientButton";
import FlatButton from "../components/UI/FlatButton";
import AsyncStorage from "@react-native-async-storage/async-storage";

//TODO: set the according URLS when we are live!
export const APP_STORE_URL =
  "https://apps.apple.com/de/app/budget-for-nomads/id6446042796";
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.example.app";

export const neverAskAgain = async () => {
  await AsyncStorage.setItem("neverAskAgain", JSON.stringify(true));
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
    await AsyncStorage.setItem("remindLater", JSON.stringify(Date.now()));
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
      <View style={styles.reviewContainer}>
        <View style={styles.titleContainer}>
          <Text>Would you like to rate our app?</Text>
        </View>
        <View style={styles.buttonContainer}>
          <FlatButton onPress={handleNeverAskAgain}>{"Never"}</FlatButton>
          <FlatButton onPress={handleClose}>{"Later"}</FlatButton>
          <GradientButton onPress={handleRate}>{"Rate now!"}</GradientButton>
        </View>
      </View>
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
  titleContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
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
