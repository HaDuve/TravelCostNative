import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  type ModalProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import PropTypes from "prop-types";

import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";

export type AppModalProps = {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  testID?: string;
  backdropTestID?: string;
  animationType?: ModalProps["animationType"];
  contentStyle?: StyleProp<ViewStyle>;
  contentTestID?: string;
};

const AppModal = ({
  isVisible,
  onClose,
  children,
  testID,
  backdropTestID = "app-modal-backdrop",
  animationType = "slide",
  contentStyle,
  contentTestID,
}: AppModalProps) => {
  return (
    <Modal
      visible={isVisible}
      animationType={animationType}
      transparent
      onRequestClose={onClose}
      testID={testID}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={onClose}
        testID={backdropTestID}
        accessibilityRole="button"
      >
        <Pressable onPress={(event) => event.stopPropagation()}>
          <View
            testID={contentTestID}
            style={[styles.modalContainer, contentStyle]}
          >
            {children}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

AppModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  testID: PropTypes.string,
  backdropTestID: PropTypes.string,
  animationType: PropTypes.string,
  contentStyle: PropTypes.object,
  contentTestID: PropTypes.string,
};

export default AppModal;

const styles = StyleSheet.create({
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
    maxHeight: "80%",
    ...GlobalStyles.strongShadow,
  },
});
