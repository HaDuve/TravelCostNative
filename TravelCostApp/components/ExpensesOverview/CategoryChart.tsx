import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { VictoryPie, VictoryTooltip } from "victory-native";
import Animated, { FadeOut, ZoomIn } from "react-native-reanimated";
import { getCatString } from "../../util/category";
import PropTypes from "prop-types";
import { useContext } from "react";
import { TripContext } from "../../store/trip-context";
import { getCurrencySymbol } from "../../util/currencySymbol";
import { GlobalStyles } from "../../constants/styles";
import {
  dynamicScale,
  moderateScale,
  scale,
  verticalScale,
} from "../../util/scalingUtil";
import { OrientationContext } from "../../store/orientation-context";

const CategoryChart = ({ inputData }) => {
  const tripCtx = useContext(TripContext);
  const tripCurrency = tripCtx.tripCurrency;
  const { isPortrait } = useContext(OrientationContext);

  const [useDummyData, setUseDummyData] = useState(true);
  let chartDataForRender = Array.from(inputData);
  // this little trick is necessary to make the pie animate on load.  For the very first render, pare down
  // the chartData array to just one element, then, for all future renders, use the fully array
  if (useDummyData) {
    chartDataForRender = inputData.slice(0, 1);
    setTimeout(() => {
      setUseDummyData(false);
    }, 100);
  }

  return (
    <Animated.View exiting={FadeOut} entering={ZoomIn} style={styles.container}>
      <VictoryPie
        data={chartDataForRender}
        height={isPortrait ? verticalScale(200) : dynamicScale(100, false, 0.5)}
        startAngle={-270}
        endAngle={90}
        animate={{
          duration: 500,
          onLoad: { duration: 0 },
        }}
        innerRadius={
          isPortrait
            ? dynamicScale(70, false, 0.5)
            : dynamicScale(30, false, 0.5)
        }
        padAngle={0}
        padding={isPortrait ? dynamicScale(10) : dynamicScale(8)}
        labelPlacement="vertical"
        style={{
          data: {
            fill: (d) =>
              d?.slice?.data?.color || GlobalStyles.colors.primary400,
          },
        }}
        labelComponent={
          <VictoryTooltip
            center={{ x: dynamicScale(207), y: verticalScale(96) }}
            constrainToVisibleArea
            renderInPortal={false}
            pointerLength={0}
          />
        }
        labels={({ datum }) => {
          return `${getCatString(datum.x)} ${Number(datum.y).toFixed(
            2
          )} ${getCurrencySymbol(tripCurrency)}`;
        }}
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
    paddingTop: verticalScale(60),
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: dynamicScale(100),
    borderRadius: 9999,
  },
});
