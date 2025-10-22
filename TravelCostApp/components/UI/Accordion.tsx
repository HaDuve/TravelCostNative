import React, { useState } from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";
import PropTypes from "prop-types";

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  icon?: keyof typeof Ionicons.glyphMap;
  defaultExpanded?: boolean;
}

const Accordion = ({
  title,
  children,
  icon = "settings-outline",
  defaultExpanded = false,
}: AccordionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.container}>
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
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={dynamicScale(16, false, 0.5)}
          color={GlobalStyles.colors.gray700}
        />
      </Pressable>

      {isExpanded && <View style={styles.content}>{children}</View>}
    </View>
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
    ...GlobalStyles.shadowPrimary,
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
    paddingHorizontal: dynamicScale(16),
    paddingVertical: dynamicScale(8, true),
  },
});
