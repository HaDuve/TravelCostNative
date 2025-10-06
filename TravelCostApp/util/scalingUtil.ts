import { Dimensions, PixelRatio } from "react-native";

// this Dimensions.get will only be called once at the start of the app
const { width: Startup_Width, height: Startup_Height } =
  Dimensions.get("window");

//Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 667;
const tabletScaleMult = 1.2;
const phoneScaleMult = 0.9;

const scale = (size: number) => (Startup_Width / guidelineBaseWidth) * size;
const verticalScale = (size: number) =>
  (Startup_Height / guidelineBaseHeight) * size;
const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// dynamic function for calling updated values on every render
/**
 * Calculates the dynamic scale of a given size based on the device's screen dimensions.
 * This function can be used to calculate sizings during every render frame.
 * @param size - The size to be scaled.
 * @param vertical - Optional. Specifies whether the scaling should be applied vertically. Default is false.
 * @param moderateFactor - Optional. The factor by which to moderate the scaling. Default is null, which equates to a factor of 1. Standard moderation factor should be 0.5 (eg. for icon sizes and font sizes)
 * @returns The dynamically scaled size.
 */
const dynamicScale = (
  size: number,
  vertical = false,
  moderateFactor: number = null
) => {
  let returnSize = 0;
  const { width, height } = Dimensions.get("window");
  const isPortrait = width < height;
  const dynamicBaseWidth = isPortrait
    ? guidelineBaseWidth
    : guidelineBaseHeight;
  // const dynamicBaseWidth = guidelineBaseWidth;
  const dynamicBaseHeight = isPortrait
    ? guidelineBaseHeight
    : guidelineBaseWidth;
  // const dynamicBaseHeight = guidelineBaseHeight;
  const isATablet = isTablet();
  const scaling =
    (dynamicBaseHeight / (isPortrait ? height : width)) *
    (isATablet ? tabletScaleMult : phoneScaleMult);

  const hSize = (height / dynamicBaseHeight) * size;
  const wSize = (width / dynamicBaseWidth) * size;
  if (moderateFactor != null) {
    // moderation
    returnSize = !vertical
      ? hSize + (hSize - size) * moderateFactor
      : wSize + (wSize - size) * moderateFactor;
    return returnSize * scaling;
  }
  // no moderation
  returnSize = !vertical ? hSize : wSize;
  return returnSize;
};

const constantScale = (size: number, moderateFactor: number = null) => {
  const { width, height } = Dimensions.get("window");
  const smallerDim = Math.min(width, height);
  const baseDim = guidelineBaseWidth;
  const isATablet = isTablet();
  const scaling =
    (baseDim / smallerDim) * (isATablet ? tabletScaleMult : phoneScaleMult);
  const dimSize = (smallerDim / baseDim) * size;
  if (moderateFactor != null) {
    const returnSize = dimSize + (dimSize - size) * moderateFactor;
    return returnSize * scaling;
  }
  return dimSize;
};

const isTablet = () => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = Startup_Width * pixelDensity;
  const adjustedHeight = Startup_Height * pixelDensity;
  if (pixelDensity < 2 && (adjustedWidth >= 1000 || adjustedHeight >= 1000)) {
    return true;
  } else
    return (
      pixelDensity === 2 && (adjustedWidth >= 1920 || adjustedHeight >= 1920)
    );
};

export {
  constantScale,
  dynamicScale,
  isTablet,
  moderateScale,
  scale,
  verticalScale,
};
