import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Modal from "react-native-modal";
import { i18n } from "../../i18n/i18n";
import { GlobalStyles } from "../../constants/styles";
import ActionRow from "./ActionRow";
import { dynamicScale } from "../../util/scalingUtil";
import PropTypes from "prop-types";

const SettingsInfoModal = ({ isVisible, title, text, onClose }) => {
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
        <Text style={styles.infoTitleText}>{title}</Text>
        <Text style={styles.infoContentText}>{text}</Text>
        <ActionRow
          tier="primary"
          label={i18n.t("confirm")}
          icon="checkmark-outline"
          showChevron={false}
          compact
          onPress={onClose}
          style={styles.confirmButton}
        />
      </View>
    </Modal>
  );
};

export default SettingsInfoModal;

SettingsInfoModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
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
  confirmButton: {
    alignSelf: "stretch",
  },
});
