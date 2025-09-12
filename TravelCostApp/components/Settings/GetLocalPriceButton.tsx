import React, { useState, useContext } from "react";
import {
  Alert,
  View,
  Text,
  Modal,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { UserContext } from "../../store/user-context";
import { TripContext } from "../../store/trip-context";
import { NetworkContext } from "../../store/network-context";
import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";
import GradientButton from "../UI/GradientButton";
import FlatButton from "../UI/FlatButton";
import PropTypes from "prop-types";

//Localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale =
  Localization.getLocales()[0] && Localization.getLocales()[0].languageCode
    ? Localization.getLocales()[0].languageCode.slice(0, 2)
    : "en";
i18n.enableFallback = true;

const GetLocalPriceButton = ({ navigation, style }) => {
  const userCtx = useContext(UserContext);
  const tripCtx = useContext(TripContext);
  const netCtx = useContext(NetworkContext);
  const isConnected = netCtx.isConnected;

  const [showLocalPriceModal, setShowLocalPriceModal] = useState(false);
  const [productInput, setProductInput] = useState("");

  const handleGetLocalPrice = () => {
    if (!isConnected) {
      Alert.alert(i18n.t("noConnection"), i18n.t("checkConnectionError"));
      return;
    }
    setShowLocalPriceModal(true);
  };

  const handleLocalPriceSubmit = () => {
    if (!productInput.trim()) {
      Alert.alert("Error", "Please enter a product or service name");
      return;
    }

    setShowLocalPriceModal(false);
    navigation.navigate("GPTDeal", {
      price: "",
      currency: userCtx.lastCurrency || tripCtx.tripCurrency || "EUR",
      country: userCtx.lastCountry || "Germany",
      product: productInput.trim(),
    });
    setProductInput("");
  };

  const handleModalClose = () => {
    setShowLocalPriceModal(false);
    setProductInput("");
  };

  return (
    <>
      <GradientButton
        style={[styles.settingsButton, style]}
        buttonStyle={{ padding: 8, paddingHorizontal: 12 }}
        colors={GlobalStyles.gradientColorsButton}
        onPress={handleGetLocalPrice}
        darkText
      >
        <View style={styles.buttonContent}>
          <Image
            source={require("../../assets/chatgpt-logo.jpeg")}
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>Get Local Price</Text>
        </View>
      </GradientButton>

      <Modal
        visible={showLocalPriceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, GlobalStyles.strongShadow]}>
            <View style={styles.modalHeader}>
              <Image
                source={require("../../assets/chatgpt-logo.jpeg")}
                style={styles.modalIcon}
              />
              <Text style={styles.modalTitle}>Get Local Price</Text>
            </View>

            <Text style={styles.modalSubtitle}>
              What product or service would you like to check the price of?
            </Text>

            <TextInput
              style={[styles.textInput, GlobalStyles.strongShadow]}
              value={productInput}
              onChangeText={setProductInput}
              placeholder="e.g., Coffee, Coworking space, Apartment rental..."
              placeholderTextColor={GlobalStyles.colors.gray700}
              autoFocus={true}
              multiline={false}
              returnKeyType="done"
              onSubmitEditing={handleLocalPriceSubmit}
            />

            <View style={styles.modalButtons}>
              <FlatButton
                onPress={handleModalClose}
                textStyle={{ fontSize: 16 }}
              >
                {i18n.t("cancel")}
              </FlatButton>
              <GradientButton
                style={styles.submitButton}
                colors={GlobalStyles.gradientColorsButton}
                onPress={handleLocalPriceSubmit}
                darkText
                buttonStyle={{ padding: 8, paddingHorizontal: 12 }}
              >
                Get Price
              </GradientButton>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

GetLocalPriceButton.propTypes = {
  navigation: PropTypes.object.isRequired,
  style: PropTypes.object,
};

const styles = StyleSheet.create({
  settingsButton: {
    marginVertical: dynamicScale(8, true),
    marginHorizontal: dynamicScale(32, false, 0.5),
    borderRadius: 16,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    width: dynamicScale(16, false, 0.5),
    height: dynamicScale(16, false, 0.5),
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    color: GlobalStyles.colors.textColor,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(20, false, 0.5),
    padding: dynamicScale(24, false, 0.5),
    marginHorizontal: dynamicScale(20, false, 0.5),
    maxWidth: dynamicScale(400, false, 0.5),
    width: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: dynamicScale(16, true),
  },
  modalIcon: {
    width: dynamicScale(24, false, 0.5),
    height: dynamicScale(24, false, 0.5),
    marginRight: 8,
  },
  modalTitle: {
    fontSize: dynamicScale(20, false, 0.3),
    fontWeight: "bold",
    color: GlobalStyles.colors.textColor,
  },
  modalSubtitle: {
    fontSize: dynamicScale(16, false, 0.3),
    color: GlobalStyles.colors.textColor,
    textAlign: "center",
    marginBottom: dynamicScale(20, true),
    lineHeight: dynamicScale(22, true),
  },
  textInput: {
    borderWidth: 1,
    borderColor: GlobalStyles.colors.primaryGrayed,
    borderRadius: dynamicScale(12, false, 0.5),
    padding: dynamicScale(16, false, 0.5),
    fontSize: dynamicScale(16, false, 0.3),
    color: GlobalStyles.colors.textColor,
    backgroundColor: GlobalStyles.colors.backgroundColor,
    marginBottom: dynamicScale(24, true),
    minHeight: dynamicScale(50, true),
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  submitButton: {
    marginLeft: dynamicScale(16, false, 0.5),
    flex: 1,
  },
});

export default GetLocalPriceButton;
