import PropTypes from "prop-types";
import Svg, { G, Path } from "react-native-svg";

import { GlobalStyles } from "../../constants/styles";
import { constantScale } from "../../util/scalingUtil";

const Width = constantScale(98, 0.08);
const Height = constantScale(80, 0.08);

function ToggleButton({ toggled = false }) {
  const borderColor = GlobalStyles.colors.primary400;
  const color1toggle = toggled
    ? GlobalStyles.colors.primary400
    : GlobalStyles.colors.backgroundColorLight;
  const color2toggle = !toggled
    ? GlobalStyles.colors.primary400
    : GlobalStyles.colors.backgroundColorLight;
  return (
    <Svg width={Width} height={Height} fill="none" viewBox="0 0 98 50">
      <G>
        <Path
          fill={color1toggle}
          d="M1 9a8 8 0 018-8h40v48H9a8 8 0 01-8-8V9z"
        ></Path>
        <Path
          fill={color2toggle}
          d="M39 19a4 4 0 01-4 4 3.93 3.93 0 01-1.87-.47l-5.78 6.3A4 4 0 0128 31a4 4 0 11-8 0 3.8 3.8 0 01.34-1.58l-2.9-2.25A3.94 3.94 0 0115 28a4 4 0 114-4 4 4 0 01-.33 1.58l2.89 2.25a4 4 0 014.32-.36l5.77-6.3A4 4 0 0131 19a4 4 0 118 0z"
        ></Path>
        <Path
          stroke={borderColor}
          d="M1 9a8 8 0 018-8h40v48H9a8 8 0 01-8-8V9z"
        ></Path>
        <Path
          fill={color2toggle}
          d="M49 1h40a8 8 0 018 8v32a8 8 0 01-8 8H49V1z"
        ></Path>
        <Path fill={color1toggle} d="M85 24H74V13a12 12 0 0111 11z"></Path>
        <Path
          fill={color1toggle}
          d="M85 26a12 12 0 11-13-13v12a1 1 0 001 1h12z"
        ></Path>
        <Path
          stroke={borderColor}
          d="M49 1h40a8 8 0 018 8v32a8 8 0 01-8 8H49V1z"
        ></Path>
      </G>
    </Svg>
  );
}

export default ToggleButton;

ToggleButton.propTypes = {
  toggled: PropTypes.bool,
};
