/**
 * Performance Monitoring Utilities
 * 
 * Tracks function execution times, FPS, and component re-renders
 * for performance investigation and optimization.
 */

// Enable performance monitoring only when explicitly opted-in.
// Dev mode alone is not enough, because the overhead can tank JS FPS.
// Flip this to true temporarily when you are actively profiling.
const ENABLE_PERFORMANCE_MONITORING = false;
// Collect data but avoid console spam (console I/O tanks dev JS FPS)
const ENABLE_PERF_CONSOLE_LOGS = false;
const PERF_CONSOLE_MIN_DURATION_MS = 200;
const FPS_SUMMARY_INTERVAL_MS = 10_000;
const MAX_LOG_ENTRIES = 5_000;

interface PerformanceLogEntry {
  name: string;
  group: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface FPSData {
  timestamp: number;
  fps: number;
  phase?: string;
}

interface RenderLogEntry {
  componentName: string;
  timestamp: number;
  reason: string;
  propsChanged?: boolean;
  stateChanged?: boolean;
  contextChanged?: string[];
}

// Storage for performance data
const performanceLogs: PerformanceLogEntry[] = [];
const fpsData: FPSData[] = [];
const renderLogs: RenderLogEntry[] = [];
let fpsMonitoringActive = false;
let fpsAnimationFrameId: number | null = null;
let lastFrameTime = 0;
let currentPhase = 'unknown';
let lastFPSSummaryAt = 0;
let lastFPSRecordedAt = 0;

function pushCapped<T>(arr: T[], item: T, max: number) {
  arr.push(item);
  if (arr.length > max) arr.splice(0, arr.length - max);
}

function shouldLogNow(key: string, intervalMs: number): boolean {
  const now = Date.now();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g: any = global as any;
  g.__perfLogGate = g.__perfLogGate || {};
  const last = g.__perfLogGate[key] || 0;
  if (now - last < intervalMs) return false;
  g.__perfLogGate[key] = now;
  return true;
}

/**
 * Log function execution time
 */
export function logFunctionTime(
  name: string,
  startTime: number,
  endTime: number,
  group: string = 'general',
  metadata?: Record<string, any>
): void {
  if (!ENABLE_PERFORMANCE_MONITORING) return;

  const duration = endTime - startTime;
  const entry: PerformanceLogEntry = {
    name,
    group,
    duration,
    timestamp: startTime,
    metadata,
  };

  pushCapped(performanceLogs, entry, MAX_LOG_ENTRIES);

  if (
    ENABLE_PERF_CONSOLE_LOGS &&
    duration >= PERF_CONSOLE_MIN_DURATION_MS &&
    shouldLogNow(`perf:${group}.${name}`, 1000)
  ) {
    console.log(
      `[PERF] ${group}.${name}: ${duration.toFixed(2)}ms${
        metadata ? ` (${JSON.stringify(metadata)})` : ''
      }`,
    );
  }
}

/**
 * Track async function execution
 */
export function trackAsyncFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string,
  group: string = 'general'
): T {
  if (!ENABLE_PERFORMANCE_MONITORING) return fn;

  return (async (...args: any[]) => {
    const startTime = Date.now();
    try {
      const result = await fn(...args);
      const endTime = Date.now();
      logFunctionTime(name, startTime, endTime, group);
      return result;
    } catch (error) {
      const endTime = Date.now();
      logFunctionTime(name, startTime, endTime, group, { error: true });
      throw error;
    }
  }) as T;
}

/**
 * Track synchronous function execution
 */
export function trackFunction<T extends (...args: any[]) => any>(
  fn: T,
  name: string,
  group: string = 'general'
): T {
  if (!ENABLE_PERFORMANCE_MONITORING) return fn;

  return ((...args: any[]) => {
    const startTime = Date.now();
    try {
      const result = fn(...args);
      const endTime = Date.now();
      logFunctionTime(name, startTime, endTime, group);
      return result;
    } catch (error) {
      const endTime = Date.now();
      logFunctionTime(name, startTime, endTime, group, { error: true });
      throw error;
    }
  }) as T;
}

/**
 * Start FPS monitoring
 */
