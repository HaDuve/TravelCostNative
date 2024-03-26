import { Dimensions, PixelRatio } from "react-native";

// this will only get called on start of the app, might lead to scaling issues
const { width, height } = Dimensions.get("window");

//Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 350;
const guidelineBaseHeight = 680;

const scale = (size: number) => (width / guidelineBaseWidth) * size;
const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export { scale, verticalScale, moderateScale };

// dynamic function for calling updated values on every render
/**
 * Calculates the dynamic scale of a given size based on the device's screen dimensions.
 * This function can be used to calculate sizings during every render frame.
 * @param size - The size to be scaled.
 * @param vertical - Optional. Specifies whether the scaling should be applied vertically. Default is false.
 * @param moderateFactor - Optional. The factor by which to moderate the scaling. Default is null, which equates to a factor of 1. Standard moderation factor should be 0.5 (eg. for icon sizes and font sizes)
 * @returns The dynamically scaled size.
 */
export const dynamicScale = (
  size: number,
  vertical = false,
  moderateFactor: number = null
) => {
  let returnSize = 0;
  const { width, height } = Dimensions.get("window");
  const isPortrait = width < height;
  const dynamicBaseWidth = isPortrait ? 350 : 680;
  // const dynamicBaseWidth = 350;
  const dynamicBaseHeight = isPortrait ? 680 : 350;
  // const dynamicBaseHeight = 680;
  const hSize = (height / dynamicBaseHeight) * size;
  const wSize = (width / dynamicBaseWidth) * size;
  if (moderateFactor != null) {
    // moderation
    returnSize = !vertical
      ? hSize + (hSize - size) * moderateFactor
      : wSize + (wSize - size) * moderateFactor;
    return returnSize;
  }
  // no moderation
  returnSize = !vertical ? hSize : wSize;
  return returnSize;
};

export const isTablet = () => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = width * pixelDensity;
  const adjustedHeight = height * pixelDensity;
  if (pixelDensity < 2 && (adjustedWidth >= 1000 || adjustedHeight >= 1000)) {
    return true;
  } else
    return (
      pixelDensity === 2 && (adjustedWidth >= 1920 || adjustedHeight >= 1920)
    );
};
