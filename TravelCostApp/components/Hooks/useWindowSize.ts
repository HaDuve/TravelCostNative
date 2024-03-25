import { useEffect, useState } from "react";
import { Dimensions } from "react-native";

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  });

  useEffect(() => {
    Dimensions.addEventListener("change", ({ window: { width, height } }) => {
      setWindowSize({ width, height });
    });
  }, []);

  return windowSize;
}
