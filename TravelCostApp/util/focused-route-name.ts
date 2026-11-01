type NavRoute = {
  name: string;
  state?: NavState;
};

type NavState = {
  index?: number;
  routes?: NavRoute[];
};

/** Deepest focused route name from a React Navigation state tree. */
export function getFocusedRouteName(
  state: NavState | undefined | null
): string | undefined {
  if (!state?.routes?.length) {
    return undefined;
  }

  const index = state.index ?? state.routes.length - 1;
  const route = state.routes[index];
  if (!route) {
    return undefined;
  }

  if (route.state) {
    return getFocusedRouteName(route.state) ?? route.name;
  }

  return route.name;
}