export function startFPSMonitoring(phase?: string): void {
  if (!ENABLE_PERFORMANCE_MONITORING || fpsMonitoringActive) return;

  fpsMonitoringActive = true;
  currentPhase = phase || 'unknown';
  lastFrameTime = Date.now();
  lastFPSSummaryAt = Date.now();
  lastFPSRecordedAt = 0;

  const measureFPS = () => {
    if (!fpsMonitoringActive) return;

    const now = Date.now();
    const deltaTime = now - lastFrameTime;
    const fps = deltaTime > 0 ? Math.round(1000 / deltaTime) : 60;

    // Cap FPS at 60
    const cappedFPS = Math.min(fps, 60);

    // Avoid per-frame array churn; record FPS samples at a low rate.
    if (!lastFPSRecordedAt || now - lastFPSRecordedAt >= 250) {
      lastFPSRecordedAt = now;
      pushCapped(
        fpsData,
        {
          timestamp: now,
          fps: cappedFPS,
          phase: currentPhase,
        },
        MAX_LOG_ENTRIES,
      );
    }

    if (ENABLE_PERF_CONSOLE_LOGS && now - lastFPSSummaryAt >= FPS_SUMMARY_INTERVAL_MS) {
      lastFPSSummaryAt = now;
      const lastSlice = fpsData.slice(Math.max(0, fpsData.length - 120));
      const avg =
        lastSlice.length > 0
          ? lastSlice.reduce((sum, e) => sum + e.fps, 0) / lastSlice.length
          : cappedFPS;
      console.log(
        `[FPS] ${currentPhase}: avg ${avg.toFixed(1)} (samples ${lastSlice.length})`,
      );
    }

    lastFrameTime = now;
    fpsAnimationFrameId = requestAnimationFrame(measureFPS);
  };

  fpsAnimationFrameId = requestAnimationFrame(measureFPS);
  if (ENABLE_PERF_CONSOLE_LOGS) {
    console.log(`[FPS] Started monitoring phase: ${currentPhase}`);
  }
}

/**
 * Stop FPS monitoring
 */
export function stopFPSMonitoring(): void {
  if (!fpsMonitoringActive) return;

  fpsMonitoringActive = false;
  if (fpsAnimationFrameId !== null) {
    cancelAnimationFrame(fpsAnimationFrameId);
    fpsAnimationFrameId = null;
  }
  if (ENABLE_PERF_CONSOLE_LOGS) {
    console.log(`[FPS] Stopped monitoring phase: ${currentPhase}`);
  }
}

/**
 * Set current FPS monitoring phase
 */
export function setFPSPhase(phase: string): void {
  currentPhase = phase;
}

/**
 * Get FPS report
 */
export function getFPSReport(): {
  phase: string;
  avg: number;
  min: number;
  max: number;
  drops: number;
  samples: number;
}[] {
  if (fpsData.length === 0) {
    return [];
  }

  // Group by phase
  const phaseGroups: Record<string, number[]> = {};
  fpsData.forEach((entry) => {
    const phase = entry.phase || 'unknown';
    if (!phaseGroups[phase]) {
      phaseGroups[phase] = [];
    }
    phaseGroups[phase].push(entry.fps);
  });

  // Calculate statistics per phase
  return Object.entries(phaseGroups).map(([phase, fpsValues]) => {
    const avg = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
    const min = Math.min(...fpsValues);
    const max = Math.max(...fpsValues);
    const drops = fpsValues.filter((fps) => fps < 55).length;

    return {
      phase,
      avg: Math.round(avg * 10) / 10,
      min,
      max,
      drops,
      samples: fpsValues.length,
    };
  });
}

/**
 * Log component render
 */
export function logRender(
  componentName: string,
  reason: string,
  contextChanged?: string[],
  propsChanged?: boolean,
  stateChanged?: boolean
): void {
  if (!ENABLE_PERFORMANCE_MONITORING) return;

  const entry: RenderLogEntry = {
    componentName,
    timestamp: Date.now(),
    reason,
    contextChanged,
    propsChanged,
    stateChanged,
  };

  // Keep data for reports, but cap to avoid runaway memory during dev
  pushCapped(renderLogs, entry, MAX_LOG_ENTRIES);

  const contextInfo = contextChanged?.length
    ? ` (context: ${contextChanged.join(', ')})`
    : '';
  const propsInfo = propsChanged ? ' (props changed)' : '';
  const stateInfo = stateChanged ? ' (state changed)' : '';

  if (ENABLE_PERF_CONSOLE_LOGS && shouldLogNow(`render:${componentName}`, 2000)) {
    console.log(
      `[RENDER] ${componentName}: ${reason}${contextInfo}${propsInfo}${stateInfo}`,
    );
  }
}

/**
 * Get all performance logs
 */
export function getPerformanceLogs(): PerformanceLogEntry[] {
  return [...performanceLogs];
}

/**
 * Get all render logs
 */
export function getRenderLogs(): RenderLogEntry[] {
  return [...renderLogs];
}

/**
 * Clear all performance logs
 */
export function clearPerformanceLog(): void {
  performanceLogs.length = 0;
  fpsData.length = 0;
  renderLogs.length = 0;
  if (ENABLE_PERF_CONSOLE_LOGS) {
    console.log('[PERF] Cleared all performance logs');
  }
}

/**
 * Get performance data for reporting
 */
export function getPerformanceData(): {
  functionLogs: PerformanceLogEntry[];
  fpsData: FPSData[];
  renderLogs: RenderLogEntry[];
} {
  return {
    functionLogs: getPerformanceLogs(),
    fpsData: [...fpsData],
    renderLogs: getRenderLogs(),
  };
}
