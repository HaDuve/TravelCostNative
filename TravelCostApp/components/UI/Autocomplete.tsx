// Autocomplete/index.js

import { View, Platform } from "react-native";
import { Menu, TextInput } from "react-native-paper";
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { GlobalStyles } from "../../constants/styles";
import Animated, { FadeIn } from "react-native-reanimated";

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

  useEffect(() => {
    setValue(origValue);
  }, [origValue]);

  useEffect(() => {
    if (origValue == "") setMenuVisible(false);
  }, [origValue]);
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

  return (
    <View style={containerStyle}>
      <TextInput
        onFocus={() => {
          if (value?.length === 0) {
            setMenuVisible(true);
            if (showOnEmpty) setFilteredData([...new Set(data)]);
          }
        }}
        // maybe with a timeout
        onBlur={async () =>
          setTimeout(
            () => setMenuVisible(false),
            Platform.OS == "ios" ? 700 : 1200
          )
        }
        label={label}
        // right={right}
        // left={left}
        style={style}
        inputMode="text"
        mode="outlined"
        outlineColor={GlobalStyles.colors.primary700}
        textColor={GlobalStyles.colors.textColor}
        cursorColor={GlobalStyles.colors.textColor}
        placeholder={placeholder}
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
        <Animated.View
          entering={FadeIn.duration(500)}
          // exiting={FadeOutUp}
          style={{
            flex: 1,
            zIndex: 0,
            backgroundColor: GlobalStyles.colors.backgroundColor,
            borderWidth: 2,
            flexDirection: "column",
            borderColor: GlobalStyles.colors.primaryGrayed,
          }}
        >
          {
            // only show the newest 3 items
            filteredData.slice(0, 3).map((autotext, i) => (
              <Menu.Item
                key={i}
                style={[{ width: "100%" }, menuStyle]}
                //   icon={icon}
                onPress={() => {
                  origOnChange(autotext);
                  setValue(autotext);
                  setMenuVisible(false);
                }}
                title={autotext}
              />
            ))
          }
        </Animated.View>
      )}
    </View>
  );
};

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
