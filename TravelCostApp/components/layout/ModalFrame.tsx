import * as React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import type { LayoutProfile } from "../../util/layout";
import { isModalWide, MODAL_MAX_WIDTH } from "../../util/modal-frame-layout";

type ModalFrameProps = {
  layout: LayoutProfile;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export default function ModalFrame({
  layout,
  children,
  style,
  testID,
}: ModalFrameProps) {
  const wide = isModalWide(layout);

  return (
    <View
      testID={testID}
      style={[
        {
          width: "100%",
          ...(wide
            ? {
                maxWidth: MODAL_MAX_WIDTH,
                alignSelf: "center",
              }
            : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
