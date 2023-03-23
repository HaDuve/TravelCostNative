import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";

const BackgroundGradient = ({ colors, children, style }) => {
  return (
    <LinearGradient start={{ x: 2.3, y: 0.0 }} style={style} colors={colors}>
      {children}
    </LinearGradient>
  );
};

export default BackgroundGradient;

const styles = StyleSheet.create({});
