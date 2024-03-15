import { useEffect, useState } from "react";
import { Dimensions } from "react-native";

export type OrientationState = "PORTRAIT" | "LANDSCAPE";

export function useOrientation() {
  const [orientation, setOrientation] = useState<OrientationState>("PORTRAIT");

  useEffect(() => {
    Dimensions.addEventListener("change", ({ window: { width, height } }) => {
      if (width < height) {
        setOrientation("PORTRAIT");
      } else {
        setOrientation("LANDSCAPE");
      }
    });
  }, []);

  return orientation;
}
