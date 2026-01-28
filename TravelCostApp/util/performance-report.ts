/**
 * Performance Report Generation
 * 
 * Analyzes performance data and generates structured reports
 * with bottleneck identification and recommendations.
 */

import {
  getPerformanceLogs,
  getRenderLogs,
  getFPSReport,
  getPerformanceData,
} from './performance';

interface Bottleneck {
  name: string;
  group: string;
  duration: number;
  count: number;
  avgDuration: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

interface RenderIssue {
  componentName: string;
  renderCount: number;
  contextTriggers: Record<string, number>;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

interface PerformanceReport {
  summary: {
    totalFunctions: number;
    totalRenders: number;
    monitoringDuration: number;
    startupTime?: number;
  };
  startupPerformance: {
    totalTime: number;
    slowestFunctions: Bottleneck[];
    blockingOperations: Bottleneck[];
  };
  usagePerformance: {
    slowFunctions: Bottleneck[];
    frequentFunctions: Bottleneck[];
  };
  fpsPerformance: {
    phases: Array<{
      phase: string;
      avg: number;
      min: number;
      max: number;
      drops: number;
    }>;
    issues: Array<{
      phase: string;
      issue: string;
      severity: 'high' | 'medium' | 'low';
    }>;
  };
  stateManagement: {
    renderIssues: RenderIssue[];
    contextUpdateFrequency: Record<string, number>;
  };
  recommendations: {
    high: string[];
    medium: string[];
    low: string[];
  };
}

/**
 * Generate comprehensive performance report
 */
export function generatePerformanceReport(): PerformanceReport {
  const data = getPerformanceData();
  const functionLogs = data.functionLogs;
  const renderLogs = data.renderLogs;
  const fpsReport = getFPSReport();

  // Calculate monitoring duration
  const monitoringDuration =
    functionLogs.length > 0
      ? functionLogs[functionLogs.length - 1].timestamp -
        functionLogs[0].timestamp
      : 0;

  // Find startup time
  const startupLogs = functionLogs.filter((log) => log.group === 'startup');
  const startupTime = startupLogs.length
    ? Math.max(...startupLogs.map((log) => log.duration))
    : undefined;

  // Identify bottlenecks
  const bottlenecks = identifyBottlenecks(functionLogs);
  const startupBottlenecks = bottlenecks.filter(
    (b) => b.group === 'startup' || b.group === 'context-init'
  );
  const usageBottlenecks = bottlenecks.filter(
    (b) => b.group !== 'startup' && b.group !== 'context-init'
  );

  // Identify render issues
  const renderIssues = identifyRenderIssues(renderLogs);

  // Analyze FPS issues
  const fpsIssues = analyzeFPSIssues(fpsReport);

  // Generate recommendations
  const recommendations = generateRecommendations(
    bottlenecks,
    renderIssues,
    fpsIssues
  );

  // Calculate context update frequency
  const contextUpdateFrequency = calculateContextUpdateFrequency(renderLogs);

  return {
    summary: {
      totalFunctions: functionLogs.length,
      totalRenders: renderLogs.length,
      monitoringDuration,
      startupTime,
    },
    startupPerformance: {
      totalTime: startupTime || 0,
      slowestFunctions: startupBottlenecks
        .filter((b) => b.duration > 500)
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10),
      blockingOperations: startupBottlenecks
        .filter((b) => b.duration > 1000)
        .sort((a, b) => b.duration - a.duration),
    },
    usagePerformance: {
      slowFunctions: usageBottlenecks
        .filter((b) => b.avgDuration > 200)
        .sort((a, b) => b.avgDuration - a.avgDuration)
        .slice(0, 10),
      frequentFunctions: usageBottlenecks
        .filter((b) => b.count > 5)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    },
    fpsPerformance: {
      phases: fpsReport,
      issues: fpsIssues,
    },
    stateManagement: {
      renderIssues: renderIssues.slice(0, 10),
      contextUpdateFrequency,
    },
    recommendations,
  };
}

/**
 * Identify performance bottlenecks
 */
function identifyBottlenecks(
  logs: Array<{ name: string; group: string; duration: number }>
): Bottleneck[] {
  // Group by name and group
  const grouped: Record<string, Array<{ duration: number }>> = {};

  logs.forEach((log) => {
    const key = `${log.group}.${log.name}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push({ duration: log.duration });
  });

  // Calculate statistics
  return Object.entries(grouped).map(([key, entries]) => {
    const [group, name] = key.split('.');
    const durations = entries.map((e) => e.duration);
    const maxDuration = Math.max(...durations);
    const avgDuration =
      durations.reduce((a, b) => a + b, 0) / durations.length;
    const count = entries.length;

    // Determine priority
    let priority: 'high' | 'medium' | 'low' = 'low';
    let reason = '';

    if (group === 'startup' || group === 'context-init') {
      if (maxDuration > 1000) {
        priority = 'high';
        reason = 'Blocking startup (>1000ms)';
      } else if (maxDuration > 500) {
        priority = 'medium';
        reason = 'Slow startup (>500ms)';
      } else {
        priority = 'low';
        reason = 'Acceptable startup time';
      }
    } else {
      if (avgDuration > 500) {
        priority = 'high';
        reason = 'Very slow operation (>500ms avg)';
      } else if (avgDuration > 200) {
        priority = 'medium';
        reason = 'Slow operation (>200ms avg)';
      } else if (count > 20 && avgDuration > 100) {
        priority = 'medium';
        reason = 'Frequent slow operation';
      } else {
        priority = 'low';
        reason = 'Acceptable performance';
      }
    }

    return {
      name,
      group,
      duration: maxDuration,
      count,
      avgDuration: Math.round(avgDuration * 10) / 10,
      priority,
      reason,
    };
  });
}

/**
 * Identify render issues
 */
function identifyRenderIssues(
  logs: Array<{
    componentName: string;
    reason: string;
    contextChanged?: string[];
  }>
): RenderIssue[] {
  // Group by component
  const grouped: Record<
    string,
    Array<{ reason: string; contextChanged?: string[] }>
  > = {};

  logs.forEach((log) => {
    if (!grouped[log.componentName]) {
      grouped[log.componentName] = [];
    }
    grouped[log.componentName].push({
      reason: log.reason,
      contextChanged: log.contextChanged,
    });
  });

  // Calculate statistics
  return Object.entries(grouped)
    .map(([componentName, entries]) => {
      const renderCount = entries.length;
      const contextTriggers: Record<string, number> = {};

      entries.forEach((entry) => {
        if (entry.contextChanged) {
          entry.contextChanged.forEach((ctx) => {
            contextTriggers[ctx] = (contextTriggers[ctx] || 0) + 1;
          });
        }
      });

      // Determine priority
      let priority: 'high' | 'medium' | 'low' = 'low';
      let reason = '';

      if (renderCount > 20) {
        priority = 'high';
        reason = 'Excessive renders (>20)';
      } else if (renderCount > 10) {
        priority = 'medium';
        reason = 'Many renders (>10)';
      } else if (Object.keys(contextTriggers).length > 3) {
        priority = 'medium';
        reason = 'Multiple context dependencies';
      } else {
        priority = 'low';
        reason = 'Acceptable render count';
      }

      return {
        componentName,
        renderCount,
        contextTriggers,
        priority,
        reason,
      };
    })
    .filter((issue) => issue.renderCount > 5)
    .sort((a, b) => b.renderCount - a.renderCount);
}

/**
 * Analyze FPS issues
 */
function analyzeFPSIssues(
  fpsReport: Array<{
    phase: string;
    avg: number;
    min: number;
    max: number;
    drops: number;
  }>
): Array<{ phase: string; issue: string; severity: 'high' | 'medium' | 'low' }> {
  const issues: Array<{
    phase: string;
    issue: string;
    severity: 'high' | 'medium' | 'low';
  }> = [];

  fpsReport.forEach((phase) => {
    if (phase.avg < 50) {
      issues.push({
        phase: phase.phase,
        issue: `Very low average FPS (${phase.avg})`,
        severity: 'high',
      });
    } else if (phase.avg < 55) {
      issues.push({
        phase: phase.phase,
        issue: `Low average FPS (${phase.avg})`,
        severity: 'medium',
      });
    }

    if (phase.drops > phase.samples * 0.1) {
      issues.push({
        phase: phase.phase,
        issue: `High FPS drop rate (${phase.drops}/${phase.samples} drops)`,
        severity: phase.drops > phase.samples * 0.2 ? 'high' : 'medium',
      });
    }

    if (phase.min < 30) {
      issues.push({
        phase: phase.phase,
        issue: `Severe FPS drops (min: ${phase.min})`,
        severity: 'high',
      });
    }
  });

  return issues;
}

/**
 * Calculate context update frequency
 */
function calculateContextUpdateFrequency(
  logs: Array<{ contextChanged?: string[] }>
): Record<string, number> {
  const frequency: Record<string, number> = {};

  logs.forEach((log) => {
    if (log.contextChanged) {
      log.contextChanged.forEach((ctx) => {
        frequency[ctx] = (frequency[ctx] || 0) + 1;
      });
    }
  });

  return frequency;
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  bottlenecks: Bottleneck[],
  renderIssues: RenderIssue[],
  fpsIssues: Array<{ severity: 'high' | 'medium' | 'low' }>
): {
  high: string[];
  medium: string[];
  low: string[];
} {
  const recommendations: {
    high: string[];
    medium: string[];
    low: string[];
  } = {
    high: [],
    medium: [],
    low: [],
  };

  // High priority bottlenecks
  const highBottlenecks = bottlenecks.filter((b) => b.priority === 'high');
  highBottlenecks.forEach((b) => {
    recommendations.high.push(
      `Optimize ${b.group}.${b.name}: ${b.reason} (${b.duration}ms, called ${b.count}x)`
    );
  });

  // High priority render issues
  const highRenders = renderIssues.filter((r) => r.priority === 'high');
  highRenders.forEach((r) => {
    const contexts = Object.keys(r.contextTriggers).join(', ');
    recommendations.high.push(
      `Reduce renders in ${r.componentName}: ${r.renderCount} renders (triggers: ${contexts})`
    );
  });

  // High priority FPS issues
  const highFPS = fpsIssues.filter((f) => f.severity === 'high');
  highFPS.forEach((f) => {
    recommendations.high.push(`Fix FPS in ${f.phase}: ${f.issue}`);
  });

  // Medium priority
  const mediumBottlenecks = bottlenecks.filter((b) => b.priority === 'medium');
  mediumBottlenecks.slice(0, 5).forEach((b) => {
    recommendations.medium.push(
      `Consider optimizing ${b.group}.${b.name}: ${b.reason}`
    );
  });

  const mediumRenders = renderIssues.filter((r) => r.priority === 'medium');
  mediumRenders.slice(0, 3).forEach((r) => {
    recommendations.medium.push(
      `Memoize ${r.componentName} to reduce ${r.renderCount} renders`
    );
  });

  // Low priority
  recommendations.low.push(
    'Review all functions > 100ms for potential optimization'
  );
  recommendations.low.push(
    'Consider batching MMKV writes to reduce storage operations'
  );
  recommendations.low.push(
    'Review context provider structure for potential splitting'
  );

  return recommendations;
}

/**
 * Print performance report to console
 */
export function printPerformanceReport(): void {
  const report = generatePerformanceReport();

  console.log('\n========== PERFORMANCE REPORT ==========');
  console.log(`\nSummary:`);
  console.log(`  Total functions logged: ${report.summary.totalFunctions}`);
  console.log(`  Total renders logged: ${report.summary.totalRenders}`);
  console.log(
    `  Monitoring duration: ${(report.summary.monitoringDuration / 1000).toFixed(2)}s`
  );
  if (report.summary.startupTime) {
    console.log(
      `  Startup time: ${report.summary.startupTime.toFixed(2)}ms`
    );
  }

  console.log(`\nStartup Performance:`);
  console.log(
    `  Total startup time: ${report.startupPerformance.totalTime.toFixed(2)}ms`
  );
  if (report.startupPerformance.slowestFunctions.length > 0) {
    console.log(`  Slowest functions:`);
    report.startupPerformance.slowestFunctions.forEach((b) => {
      console.log(
        `    - ${b.group}.${b.name}: ${b.duration}ms (${b.priority})`
      );
    });
  }

  console.log(`\nUsage Performance:`);
  if (report.usagePerformance.slowFunctions.length > 0) {
    console.log(`  Slow functions:`);
    report.usagePerformance.slowFunctions.forEach((b) => {
      console.log(
        `    - ${b.group}.${b.name}: ${b.avgDuration}ms avg (${b.count}x, ${b.priority})`
      );
    });
  }

  console.log(`\nFPS Performance:`);
  report.fpsPerformance.phases.forEach((phase) => {
    console.log(
      `  ${phase.phase}: avg=${phase.avg}, min=${phase.min}, max=${phase.max}, drops=${phase.drops}`
    );
  });
  if (report.fpsPerformance.issues.length > 0) {
    console.log(`  Issues:`);
    report.fpsPerformance.issues.forEach((issue) => {
      console.log(`    - ${issue.phase}: ${issue.issue} (${issue.severity})`);
    });
  }

  console.log(`\nState Management:`);
  if (report.stateManagement.renderIssues.length > 0) {
    console.log(`  Render issues:`);
    report.stateManagement.renderIssues.forEach((issue) => {
      console.log(
        `    - ${issue.componentName}: ${issue.renderCount} renders (${issue.reason})`
      );
    });
  }

  console.log(`\nRecommendations:`);
  if (report.recommendations.high.length > 0) {
    console.log(`  HIGH PRIORITY:`);
    report.recommendations.high.forEach((rec) => {
      console.log(`    - ${rec}`);
    });
  }
  if (report.recommendations.medium.length > 0) {
    console.log(`  MEDIUM PRIORITY:`);
    report.recommendations.medium.forEach((rec) => {
      console.log(`    - ${rec}`);
    });
  }
  if (report.recommendations.low.length > 0) {
    console.log(`  LOW PRIORITY:`);
    report.recommendations.low.forEach((rec) => {
      console.log(`    - ${rec}`);
    });
  }

  console.log('\n==========================================\n');
}
