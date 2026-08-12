export type LayoutBreakpoint = "narrow" | "medium" | "wide";
export type LayoutOrientation = "portrait" | "landscape";
export type LayoutSpaceToken = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type LayoutViewport = {
  width: number;
  height: number;
};

export const CONTROL_MAX_WIDTH = 480;

export type ControlWidthMode = "fill" | "hug";

export type LayoutProfile = {
  breakpoint: LayoutBreakpoint;
  orientation: LayoutOrientation;
  contentMaxWidth: number;
  controlMaxWidth: number;
  space: (token: LayoutSpaceToken) => number;
  type: (size: number) => number;
};

const NARROW_MEDIUM_SPACE_TOKENS: Record<LayoutSpaceToken, number> = {
  1: 8,
  2: 12,
  3: 16,
  4: 20,
  5: 24,
  6: 32,
  7: 48,
};

const WIDE_SPACE_TOKENS: Record<LayoutSpaceToken, number> = {
  1: 12,
  2: 16,
  3: 20,
  4: 24,
  5: 32,
  6: 40,
  7: 56,
};

const TYPE_SCALE_BY_BREAKPOINT: Record<LayoutBreakpoint, number> = {
  narrow: 1,
  medium: 1.05,
  wide: 1.2,
};

function breakpointFor(width: number): LayoutBreakpoint {
  if (width >= 768) {
    return "wide";
  }
  if (width >= 600) {
    return "medium";
  }
  return "narrow";
}

function orientationFor(viewport: LayoutViewport): LayoutOrientation {
  return viewport.width < viewport.height ? "portrait" : "landscape";
}

function spaceForBreakpoint(breakpoint: LayoutBreakpoint, token: LayoutSpaceToken) {
  const tokens =
    breakpoint === "wide" ? WIDE_SPACE_TOKENS : NARROW_MEDIUM_SPACE_TOKENS;
  return tokens[token];
}

function typeForBreakpoint(breakpoint: LayoutBreakpoint, size: number) {
  return Math.round(size * TYPE_SCALE_BY_BREAKPOINT[breakpoint]);
}

export function controlWidthStyle(
  layout: LayoutProfile,
  mode: ControlWidthMode = "fill"
) {
  const touchTarget = { minHeight: 44, minWidth: 44 };

  if (layout.breakpoint === "narrow") {
    if (mode === "hug") {
      return { alignSelf: "flex-start" as const, ...touchTarget };
    }
    return { alignSelf: "stretch" as const, width: "100%" as const, ...touchTarget };
  }

  if (mode === "hug") {
    return {
      alignSelf: "flex-start" as const,
      maxWidth: layout.controlMaxWidth,
      ...touchTarget,
    };
  }

  return {
    alignSelf: "center" as const,
    width: "100%" as const,
    maxWidth: layout.controlMaxWidth,
    ...touchTarget,
  };
}

export function layoutFor(viewport: LayoutViewport): LayoutProfile {
  const breakpoint = breakpointFor(viewport.width);

  return {
    breakpoint,
    orientation: orientationFor(viewport),
    contentMaxWidth: 800,
    controlMaxWidth: CONTROL_MAX_WIDTH,
    space: (token) => spaceForBreakpoint(breakpoint, token),
    type: (size) => typeForBreakpoint(breakpoint, size),
  };
}
