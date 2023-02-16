import React, { useState } from "react";
import { StyleSheet } from "react-native";
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLine,
  VictoryPie,
  VictoryScatter,
  VictoryTheme,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from "victory-native";
import { GlobalStyles } from "../../constants/styles";
import Animated, {
  FadeInRight,
  FadeInUp,
  FadeOutLeft,
} from "react-native-reanimated";
import { getCatString } from "../../util/category";

const CategoryChart = ({ inputData }) => {
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
    <Animated.View
      entering={FadeInRight.duration(1000)}
      exiting={FadeOutLeft.duration(1000)}
      style={styles.container}
    >
      <VictoryPie
        data={chartDataForRender}
        height={200}
        startAngle={-270}
        endAngle={90}
        animate={{
          duration: 500,
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
            center={{ x: 184, y: 94 }}
            constrainToVisibleArea
            renderInPortal={false}
            pointerLength={0}
          />
        }
        labels={({ datum }) => {
          return getCatString(datum.x);
          // return `${datum.x[0].toUpperCase()}${datum.x.slice(1)}`;
        }}
      />
    </Animated.View>
  );
};

export default CategoryChart;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
});
