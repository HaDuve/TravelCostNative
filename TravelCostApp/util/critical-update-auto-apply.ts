const SAFE_ROUTES = new Set([
  "RecentExpenses",
  "Overview",
  "Financial",
  "Profile",
  "Settings",
  "Finder",
]);

export function isSafeRouteForCriticalUpdate(
  routeName: string | undefined | null
): boolean {
  if (!routeName) return false;
  return SAFE_ROUTES.has(routeName);
}

type ShouldAutoApplyCriticalUpdateInput = {
  updateReady: boolean;
  isCritical: boolean;
  routeName: string | undefined | null;
};

/** Auto-reload only for critical OTAs, and only off form routes (Draft restoration covers the rest). */
export function shouldAutoApplyCriticalUpdate({
  updateReady,
  isCritical,
  routeName,
}: ShouldAutoApplyCriticalUpdateInput): boolean {
  return (
    updateReady &&
    isCritical &&
    isSafeRouteForCriticalUpdate(routeName)
  );
}
