import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Modal from "react-native-modal";
import { i18n } from "../../i18n/i18n";
import { GlobalStyles } from "../../constants/styles";
import { useGlobalStyles } from "../../store/theme-context";
import FlatButton from "./FlatButton";
import { dynamicScale } from "../../util/scalingUtil";
import PropTypes from "prop-types";

const TrafficLightInfoModal = ({ isVisible, onClose }) => {
  const GlobalStyles = useGlobalStyles();
  const styles = getStyles(GlobalStyles);
  return (
    <Modal
      isVisible={isVisible}
      style={styles.modalStyle}
      backdropOpacity={0.5}
      onSwipeComplete={onClose}
      swipeDirection={["up", "left", "right", "down"]}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
    >
      <View style={styles.infoModalContainer}>
        <Text style={styles.infoTitleText}>
          {i18n.t("trafficLightInfoTitle")}
        </Text>
        <Text style={styles.infoContentText}>
          {i18n.t("trafficLightInfoText")}
        </Text>
        <FlatButton onPress={onClose}>{i18n.t("confirm")}</FlatButton>
      </View>
    </Modal>
  );
};

export default TrafficLightInfoModal;

TrafficLightInfoModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

const getStyles = (GlobalStyles) =>
  StyleSheet.create({
  modalStyle: {
    justifyContent: "center",
    alignItems: "center",
    margin: 0,
  },
  infoModalContainer: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(20),
    padding: dynamicScale(24),
    marginHorizontal: dynamicScale(20),
    maxWidth: "90%",
    alignItems: "center",
  },
  infoTitleText: {
    fontSize: dynamicScale(20, false, 0.5),
    fontWeight: "bold",
    color: GlobalStyles.colors.textColor,
    marginBottom: dynamicScale(16, true),
    textAlign: "center",
  },
  infoContentText: {
    fontSize: dynamicScale(14, false, 0.5),
    color: GlobalStyles.colors.textColor,
    marginBottom: dynamicScale(24, true),
    textAlign: "center",
    lineHeight: dynamicScale(20, false, 0.5),
  },
});
