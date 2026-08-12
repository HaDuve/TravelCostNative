import * as React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import type { LayoutProfile } from "../../util/layout";

type ContentFrameProps = {
  layout: LayoutProfile;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export default function ContentFrame({
  layout,
  children,
  style,
  testID,
}: ContentFrameProps) {
  return (
    <View
      testID={testID}
      style={[
        {
          width: "100%",
          maxWidth: layout.contentMaxWidth,
          alignSelf: "center",
          paddingHorizontal: layout.space(3),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
