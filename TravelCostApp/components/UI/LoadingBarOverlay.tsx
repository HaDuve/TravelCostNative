import { StyleSheet, Text, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";

import React, { useEffect, useRef, useState } from "react";
import { GlobalStyles } from "../../constants/styles";

//localization
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import { en, de, fr, ru } from "../../i18n/supportedLanguages";
import PropTypes from "prop-types";
import Animated, { Easing, EasingNode } from "react-native-reanimated";
import * as Progress from "react-native-progress";
import LoadingOverlay from "./LoadingOverlay";
const i18n = new I18n({ en, de, fr, ru });
i18n.locale = Localization.locale.slice(0, 2);
// i18n.locale = "en";
i18n.enableFallback = true;

const loadingColor = GlobalStyles.colors.primary500;
const unfilledColor = GlobalStyles.colors.gray600;
const LoadingBarOverlay = (props) => {
  const {
    containerStyle,
    progressAt,
    progressMax,
    customText,
    noText,
    barWidth = 100,
  } = props;
  let { progress, size } = props;
  const renderedText = customText ?? "Uploading your Expenses ... "; //i18n.t("uploadingExpenses");
  if (!size) size = "large";

  // if progress is smaller than 0
  if (!progress || isNaN(Number(progress)))
    return (
      <LoadingOverlay
        size={size}
        containerStyle={containerStyle}
        customText={customText}
        noText={noText}
      />
    );
  if (progress < 0) {
    progress = 0;
  }
  // if progress is bigger than 1
  if (progress > 1) {
    progress = 1;
  }
  const progressMaxGiven = progressMax && !isNaN(Number(progressMax));
  const progressAtGiven = progressAt && !isNaN(Number(progressAt));
  const progressMaxIsBiggerThanProgressAt =
    progressMaxGiven && progressAtGiven && progressMax > progressAt;
  const validProgress = progressMaxIsBiggerThanProgressAt;
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.headerContainer}>
        <ActivityIndicator size={size} color={loadingColor} />
        {!noText && <Text style={styles.text}>{renderedText}</Text>}
      </View>
      <Progress.Bar
        color={loadingColor}
        unfilledColor={unfilledColor}
        borderWidth={0}
        borderRadius={8}
        progress={progress}
        height={14}
        width={barWidth}
      />
      {validProgress && (
        <Text style={styles.text}>
          {progressAt}/{progressMax}
        </Text>
      )}
    </View>
  );
};

export default LoadingBarOverlay;

LoadingBarOverlay.propTypes = {
  containerStyle: PropTypes.object,
  progress: PropTypes.number,
  progressAt: PropTypes.number,
  progressMax: PropTypes.number,
  customText: PropTypes.string,
  noText: PropTypes.bool,
  size: PropTypes.string,
  barWidth: PropTypes.number,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: "6%",
    paddingTop: "10%",
    margin: "6%",
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: "6%",
  },
  text: {
    color: loadingColor,
    fontSize: 18,
    fontWeight: "300",
    marginTop: 12,
  },
});
