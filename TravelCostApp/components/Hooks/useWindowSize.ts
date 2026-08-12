import { useEffect, useState } from "react";
import { Dimensions, type ScaledSize } from "react-native";

function readWindowSize(): ScaledSize {
  return Dimensions.get("window");
}

export function useWindowSize() {
  const [windowSize, setWindowSize] = useState(readWindowSize);

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", (event) => {
      const next = event?.window;
      if (
        next &&
        typeof next.width === "number" &&
        typeof next.height === "number"
      ) {
        setWindowSize(next);
      }
    });

    return () => subscription.remove();
  }, []);

  return windowSize;
}
