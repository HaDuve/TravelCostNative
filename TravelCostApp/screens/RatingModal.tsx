import { StyleSheet, Text, View } from "react-native";
import React from "react";

const RatingModal = () => {
  const handleRate = async () => {
    if (StoreReview.isAvailableAsync()) {
      // Request the in-app review
      await StoreReview.requestReview();
    } else {
      // Fallback to opening the app store
      const url = Platform.OS === "ios" ? appStoreURL : playStoreURL;
      Linking.openURL(url);
    }
    setIsModalVisible(false);
  };

  const handleClose = () => {
    setIsModalVisible(false);
  };

  return (
    <Modal isVisible={isModalVisible}>
      <View style={/* your modal styles */}>
        <Text>Would you like to rate our app?</Text>
        <Button title="Rate now" onPress={handleRate} />
        <Button title="Later" onPress={handleClose} />
      </View>
    </Modal>
  );
};

export default RatingModal;

const styles = StyleSheet.create({});
