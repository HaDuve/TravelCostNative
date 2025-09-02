import React, { useContext } from "react";
import { StyleSheet, View } from "react-native";
import PropTypes from "prop-types";
import { dynamicScale } from "../../util/scalingUtil";
import { OrientationContext } from "../../store/orientation-context";
import WIPChart from "../WIPChart";

const ExpenseChart = ({
  inputData,
  xAxis,
  yAxis,
  budget,
  currency,
  navigation,
  expenses,
}) => {
  const { isLandscape, isTablet } = useContext(OrientationContext);
  
  const hTabletScaling = isLandscape ? 1.7 : 1.9;
  const hPhoneScaling = isLandscape ? 16 : 1.9;
  const wTabletScaling = isLandscape ? 0.8 : 1;
  const wPhoneScaling = isLandscape ? 10 : 0.1;
  const hScaling = isTablet ? hTabletScaling : hPhoneScaling;
  const wScaling = isTablet ? wTabletScaling : wPhoneScaling;
  const height = dynamicScale(240, false, hScaling);
  const width = dynamicScale(460, false, wScaling);

  return (
    <View style={styles.container}>
      <WIPChart 
        title="Expense Chart"
        height={height}
        width={width}
      />
    </View>
  );
};

export default ExpenseChart;

ExpenseChart.propTypes = {
  inputData: PropTypes.array,
  xAxis: PropTypes.string,
  yAxis: PropTypes.string,
  budgetAxis: PropTypes.string,
  budget: PropTypes.number,
  daysRange: PropTypes.number,
  currency: PropTypes.string,
  navigation: PropTypes.object,
  expenses: PropTypes.array,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
  },
});
