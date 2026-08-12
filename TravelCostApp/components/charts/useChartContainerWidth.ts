import { useLayoutProfile } from "../../store/layout-context";
import { useWindowSize } from "../Hooks/useWindowSize";

export function useChartContainerWidth() {
  const layout = useLayoutProfile();
  const { width: windowWidth } = useWindowSize();

  return Math.min(windowWidth, layout.contentMaxWidth);
}
