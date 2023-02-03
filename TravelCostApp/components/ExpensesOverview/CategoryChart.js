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
} from "victory-native";
import { GlobalStyles } from "../../constants/styles";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";

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
      entering={FadeInRight}
      exiting={FadeOutLeft}
      style={styles.container}
    >
      <VictoryPie
        data={chartDataForRender}
        height={200}
        startAngle={-270}
        endAngle={90}
        animate={{
          duration: 500,
          onLoad: { duration: 500 },
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
        labels={
          ({ datum }) => ""
          //   `${datum.x[0].toUpperCase()}${datum.x.slice(1, 3)}`
        }
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
