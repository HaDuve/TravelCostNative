import React from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import PropTypes from "prop-types";
import { GlobalStyles } from "../../constants/styles";
import Animated from "react-native-reanimated";

const BottomTabsBar = ({
  state,
  descriptors,
  navigation,
  tabBarActiveTintColor,
  tabBarIndicatorStyle,
  tabBarLabelStyle,
}) => {
  const { routes } = state;
  const { setOptions } = useNavigation();

  // Define your tab icons and labels here
  const tabIcons = [
    { icon: "ios-list", label: "Home" },
    { icon: "ios-stats-chart-outline", label: "Charts" },
    { icon: "person", label: "Profile" },
    { icon: "cog-outline", label: "Settings" },
  ];

  return (
    <LinearGradient
      colors={[...GlobalStyles.tabBarColors]}
      start={{ x: -1, y: -1 }}
      end={{ x: 3, y: -0.5 }}
      style={styles.gradient}
    >
      <Animated.View style={styles.tabBar}>
        {routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          // Define your custom styles for the tabs here
          const tabStyles = {
            backgroundColor: isFocused
              ? "transparent"
              : "rgba(255, 255, 255, 0.1)",
            borderBottomWidth: isFocused ? 4 : 0,
            borderBottomColor: isFocused
              ? GlobalStyles.colors.primaryGrayed
              : "transparent",
          };

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tab, tabStyles]}
            >
              <Ionicons
                name={tabIcons[index].icon}
                size={24}
                color={
                  isFocused ? GlobalStyles.colors.primaryGrayed : "#b3b3b3"
                }
              />
              {isFocused && (
                <View style={styles.label}>
                  <Text style={styles.labelText}>{tabIcons[index].label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </LinearGradient>
  );
};

export default BottomTabsBar;

BottomTabsBar.propTypes = {
  state: PropTypes.object.isRequired,
  descriptors: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired,
  tabBarActiveTintColor: PropTypes.string,
  tabBarIndicatorStyle: PropTypes.object,
  tabBarLabelStyle: PropTypes.object,
};

const styles = StyleSheet.create({
  gradient: {
    height: 60,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 60,
  },
  label: {
    position: "absolute",
    bottom: 6,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  labelText: {
    color: GlobalStyles.colors.primaryGrayed,
    fontSize: 10,
  },
});
