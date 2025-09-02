import React from "react";
import { StyleSheet } from "react-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";
import PropTypes from "prop-types";
import { useContext } from "react";
import { dynamicScale } from "../../util/scalingUtil";
import { OrientationContext } from "../../store/orientation-context";
import WIPChart from "../WIPChart";

const CategoryChart = ({ inputData }) => {
  const { isPortrait } = useContext(OrientationContext);

  const height = isPortrait ? dynamicScale(200, true) : dynamicScale(400, false, 0.5);
  const width = dynamicScale(300);

  return (
    <Animated.View exiting={FadeOut} entering={ZoomIn} style={styles.container}>
      <WIPChart 
        title="Category Chart"
        height={height}
        width={width}
      />
    </Animated.View>
  );
};

export default CategoryChart;

CategoryChart.propTypes = {
  inputData: PropTypes.array,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: dynamicScale(12),
    paddingTop: dynamicScale(60, true),
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: dynamicScale(100),
    borderRadius: 9999,
  },
});
