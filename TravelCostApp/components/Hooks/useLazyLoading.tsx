import React, { useEffect, useRef, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import LoadingOverlay from "../UI/LoadingOverlay";

/**
 * Custom hook that implements lazy loading for tab screens.
 * Returns a loading component until the screen has been focused at least once.
 * This improves initial app performance by deferring rendering of non-active tabs.
 * 
 * @returns Object containing:
 *  - shouldRender: boolean indicating if the screen content should be rendered
 *  - LoadingComponent: JSX element to show while content is not yet loaded
 */
export const useLazyLoading = () => {
  const isFocused = useIsFocused();
  const hasBeenFocused = useRef(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isFocused && !hasBeenFocused.current) {
      hasBeenFocused.current = true;
      setShouldRender(true);
    }
  }, [isFocused]);

  const LoadingComponent = <LoadingOverlay noText size="large" />;

  return {
    shouldRender,
    LoadingComponent,
  };
};
