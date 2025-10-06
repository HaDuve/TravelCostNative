import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { useContext, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { GlobalStyles } from "../../constants/styles";
import { de, en, fr, ru } from "../../i18n/supportedLanguages";
import { NetworkContext } from "../../store/network-context";
import { TripContext } from "../../store/trip-context";
import { UserContext } from "../../store/user-context";
import { dynamicScale } from "../../util/scalingUtil";
import FlatButton from "../UI/FlatButton";
import GradientButton from "../UI/GradientButton";

//Localization

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
      Alert.alert(i18n.t("alertError"), i18n.t("getLocalPriceError"));
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

  // Use different styles based on whether we're in header mode or standalone
  const buttonStyle = style ? style : styles.settingsButton;

  return (
    <>
      <GradientButton
        style={buttonStyle}
        buttonStyle={styles.gradientButtonStyle}
        colors={GlobalStyles.gradientColorsButton}
        onPress={handleGetLocalPrice}
        darkText
      >
        <View style={styles.buttonContent}>
          <Image
            source={require("../../assets/chatgpt-logo.jpeg")}
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>{i18n.t("getLocalPriceTitle")}</Text>
        </View>
      </GradientButton>

      <Modal
        visible={showLocalPriceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleModalClose}
      >
        <KeyboardAvoidingView style={styles.modalOverlay} behavior="padding">
          <View style={[styles.modalContainer, GlobalStyles.strongShadow]}>
            <View style={styles.modalHeader}>
              <Image
                source={require("../../assets/chatgpt-logo.jpeg")}
                style={styles.modalIcon}
              />
              <Text style={styles.modalTitle}>
                {i18n.t("getLocalPriceModalTitle")}
              </Text>
            </View>

            <Text style={styles.modalSubtitle}>
              {i18n.t("getLocalPriceModalSubtitle")}
            </Text>

            <TextInput
              style={[styles.textInput, GlobalStyles.strongShadow]}
              value={productInput}
              onChangeText={setProductInput}
              placeholder={i18n.t("getLocalPricePlaceholder")}
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
                {i18n.t("getLocalPriceTitle")}
              </GradientButton>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  buttonContent: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: dynamicScale(-2, true),
    paddingTop: dynamicScale(2, true),
  },
  buttonIcon: {
    height: dynamicScale(18, false, 0.5),
    marginRight: dynamicScale(6, false, 0.5),
    width: dynamicScale(18, false, 0.5),
  },
  buttonText: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(16, false, 0.5),
    fontStyle: "italic",
    fontWeight: "300",
  },
  gradientButtonStyle: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 0, // Override GradientButton's default margin
  },
  modalButtons: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(20, false, 0.5),
    marginHorizontal: dynamicScale(20, false, 0.5),
    maxWidth: dynamicScale(400, false, 0.5),
    padding: dynamicScale(24, false, 0.5),
    width: "90%",
  },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: dynamicScale(16, true),
  },
  modalIcon: {
    height: dynamicScale(24, false, 0.5),
    marginRight: 8,
    width: dynamicScale(24, false, 0.5),
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "center",
  },
  modalSubtitle: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(16, false, 0.3),
    lineHeight: dynamicScale(22, true),
    marginBottom: dynamicScale(20, true),
    textAlign: "center",
  },
  modalTitle: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(20, false, 0.3),
    fontWeight: "bold",
  },
  settingsButton: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 16,
    justifyContent: "center",
    marginHorizontal: "8%",
    marginVertical: "2%",
    width: "100%",
  },
  submitButton: {
    flex: 1,
    marginLeft: dynamicScale(16, false, 0.5),
  },
  textInput: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderColor: GlobalStyles.colors.primaryGrayed,
    borderRadius: dynamicScale(12, false, 0.5),
    borderWidth: 1,
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(16, false, 0.3),
    marginBottom: dynamicScale(24, true),
    minHeight: dynamicScale(50, true),
    padding: dynamicScale(16, false, 0.5),
  },
});

export default GetLocalPriceButton;
