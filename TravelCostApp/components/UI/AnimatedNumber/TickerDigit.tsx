import { View, StyleSheet, StyleProp, TextStyle } from "react-native";
import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import Tick from "./Tick";

interface TickerDigitProps {
  value: number;
  index: number;
  fontSize: number;
  textStyle?: StyleProp<TextStyle>;
}

const NUMBERS = Array.from({ length: 10 }, (_, i) => i);

/**
 * TickerDigit component that displays a vertical list of numbers and animates to the target value
 */
const TickerDigit: React.FC<TickerDigitProps> = ({
  value,
  index,
  fontSize,
  textStyle,
}) => {
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withDelay(
      index * 50,
      withSpring(-value * fontSize, {
        damping: 20,
        stiffness: 200,
      })
    );
  }, [value, fontSize, index, offset]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <View style={[styles.container, { height: fontSize }]}>
      <Animated.View style={animatedStyle}>
        {NUMBERS.map((number) => (
          <Tick
            key={number}
            fontSize={fontSize}
            style={[styles.digit, textStyle]}
          >
            {number}
          </Tick>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  digit: {
    alignSelf: "center",
  },
});

export default TickerDigit;
