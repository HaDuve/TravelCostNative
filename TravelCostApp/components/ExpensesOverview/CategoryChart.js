import React from "react";
import { StyleSheet, View } from "react-native";
import { G } from "react-native-svg";
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
import { getDateMinusDays } from "../../util/date";

const CategoryChart = ({ inputData }) => {
  return (
    <View style={styles.container}>
      <VictoryPie
        data={inputData}
        height={200}
        startAngle={-270}
        endAngle={90}
        animate={{ duration: 2000, onLoad: { duration: 500 } }}
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
    </View>
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
