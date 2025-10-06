import { LinearGradient } from "expo-linear-gradient";
import PropTypes from "prop-types";

import { GlobalStyles } from "../../constants/styles";

const BackgroundGradient = ({ colors, children, style }) => {
  const defaultColors = GlobalStyles.gradientColors;
  const useColors = colors ? colors : defaultColors;
  return (
    <LinearGradient start={{ x: 2.3, y: 0.0 }} style={style} colors={useColors}>
      {children}
    </LinearGradient>
  );
};

export default BackgroundGradient;

BackgroundGradient.propTypes = {
  colors: PropTypes.array,
  children: PropTypes.node.isRequired,
  style: PropTypes.object,
};
