import { SvgProps } from "react-native-svg";

// SVG Component Props - removing invalid props
export type SvgComponentProps = Omit<SvgProps, "xmlns">;

// Circle Props without invalid style prop
export interface CircleProps {
  cx: number;
  cy: number;
  r: number;
  strokeMiterlimit?: number;
  transform?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeLinecap?: "butt" | "round" | "square";
  strokeLinejoin?: "miter" | "round" | "bevel";
  // Note: style prop is not valid for SVG elements in react-native-svg
}

// Path Props without invalid style prop
export interface PathProps {
  d: string;
  strokeMiterlimit?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeLinecap?: "butt" | "round" | "square";
  strokeLinejoin?: "miter" | "round" | "bevel";
  // Note: style prop is not valid for SVG elements in react-native-svg
}

// Common SVG styling approach
export interface SvgElementStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeLinecap?: "butt" | "round" | "square";
  strokeLinejoin?: "miter" | "round" | "bevel";
  strokeMiterlimit?: number;
}

// Apply styles to SVG elements using individual props instead of style object
export function applySvgStyle(element: SvgElementStyle) {
  return {
    fill: element.fill,
    stroke: element.stroke,
    strokeWidth: element.strokeWidth,
    strokeLinecap: element.strokeLinecap,
    strokeLinejoin: element.strokeLinejoin,
    strokeMiterlimit: element.strokeMiterlimit,
  };
}
