/**
 * React Hooks for Performance Tracking
 * 
 * Provides hooks for tracking component renders and performance
 */

import React, { useEffect, useRef } from 'react';
import { logRender } from './performance';

/**
 * Hook to track component renders
 */
export function usePerformanceTracking(
  componentName: string,
  props?: Record<string, unknown>,
  state?: unknown
): void {
  const prevPropsRef = useRef<Record<string, unknown> | undefined>(props);
  const prevStateRef = useRef<unknown>(state);
  const renderCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current += 1;
    const renderCount = renderCountRef.current;

    if (renderCount === 1) {
      logRender(componentName, 'initial mount');
      prevPropsRef.current = props;
      prevStateRef.current = state;
      return;
    }

    // Detect what changed
    const propsChanged =
      props && prevPropsRef.current
        ? Object.keys(props).some(
            (key) => props[key] !== prevPropsRef.current?.[key]
          )
        : false;

    const stateChanged = state !== prevStateRef.current;

    // Determine reason
    let reason = 're-render';
    if (propsChanged && stateChanged) {
      reason = 'props and state changed';
    } else if (propsChanged) {
      reason = 'props changed';
    } else if (stateChanged) {
      reason = 'state changed';
    } else {
      reason = 'parent re-render';
    }

    logRender(componentName, reason, undefined, propsChanged, stateChanged);

    prevPropsRef.current = props;
    prevStateRef.current = state;
  });
}

/**
 * Hook to track context changes
 */
export function useContextTracking(
  componentName: string,
  contexts: Record<string, unknown>
): void {
  const prevContextsRef = useRef<Record<string, unknown>>({});
  const renderCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current += 1;
    const renderCount = renderCountRef.current;

    if (renderCount === 1) {
      logRender(componentName, 'initial mount');
      prevContextsRef.current = { ...contexts };
      return;
    }

    // Detect which contexts changed
    const changedContexts: string[] = [];
    Object.keys(contexts).forEach((key) => {
      if (contexts[key] !== prevContextsRef.current[key]) {
        changedContexts.push(key);
      }
    });

    if (changedContexts.length > 0) {
      logRender(
        componentName,
        `context changed (${changedContexts.length} contexts)`,
        changedContexts
      );
    }

    prevContextsRef.current = { ...contexts };
  });
}

/**
 * HOC to wrap components with performance tracking
 */
export function withPerformanceTracking<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  const TrackedComponent = (props: P) => {
    usePerformanceTracking(componentName, props as Record<string, unknown>);
    return <Component {...props} />;
  };

  TrackedComponent.displayName = `withPerformanceTracking(${componentName})`;

  return TrackedComponent;
}
