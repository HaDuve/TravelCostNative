// Autocomplete/index.js

import { View, StyleSheet, Text, Pressable } from "react-native";
import { TextInput } from "react-native-paper";
import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import { GlobalStyles } from "../../constants/styles";
import { dynamicScale } from "../../util/scalingUtil";

const suggestionMenuStackStyle = {
  zIndex: 1000,
  elevation: 8,
};

/** Paper only draws outlined-label edge cover when roundness > 6 */
const MIN_OUTLINE_ROUNDNESS = 8;

function resolveFieldRoundness(style: object): number {
  const flat = StyleSheet.flatten(style) ?? {};
  const fromStyle =
    typeof flat.borderRadius === "number" ? flat.borderRadius : MIN_OUTLINE_ROUNDNESS;
  return Math.max(fromStyle, MIN_OUTLINE_ROUNDNESS);
}

const Autocomplete = ({
  value: origValue,
  label,
  data,
  containerStyle,
  showOnEmpty,
  onChange: origOnChange,
  placeholder,
  style = {},
  menuStyle = {},
}) => {
  const [value, setValue] = useState(origValue);
  const [menuVisible, setMenuVisible] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  const [blurTimeout, setBlurTimeout] = useState(null);
  const isSelectingRef = useRef(false);

  useEffect(() => {
    setValue(origValue);
  }, [origValue]);

  useEffect(() => {
    if (origValue == "") setMenuVisible(false);
  }, [origValue]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeout) {
        clearTimeout(blurTimeout);
      }
    };
  }, [blurTimeout]);
  /**
   * Filters the data array based on the provided text and removes duplicate results.
   * @param {string} text - The text to filter the data array with.
   * @returns {Array} - The filtered data array.
   */
  function filterData(text: string) {
    const filteredData = data.filter(
      (val) => val?.toLowerCase()?.indexOf(text?.toLowerCase()) > -1
    );
    // remove copies
    return [...new Set(filteredData)];
  }

  const flatFieldStyle = StyleSheet.flatten(style) ?? {};
  const fieldBackground =
    (flatFieldStyle.backgroundColor as string | undefined) ??
    GlobalStyles.colors.backgroundColorLight;
  const fieldRoundness = resolveFieldRoundness(style);
  const fieldStyle = {
    ...flatFieldStyle,
    backgroundColor: fieldBackground,
    borderRadius: fieldRoundness,
  };

  const selectSuggestion = (autotext: string) => {
    isSelectingRef.current = true;

    if (blurTimeout) {
      clearTimeout(blurTimeout);
      setBlurTimeout(null);
    }

    origOnChange(autotext);
    setValue(autotext);

    setTimeout(() => {
      setMenuVisible(false);
      isSelectingRef.current = false;
    }, 50);
  };

  return (
    <View
      testID="autocomplete-container"
      style={[
        containerStyle,
        { overflow: "visible", zIndex: menuVisible ? 10 : 1 },
      ]}
    >
      {label ? (
        <Text testID="autocomplete-label" style={styles.fieldLabel}>
          {label}
        </Text>
      ) : null}
      <TextInput
        testID="autocomplete-field"
        theme={{
          roundness: fieldRoundness,
          colors: {
            background: fieldBackground,
          },
        }}
        outlineStyle={{ borderRadius: fieldRoundness }}
        selectTextOnFocus
        onFocus={() => {
          if (value?.length === 0) {
            setMenuVisible(true);
            if (showOnEmpty) setFilteredData([...new Set(data)]);
          }
        }}
        onBlur={() => {
          if (isSelectingRef.current) {
            return;
          }

          const timeoutId = setTimeout(() => {
            if (!isSelectingRef.current) {
              setMenuVisible(false);
            }
          }, 5000);
          setBlurTimeout(timeoutId);
        }}
        placeholder={placeholder}
        style={fieldStyle}
        inputMode="text"
        mode="outlined"
        outlineColor={GlobalStyles.colors.primary700}
        textColor={GlobalStyles.colors.textColor}
        cursorColor={GlobalStyles.colors.textColor}
        activeOutlineColor={GlobalStyles.colors.primary700}
        underlineColor={GlobalStyles.colors.accent250}
        selectionColor={GlobalStyles.colors.primary700}
        onChangeText={(text) => {
          origOnChange(text);
          if (text && text?.length > 0) {
            setFilteredData(filterData(text));
          } else if (text && text?.length === 0) {
            setFilteredData([]);
          }
          setMenuVisible(true);
          setValue(text);
        }}
        value={value}
      />
      {menuVisible && filteredData && filteredData.length > 0 && (
        <View
          testID="autocomplete-suggestions"
          style={[
            styles.suggestionsList,
            menuStyle,
            suggestionMenuStackStyle,
          ]}
        >
          {filteredData.slice(0, 3).map((autotext, i) => (
            <Pressable
              key={i}
              testID={`autocomplete-suggestion-${i}`}
              style={({ pressed }) => [
                styles.suggestionItem,
                pressed && styles.suggestionItemPressed,
              ]}
              onPress={() => selectSuggestion(autotext)}
            >
              <Text
                testID={`autocomplete-suggestion-${i}-text`}
                style={styles.suggestionText}
                numberOfLines={1}
              >
                {autotext}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: dynamicScale(12, false, 0.3),
    color: GlobalStyles.colors.primary700,
    marginBottom: dynamicScale(4, true, 0.3),
    marginLeft: dynamicScale(4, false, 0.3),
  },
  suggestionsList: {
    maxWidth: "100%",
    width: "100%",
    paddingHorizontal: dynamicScale(8, false, 0.3),
  },
  suggestionItem: {
    backgroundColor: GlobalStyles.colors.backgroundColor,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.primaryGrayed,
    maxWidth: "100%",
    paddingVertical: dynamicScale(10, false, 0.3),
    paddingHorizontal: dynamicScale(12, false, 0.3),
    justifyContent: "center",
  },
  suggestionItemPressed: {
    backgroundColor: GlobalStyles.colors.gray300,
  },
  suggestionText: {
    color: GlobalStyles.colors.textColor,
    fontSize: dynamicScale(12, false, 0.3),
  },
});

export default Autocomplete;
// react-native/Libraries/Lists/VirtualizedList.js
Autocomplete.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  data: PropTypes.array.isRequired,
  containerStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onChange: PropTypes.func.isRequired,
  showOnEmpty: PropTypes.bool,
  placeholder: PropTypes.string,
  icon: PropTypes.string,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  menuStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};
