import { Dimensions, PixelRatio } from "react-native";

// this Dimensions.get will only be called once at the start of the app
const { width: Startup_Width, height: Startup_Height } =
  Dimensions.get("window");

//Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 350;
const guidelineBaseHeight = 680;

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
  const dynamicBaseWidth = isPortrait ? 350 : 680;
  // const dynamicBaseWidth = 350;
  const dynamicBaseHeight = isPortrait ? 680 : 350;
  // const dynamicBaseHeight = 680;
  const isATablet = isTablet();
  const tabletMult = isATablet ? 0.6 : 1;

  const hSize = (height / dynamicBaseHeight) * size;
  const wSize = (width / dynamicBaseWidth) * size;
  if (moderateFactor != null) {
    // moderation
    returnSize = !vertical
      ? hSize + (hSize - size) * moderateFactor
      : wSize + (wSize - size) * moderateFactor;
    return returnSize * tabletMult;
  }
  // no moderation
  returnSize = !vertical ? hSize : wSize;
  return returnSize * tabletMult;
};

const constantScale = (size: number, moderateFactor: number = null) => {
  const { width, height } = Dimensions.get("window");
  const smallerDim = Math.min(width, height);
  const baseDim = 350;
  const isATablet = isTablet();
  const tabletMult = isATablet ? 0.6 : 1;
  const dimSize = (smallerDim / baseDim) * size;
  if (moderateFactor != null) {
    const returnSize = dimSize + (dimSize - size) * moderateFactor;
    return returnSize * tabletMult;
  }
  return dimSize * tabletMult;
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
  scale,
  verticalScale,
  moderateScale,
  dynamicScale,
  constantScale,
  isTablet,
};
