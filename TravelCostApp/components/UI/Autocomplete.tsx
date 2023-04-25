// Autocomplete/index.js

import { View } from "react-native";
import { Menu, TextInput } from "react-native-paper";
import React, { useState } from "react";
import PropTypes from "prop-types";
import { GlobalStyles } from "../../constants/styles";

const Autocomplete = ({
  value: origValue,
  label,
  data,
  containerStyle,
  onChange: origOnChange,
  icon = "bike",
  style = {},
  menuStyle = {},
  right = () => {},
  left = () => {},
}) => {
  const [value, setValue] = useState(origValue);
  const [menuVisible, setMenuVisible] = useState(false);
  const [filteredData, setFilteredData] = useState([]);

  const filterData = (text) => {
    return data.filter(
      (val) => val?.toLowerCase()?.indexOf(text?.toLowerCase()) > -1
    );
  };
  return (
    <View style={[containerStyle]}>
      <TextInput
        onFocus={() => {
          if (value.length === 0) {
            setMenuVisible(true);
          }
        }}
        // maybe with a timeout
        onBlur={async () => setTimeout(() => setMenuVisible(false), 1200)}
        label={label}
        right={right}
        left={left}
        style={style}
        onChangeText={(text) => {
          origOnChange(text);
          if (text && text.length > 0) {
            setFilteredData(filterData(text));
          } else if (text && text.length === 0) {
            setFilteredData(data);
          }
          setMenuVisible(true);
          setValue(text);
        }}
        value={value}
      />
      {menuVisible && filteredData && (
        <View
          style={{
            flex: 1,
            backgroundColor: GlobalStyles.colors.gray500,
            borderWidth: 2,
            flexDirection: "column",
            borderColor: "grey",
          }}
        >
          {
            // only show the newest 3 items
            filteredData.slice(0, 3).map((datum, i) => (
              <Menu.Item
                key={i}
                style={[{ width: "100%" }, menuStyle]}
                //   icon={icon}
                onPress={() => {
                  origOnChange(datum);
                  setValue(datum);
                  setMenuVisible(false);
                }}
                title={datum}
              />
            ))
          }
        </View>
      )}
    </View>
  );
};

export default Autocomplete;

Autocomplete.propTypes = {
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  data: PropTypes.array.isRequired,
  containerStyle: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  icon: PropTypes.string,
  style: PropTypes.object,
  menuStyle: PropTypes.object,
  right: PropTypes.func,
  left: PropTypes.func,
};
