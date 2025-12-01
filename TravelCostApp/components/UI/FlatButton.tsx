import React, { Pressable, StyleSheet, Text, View } from "react-native";

import { GlobalStyles } from "../../constants/styles";
import PropTypes from "prop-types";

function FlatButton({ children, onPress, textStyle = {} }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && GlobalStyles.pressed]}
      onPress={onPress}
    >
      <View>
        <Text style={[GlobalStyles.buttonTextFlat, textStyle]}>{children}</Text>
      </View>
    </Pressable>
  );
}

export default FlatButton;
FlatButton.propTypes = {
  children: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  textStyle: PropTypes.object,
};

FlatButton.propTypes = {
  children: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  textStyle: PropTypes.object,
};

const styles = StyleSheet.create({
  button: {
    padding: 12,
  },
  pressed: {
    opacity: 0.5,
  },
});
