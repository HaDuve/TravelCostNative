import { Linking } from "react-native";

import { LinkButtonProps } from "../../types/components";
import safeLogError from "../../util/error";

import GradientButton from "./GradientButton";

const LinkingButton = ({
  children,
  URL,
  style = {},
  buttonStyle = {},
}: LinkButtonProps & { URL: string }) => {
  const handleClick = () => {
    Linking.canOpenURL(URL).then(supported => {
      if (supported) {
        Linking.openURL(URL);
      } else {
        safeLogError(`Unsupported URL: ${URL}`);
      }
    });
  };
  return (
    <GradientButton
      onPress={handleClick}
      style={style}
      buttonStyle={buttonStyle}
    >
      {children}
    </GradientButton>
  );
};

export default LinkingButton;
