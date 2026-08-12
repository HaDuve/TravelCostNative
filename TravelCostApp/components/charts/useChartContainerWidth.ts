import { useLayoutProfile } from "../../store/layout-context";
import { useChartContainerWidth as useMeasuredChartWidth } from "../../store/chart-container-width-context";
import { useWindowSize } from "../Hooks/useWindowSize";

export function useChartContainerWidth() {
  const layout = useLayoutProfile();
  const { width: windowWidth } = useWindowSize();
  const frameWidth = Math.min(windowWidth, layout.contentMaxWidth);

  return useMeasuredChartWidth(frameWidth);
}
