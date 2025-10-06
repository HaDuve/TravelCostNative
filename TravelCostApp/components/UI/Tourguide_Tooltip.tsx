import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { IStep, Labels, TooltipProps } from "rn-tourguide";

import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";

import FlatButton from "./FlatButton";

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
    <View style={styles.bottomBar}>
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
  bottomBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: dynamicScale(10, true),
  },
  button: {
    padding: dynamicScale(10),
  },
  buttonText: {
    color: GlobalStyles.colors.primary700,
  },
  container: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1,
  },
  containerView: {
    alignItems: "center",
    backgroundColor: "#ffffffef",
    borderRadius: 16,
    justifyContent: "center",
    paddingBottom: dynamicScale(16, true),
    paddingTop: dynamicScale(24, true),
    width: dynamicScale(300),
  },
  nonInteractionPlaceholder: {
    backgroundColor: "transparent",
    zIndex: 1 - 2,
  },
  overlayContainer: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  tooltip: {
    alignItems: "center",
    borderRadius: 16,
    justifyContent: "center",
    overflow: "hidden",
    paddingBottom: dynamicScale(16, true),
    paddingHorizontal: dynamicScale(15),
    paddingTop: dynamicScale(24, true),
    position: "absolute",
    width: dynamicScale(300),
    zIndex: 1 - 1,
  },
  tooltipContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "space-around",
    width: dynamicScale(220),
  },
  tooltipText: {
    fontSize: dynamicScale(14, false, 0.5),
    fontWeight: "300",
    textAlign: "center",
  },
});
