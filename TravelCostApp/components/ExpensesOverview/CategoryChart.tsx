import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { VictoryPie, VictoryTooltip } from "victory-native";
import { GlobalStyles } from "../../constants/styles";
import Animated, {
  FadeInRight,
  FadeOut,
  FadeOutLeft,
  ZoomIn,
  ZoomInEasyUp,
  ZoomInRight,
  ZoomOut,
  ZoomOutEasyUp,
  ZoomOutLeft,
} from "react-native-reanimated";
import { getCatString } from "../../util/category";
import PropTypes from "prop-types";
import { useContext } from "react";
import { TripContext } from "../../store/trip-context";
import getSymbolFromCurrency from "currency-symbol-map";

const CategoryChart = ({ inputData }) => {
  const tripCtx = useContext(TripContext);
  const tripCurrency = tripCtx.tripCurrency;
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
        height={200}
        startAngle={-270}
        endAngle={90}
        animate={{
          duration: 500,
          onLoad: { duration: 0 },
        }}
        innerRadius={70}
        padAngle={0}
        padding={10}
        labelPlacement="vertical"
        style={{
          data: {
            fill: (d) => d.slice.data.color,
          },
        }}
        labelComponent={
          <VictoryTooltip
            center={{ x: 207, y: 96 }}
            constrainToVisibleArea
            renderInPortal={false}
            pointerLength={0}
          />
        }
        labels={({ datum }) => {
          return `${getCatString(datum.x)} ${Number(datum.y).toFixed(
            2
          )} ${getSymbolFromCurrency(tripCurrency)}`;
          // return `${datum.x[0].toUpperCase()}${datum.x.slice(1)}`;
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
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: "25%",
    borderRadius: 9999,
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
});
