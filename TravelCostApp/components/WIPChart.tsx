import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { GlobalStyles } from "../constants/styles";
import { dynamicScale } from "../util/scalingUtil";

interface WIPChartProps {
  title: string;
  height?: number;
  width?: number;
}

const WIPChart: React.FC<WIPChartProps> = ({ 
  title, 
  height = dynamicScale(200), 
  width = dynamicScale(300) 
}) => {
  return (
    <View style={[styles.container, { height, width }]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Chart Coming Soon</Text>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>📊</Text>
      </View>
    </View>
  );
};

export default WIPChart;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray400,
    borderRadius: 8,
    padding: dynamicScale(16),
  },
  title: {
    fontSize: dynamicScale(16),
    fontWeight: "bold",
    color: GlobalStyles.colors.textPrimary || GlobalStyles.colors.gray800,
    marginBottom: dynamicScale(8),
    textAlign: "center",
  },
  subtitle: {
    fontSize: dynamicScale(12),
    color: GlobalStyles.colors.textSecondary || GlobalStyles.colors.gray600,
    marginBottom: dynamicScale(16),
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: dynamicScale(32),
    opacity: 0.3,
  },
});