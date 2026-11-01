const SAFE_ROUTES = new Set([
  "RecentExpenses",
  "Overview",
  "Financial",
  "Profile",
  "Settings",
  "Finder",
]);

export function isSafeRouteForCriticalUpdateOverlay(
  routeName: string | undefined | null
): boolean {
  if (!routeName) return false;
  return SAFE_ROUTES.has(routeName);
}

type ShouldShowCriticalUpdateOverlayInput = {
  updateReady: boolean;
  isCritical: boolean;
  routeName: string | undefined | null;
};

/** Hard-block overlay only for critical OTAs on safe main-tab / Settings routes. */
export function shouldShowCriticalUpdateOverlay({
  updateReady,
  isCritical,
  routeName,
}: ShouldShowCriticalUpdateOverlayInput): boolean {
  return (
    updateReady &&
    isCritical &&
    isSafeRouteForCriticalUpdateOverlay(routeName)
  );
}
