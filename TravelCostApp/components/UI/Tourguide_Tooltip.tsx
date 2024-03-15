import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { IStep, Labels, TooltipProps } from "rn-tourguide";
import FlatButton from "./FlatButton";
import { GlobalStyles } from "../../constants/styles";
import { moderateScale, scale, verticalScale } from "../../util/scalingUtil";

export interface TooltipProp {
  isFirstStep?: boolean;
  isLastStep?: boolean;
  currentStep: IStep;
  labels?: Labels;
  handleNext?: () => void;
  handlePrev?: () => void;
  handleStop?: () => void;
}

export const CustomTooltip = ({
  isFirstStep,
  isLastStep,
  handleNext,
  handlePrev,
  handleStop,
  currentStep,
  labels,
}: TooltipProps) => (
  <View style={styles.containerView}>
    <View style={styles.tooltipContainer}>
      <Text testID="stepDescription" style={styles.tooltipText}>
        {currentStep && currentStep.text}
      </Text>
    </View>
    <View style={[styles.bottomBar]}>
      {!isLastStep ? (
        <TouchableOpacity onPress={handleStop}>
          <FlatButton onPress={handleStop}>{labels?.skip || "Skip"}</FlatButton>
        </TouchableOpacity>
      ) : null}
      {!isFirstStep ? (
        <TouchableOpacity onPress={handlePrev}>
          <FlatButton onPress={handlePrev}>
            {labels?.previous || "Previous"}
          </FlatButton>
        </TouchableOpacity>
      ) : null}
      {!isLastStep ? (
        <TouchableOpacity onPress={handleNext}>
          <FlatButton onPress={handleNext}>{labels?.next || "Next"}</FlatButton>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={handleStop}>
          <FlatButton onPress={handleStop}>
            {labels?.finish || "Finish"}
          </FlatButton>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  containerView: {
    borderRadius: 16,
    paddingTop: verticalScale(24),
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: verticalScale(16),
    width: scale(300),
    backgroundColor: "#ffffffef",
  },
  tooltip: {
    position: "absolute",
    paddingHorizontal: scale(15),
    overflow: "hidden",
    width: scale(300),
    borderRadius: 16,
    paddingTop: verticalScale(24),
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: verticalScale(16),
    zIndex: 1 - 1,
  },
  nonInteractionPlaceholder: {
    backgroundColor: "transparent",
    zIndex: 1 - 2,
  },
  tooltipText: {
    textAlign: "center",
    fontSize: moderateScale(14),
    fontWeight: "300",
  },
  tooltipContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    width: scale(220),
  },
  button: {
    padding: scale(10),
  },
  buttonText: {
    color: GlobalStyles.colors.primary700,
  },
  bottomBar: {
    marginTop: verticalScale(10),
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  overlayContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  },
});
