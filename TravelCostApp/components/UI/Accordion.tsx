import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";
import PropTypes from "prop-types";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolate,
  runOnJS,
} from "react-native-reanimated";

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
  defaultExpanded?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

const Accordion = ({
  title,
  children,
  icon = "settings-outline",
  defaultExpanded = false,
  containerStyle,
}: AccordionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isAnimating, setIsAnimating] = useState(false);
  const [measuredHeight, setMeasuredHeight] = useState(0);

  // Animation values
  const height = useSharedValue(defaultExpanded ? 1 : 0);
  const rotation = useSharedValue(defaultExpanded ? 180 : 0);
  const opacity = useSharedValue(defaultExpanded ? 1 : 0);

  const toggleExpanded = () => {
    if (isAnimating) return; // Prevent multiple animations

    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    setIsAnimating(true);

    // Animate chevron rotation
    rotation.value = withSpring(newExpanded ? 180 : 0, {
      damping: 15,
      stiffness: 150,
    });

    // Animate content height and opacity
    if (newExpanded) {
      opacity.value = withTiming(1, { duration: 200 });
      height.value = withSpring(
        1,
        {
          damping: 20,
          stiffness: 100,
        },
        () => {
          runOnJS(setIsAnimating)(false);
        }
      );
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      height.value = withTiming(0, { duration: 200 }, () => {
        runOnJS(setIsAnimating)(false);
      });
    }
  };

  // Animated styles
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(
        height.value,
        [0, 1],
        [0, measuredHeight || 400], // Use measured height or fallback
        Extrapolate.CLAMP
      ),
      opacity: opacity.value,
      overflow: "hidden",
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Pressable
        style={({ pressed }) => [
          styles.header,
          pressed && GlobalStyles.pressed,
        ]}
        onPress={toggleExpanded}
      >
        <View style={styles.headerContent}>
          <Ionicons
            name={icon}
            size={dynamicScale(20, false, 0.5)}
            color={GlobalStyles.colors.primary500}
          />
          <Text style={styles.title}>{title}</Text>
        </View>
        <Animated.View style={chevronStyle}>
          <Ionicons
            name="chevron-down"
            size={dynamicScale(16, false, 0.5)}
            color={GlobalStyles.colors.gray700}
          />
        </Animated.View>
      </Pressable>

      {/* Hidden content for measuring height */}
      <View
        style={styles.hiddenContent}
        pointerEvents="none"
        onLayout={(event) => {
          const { height } = event.nativeEvent.layout;
          if (height > 0 && measuredHeight === 0) {
            setMeasuredHeight(height);
          }
        }}
      >
        <View style={styles.contentInner}>{children}</View>
      </View>

      <Animated.View style={[styles.content, contentStyle]}>
        <View style={styles.contentInner}>{children}</View>
      </Animated.View>
    </Animated.View>
  );
};

export default Accordion;

Accordion.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  icon: PropTypes.string,
  defaultExpanded: PropTypes.bool,
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderRadius: dynamicScale(8, false, 0.5),
    marginVertical: dynamicScale(4, true),
    marginHorizontal: dynamicScale(16),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: dynamicScale(16),
    paddingVertical: dynamicScale(12, true),
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.gray300,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  title: {
    fontSize: dynamicScale(16, false, 0.5),
    color: GlobalStyles.colors.textColor,
    fontWeight: "500",
    marginLeft: dynamicScale(8),
  },
  content: {
    // Height and opacity are handled by animation
  },
  contentInner: {
    paddingHorizontal: dynamicScale(16),
    paddingVertical: dynamicScale(8, true),
  },
  hiddenContent: {
    position: "absolute",
    top: -10000, // Move off-screen
    left: 0,
    right: 0,
    opacity: 0,
    zIndex: -1, // Ensure it's behind everything
    pointerEvents: "none", // Prevent any interaction
  },
});
