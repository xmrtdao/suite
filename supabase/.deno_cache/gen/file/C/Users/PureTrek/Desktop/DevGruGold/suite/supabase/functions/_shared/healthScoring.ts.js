// Unified Health Scoring System
// Standardized across system-status, system-health, and prometheus-metrics
/**
 * Essential API services that impact core operations.
 * Only unhealthy keys from this list will cause health deductions.
 * Non-essential services (xai, vercel_ai, elevenlabs, etc.) are informational only.
 */ export const ESSENTIAL_API_SERVICES = [
  'github',
  'ollama',
  'deepseek',
  'gemini',
  'openai' // Fallback AI
];
/**
 * Calculate unified health score using standardized deduction-based formula.
 * This function ensures all system scanners report consistent health scores.
 * 
 * Deduction weights:
 * - Critical: API keys unhealthy (-15 each)
 * - High: Failing cron jobs (-10 each), Agent errors (-5 each), Failed commands (-2 each, max 10)
 * - Medium: Stalled cron jobs (-5 each, max 25), Python failures > 10 (-10)
 * - Low: Blocked tasks > 3 (-3 each after threshold), Edge function error rate > 15% (-5)
 * - XMRTCharger: Devices offline (-5), Low charging efficiency (-5)
 */ export function calculateUnifiedHealthScore(metrics) {
  let score = 100;
  const issues = [];
  // CRITICAL: API Keys Unhealthy (-15 each)
  if (metrics.apiKeysUnhealthy > 0) {
    const deduction = metrics.apiKeysUnhealthy * 15;
    score -= deduction;
    issues.push({
      severity: 'critical',
      message: `${metrics.apiKeysUnhealthy} API key(s) unhealthy`,
      deduction
    });
  }
  // HIGH: Failing Cron Jobs (-10 each)
  if (metrics.failingCronJobs > 0) {
    const deduction = metrics.failingCronJobs * 10;
    score -= deduction;
    issues.push({
      severity: 'high',
      message: `${metrics.failingCronJobs} cron job(s) failing (<50% success rate)`,
      deduction
    });
  }
  // HIGH: Agent Errors (-5 each)
  if (metrics.agentErrors > 0) {
    const deduction = metrics.agentErrors * 5;
    score -= deduction;
    issues.push({
      severity: 'high',
      message: `${metrics.agentErrors} agent(s) in error state`,
      deduction
    });
  }
  // HIGH: Failed Commands (-2 each, max 10 deduction)
  if (metrics.failedCommands > 5) {
    const deduction = Math.min((metrics.failedCommands - 5) * 2, 10);
    score -= deduction;
    issues.push({
      severity: 'high',
      message: `${metrics.failedCommands} engagement commands failed`,
      deduction
    });
  }
  // MEDIUM: Stalled Cron Jobs (-5 each, max 25 deduction)
  if (metrics.stalledCronJobs > 2) {
    const deduction = Math.min((metrics.stalledCronJobs - 2) * 5, 25);
    score -= deduction;
    issues.push({
      severity: 'warning',
      message: `${metrics.stalledCronJobs} cron job(s) stalled (active but no runs in 24h)`,
      deduction
    });
  }
  // MEDIUM: Python Failures > 10 in 24h (-10)
  if (metrics.pythonFailures24h > 10) {
    const deduction = 10;
    score -= deduction;
    issues.push({
      severity: 'warning',
      message: `${metrics.pythonFailures24h} Python executions failed in last 24h`,
      deduction
    });
  }
  // LOW: Blocked Tasks > 3 (-3 each after threshold)
  if (metrics.blockedTasks > 3) {
    const deduction = (metrics.blockedTasks - 3) * 3;
    score -= deduction;
    issues.push({
      severity: 'warning',
      message: `${metrics.blockedTasks} blocked task(s) need attention`,
      deduction
    });
  }
  // LOW: High Edge Function Error Rate (-5 if > 15%)
  if (metrics.edgeFunctionErrorRate > 15) {
    const deduction = 5;
    score -= deduction;
    issues.push({
      severity: 'warning',
      message: `Edge function error rate ${metrics.edgeFunctionErrorRate.toFixed(1)}% exceeds 15% threshold`,
      deduction
    });
  }
  // XMRT: Devices Offline (-5)
  if (metrics.devicesOffline) {
    const deduction = 5;
    score -= deduction;
    issues.push({
      severity: 'warning',
      message: 'No active XMRTCharger devices connected',
      deduction
    });
  }
  // XMRT: Low Charging Efficiency (-5)
  if (metrics.lowChargingEfficiency) {
    const deduction = 5;
    score -= deduction;
    issues.push({
      severity: 'warning',
      message: 'Charging efficiency below 70% target',
      deduction
    });
  }
  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));
  // Determine status based on score thresholds
  let status;
  if (score >= 90) {
    status = 'healthy';
  } else if (score >= 70) {
    status = 'warning';
  } else if (score >= 50) {
    status = 'degraded';
  } else {
    status = 'critical';
  }
  return {
    score,
    status,
    issues
  };
}
/**
 * Parse cron schedule to determine expected frequency in hours.
 * Handles standard cron expressions and returns expected run frequency.
 */ export function parseScheduleFrequency(schedule) {
  if (!schedule) return 24;
  const parts = schedule.trim().split(/\s+/);
  if (parts.length < 5) return 24;
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  // Monthly (specific day of month like "1" or "15", not "*" or "*/N")
  if (dayOfMonth !== '*' && !dayOfMonth.includes('/') && !dayOfMonth.includes(',') && !dayOfMonth.includes('-')) {
    return 744; // ~31 days in hours
  }
  // Weekly (specific day of week like "0" for Sunday, "3" for Wednesday)
  if (dayOfWeek !== '*' && !dayOfWeek.includes('/') && !dayOfWeek.includes(',') && !dayOfWeek.includes('-')) {
    return 168; // 7 days in hours
  }
  // Every N days (e.g., "*/3" in day of month field)
  if (dayOfMonth.includes('/')) {
    const interval = parseInt(dayOfMonth.split('/')[1]) || 1;
    return interval * 24;
  }
  // Every N hours (e.g., "*/6" in hour field)
  if (hour.includes('/')) {
    const interval = parseInt(hour.split('/')[1]) || 1;
    return interval;
  }
  // Specific hour(s) each day = daily (e.g., "0 14 * * *" runs at 2pm daily)
  if (hour !== '*' && !hour.includes('/')) {
    return 24;
  }
  // Every N minutes (runs very frequently)
  if (minute.includes('/')) {
    const interval = parseInt(minute.split('/')[1]) || 1;
    return Math.max(1, interval / 60); // At least 1 hour buffer
  }
  // Default to daily for unrecognized patterns
  return 24;
}
/**
 * Detect one-time schedules (specific date and month).
 * These should be excluded from stalled detection.
 */ export function isOneTimeSchedule(schedule) {
  if (!schedule) return false;
  const parts = schedule.trim().split(/\s+/);
  if (parts.length < 5) return false;
  const [, , dayOfMonth, month] = parts;
  // If both month and day are specific numbers (not * or ranges), it's one-time
  const isSpecificMonth = month !== '*' && !month.includes('/') && !month.includes('-') && !month.includes(',');
  const isSpecificDay = dayOfMonth !== '*' && !dayOfMonth.includes('/') && !dayOfMonth.includes('-') && !dayOfMonth.includes(',');
  return isSpecificMonth && isSpecificDay;
}
/**
 * Helper to extract cron job metrics from pg_cron data.
 * Uses schedule-aware logic to detect stalled jobs correctly for weekly/monthly schedules.
 */ export function extractCronMetrics(cronJobs) {
  if (!cronJobs || !Array.isArray(cronJobs)) {
    return {
      failing: 0,
      stalled: 0
    };
  }
  // Jobs with poor success rate (<50%)
  const failing = cronJobs.filter((j)=>j.success_rate !== null && j.success_rate < 50).length;
  // Schedule-aware stalled detection
  const stalled = cronJobs.filter((j)=>{
    // Skip inactive jobs
    if (!j.active) return false;
    // Skip one-time jobs
    if (isOneTimeSchedule(j.schedule)) return false;
    // Use pre-calculated is_overdue if available from DB function
    if (j.is_overdue !== undefined && j.is_overdue !== null) {
      return j.is_overdue;
    }
    // Parse schedule to determine expected frequency
    const expectedFrequencyHours = parseScheduleFrequency(j.schedule);
    // Add 50% buffer to expected frequency for grace period
    const windowHours = expectedFrequencyHours * 1.5;
    // If no last_run_time, check if job should have run by now
    if (!j.last_run_time) {
      // Active jobs that have never run are stalled (unless they're new)
      return true;
    }
    const lastRun = new Date(j.last_run_time);
    const hoursSinceLastRun = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60);
    // Job is stalled if it hasn't run within its expected window + buffer
    return hoursSinceLastRun > windowHours;
  }).length;
  return {
    failing,
    stalled
  };
}
/**
 * Helper to build HealthMetrics from various data sources
 */ export function buildHealthMetrics(params) {
  const { apiKeyHealth = {}, pythonExecStats = {}, taskStats = {}, cronStats = {}, agentStats = {}, edgeFunctionStats = {}, deviceStats = {}, chargingStats = {}, commandStats = {} } = params;
  return {
    apiKeysUnhealthy: apiKeyHealth.unhealthy || 0,
    pythonFailures24h: pythonExecStats.failed || 0,
    blockedTasks: taskStats.BLOCKED || taskStats.blocked || 0,
    failingCronJobs: cronStats.failing || 0,
    stalledCronJobs: cronStats.stalled || 0,
    agentErrors: agentStats.ERROR || agentStats.error || 0,
    edgeFunctionErrorRate: edgeFunctionStats.overall_error_rate || 0,
    devicesOffline: (deviceStats.total || 0) > 5 && (deviceStats.active || 0) === 0,
    lowChargingEfficiency: (chargingStats.avg_efficiency || 100) < 70 && (chargingStats.total || 0) > 10,
    failedCommands: commandStats.failed || 0
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vQzovVXNlcnMvUHVyZVRyZWsvRGVza3RvcC9EZXZHcnVHb2xkL3N1aXRlL3N1cGFiYXNlL2Z1bmN0aW9ucy9fc2hhcmVkL2hlYWx0aFNjb3JpbmcudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gVW5pZmllZCBIZWFsdGggU2NvcmluZyBTeXN0ZW1cbi8vIFN0YW5kYXJkaXplZCBhY3Jvc3Mgc3lzdGVtLXN0YXR1cywgc3lzdGVtLWhlYWx0aCwgYW5kIHByb21ldGhldXMtbWV0cmljc1xuXG4vKipcbiAqIEVzc2VudGlhbCBBUEkgc2VydmljZXMgdGhhdCBpbXBhY3QgY29yZSBvcGVyYXRpb25zLlxuICogT25seSB1bmhlYWx0aHkga2V5cyBmcm9tIHRoaXMgbGlzdCB3aWxsIGNhdXNlIGhlYWx0aCBkZWR1Y3Rpb25zLlxuICogTm9uLWVzc2VudGlhbCBzZXJ2aWNlcyAoeGFpLCB2ZXJjZWxfYWksIGVsZXZlbmxhYnMsIGV0Yy4pIGFyZSBpbmZvcm1hdGlvbmFsIG9ubHkuXG4gKi9cbmV4cG9ydCBjb25zdCBFU1NFTlRJQUxfQVBJX1NFUlZJQ0VTID0gW1xuICAnZ2l0aHViJywgICAgICAgLy8gQ29yZSBmb3IgY29kZSBvcGVyYXRpb25zXG4gICdvbGxhbWEnLCAgICAgICAvLyBQcmltYXJ5IEFJIHByb3ZpZGVyXG4gICdkZWVwc2VlaycsICAgICAvLyBTZWNvbmRhcnkgQUkgcHJvdmlkZXJcbiAgJ2dlbWluaScsICAgICAgIC8vIFZpc2lvbiBmYWxsYmFja1xuICAnb3BlbmFpJyAgICAgICAgLy8gRmFsbGJhY2sgQUlcbl07XG5cbmV4cG9ydCBpbnRlcmZhY2UgSGVhbHRoTWV0cmljcyB7XG4gIGFwaUtleXNVbmhlYWx0aHk6IG51bWJlcjtcbiAgcHl0aG9uRmFpbHVyZXMyNGg6IG51bWJlcjtcbiAgYmxvY2tlZFRhc2tzOiBudW1iZXI7XG4gIGZhaWxpbmdDcm9uSm9iczogbnVtYmVyO1xuICBzdGFsbGVkQ3JvbkpvYnM6IG51bWJlcjtcbiAgYWdlbnRFcnJvcnM6IG51bWJlcjtcbiAgZWRnZUZ1bmN0aW9uRXJyb3JSYXRlOiBudW1iZXI7XG4gIGRldmljZXNPZmZsaW5lOiBib29sZWFuOyAvLyB0cnVlIGlmIHRvdGFsID4gNSBhbmQgYWN0aXZlID0gMFxuICBsb3dDaGFyZ2luZ0VmZmljaWVuY3k6IGJvb2xlYW47IC8vIHRydWUgaWYgYXZnIDwgNzAlIGFuZCBzZXNzaW9ucyA+IDEwXG4gIGZhaWxlZENvbW1hbmRzOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSGVhbHRoUmVzdWx0IHtcbiAgc2NvcmU6IG51bWJlcjtcbiAgc3RhdHVzOiAnaGVhbHRoeScgfCAnd2FybmluZycgfCAnZGVncmFkZWQnIHwgJ2NyaXRpY2FsJztcbiAgaXNzdWVzOiBIZWFsdGhJc3N1ZVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEhlYWx0aElzc3VlIHtcbiAgc2V2ZXJpdHk6ICdjcml0aWNhbCcgfCAnaGlnaCcgfCAnd2FybmluZycgfCAnaW5mbyc7XG4gIG1lc3NhZ2U6IHN0cmluZztcbiAgZGVkdWN0aW9uOiBudW1iZXI7XG59XG5cbi8qKlxuICogQ2FsY3VsYXRlIHVuaWZpZWQgaGVhbHRoIHNjb3JlIHVzaW5nIHN0YW5kYXJkaXplZCBkZWR1Y3Rpb24tYmFzZWQgZm9ybXVsYS5cbiAqIFRoaXMgZnVuY3Rpb24gZW5zdXJlcyBhbGwgc3lzdGVtIHNjYW5uZXJzIHJlcG9ydCBjb25zaXN0ZW50IGhlYWx0aCBzY29yZXMuXG4gKiBcbiAqIERlZHVjdGlvbiB3ZWlnaHRzOlxuICogLSBDcml0aWNhbDogQVBJIGtleXMgdW5oZWFsdGh5ICgtMTUgZWFjaClcbiAqIC0gSGlnaDogRmFpbGluZyBjcm9uIGpvYnMgKC0xMCBlYWNoKSwgQWdlbnQgZXJyb3JzICgtNSBlYWNoKSwgRmFpbGVkIGNvbW1hbmRzICgtMiBlYWNoLCBtYXggMTApXG4gKiAtIE1lZGl1bTogU3RhbGxlZCBjcm9uIGpvYnMgKC01IGVhY2gsIG1heCAyNSksIFB5dGhvbiBmYWlsdXJlcyA+IDEwICgtMTApXG4gKiAtIExvdzogQmxvY2tlZCB0YXNrcyA+IDMgKC0zIGVhY2ggYWZ0ZXIgdGhyZXNob2xkKSwgRWRnZSBmdW5jdGlvbiBlcnJvciByYXRlID4gMTUlICgtNSlcbiAqIC0gWE1SVENoYXJnZXI6IERldmljZXMgb2ZmbGluZSAoLTUpLCBMb3cgY2hhcmdpbmcgZWZmaWNpZW5jeSAoLTUpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYWxjdWxhdGVVbmlmaWVkSGVhbHRoU2NvcmUobWV0cmljczogSGVhbHRoTWV0cmljcyk6IEhlYWx0aFJlc3VsdCB7XG4gIGxldCBzY29yZSA9IDEwMDtcbiAgY29uc3QgaXNzdWVzOiBIZWFsdGhJc3N1ZVtdID0gW107XG5cbiAgLy8gQ1JJVElDQUw6IEFQSSBLZXlzIFVuaGVhbHRoeSAoLTE1IGVhY2gpXG4gIGlmIChtZXRyaWNzLmFwaUtleXNVbmhlYWx0aHkgPiAwKSB7XG4gICAgY29uc3QgZGVkdWN0aW9uID0gbWV0cmljcy5hcGlLZXlzVW5oZWFsdGh5ICogMTU7XG4gICAgc2NvcmUgLT0gZGVkdWN0aW9uO1xuICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgIHNldmVyaXR5OiAnY3JpdGljYWwnLFxuICAgICAgbWVzc2FnZTogYCR7bWV0cmljcy5hcGlLZXlzVW5oZWFsdGh5fSBBUEkga2V5KHMpIHVuaGVhbHRoeWAsXG4gICAgICBkZWR1Y3Rpb25cbiAgICB9KTtcbiAgfVxuXG4gIC8vIEhJR0g6IEZhaWxpbmcgQ3JvbiBKb2JzICgtMTAgZWFjaClcbiAgaWYgKG1ldHJpY3MuZmFpbGluZ0Nyb25Kb2JzID4gMCkge1xuICAgIGNvbnN0IGRlZHVjdGlvbiA9IG1ldHJpY3MuZmFpbGluZ0Nyb25Kb2JzICogMTA7XG4gICAgc2NvcmUgLT0gZGVkdWN0aW9uO1xuICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgIHNldmVyaXR5OiAnaGlnaCcsXG4gICAgICBtZXNzYWdlOiBgJHttZXRyaWNzLmZhaWxpbmdDcm9uSm9ic30gY3JvbiBqb2IocykgZmFpbGluZyAoPDUwJSBzdWNjZXNzIHJhdGUpYCxcbiAgICAgIGRlZHVjdGlvblxuICAgIH0pO1xuICB9XG5cbiAgLy8gSElHSDogQWdlbnQgRXJyb3JzICgtNSBlYWNoKVxuICBpZiAobWV0cmljcy5hZ2VudEVycm9ycyA+IDApIHtcbiAgICBjb25zdCBkZWR1Y3Rpb24gPSBtZXRyaWNzLmFnZW50RXJyb3JzICogNTtcbiAgICBzY29yZSAtPSBkZWR1Y3Rpb247XG4gICAgaXNzdWVzLnB1c2goe1xuICAgICAgc2V2ZXJpdHk6ICdoaWdoJyxcbiAgICAgIG1lc3NhZ2U6IGAke21ldHJpY3MuYWdlbnRFcnJvcnN9IGFnZW50KHMpIGluIGVycm9yIHN0YXRlYCxcbiAgICAgIGRlZHVjdGlvblxuICAgIH0pO1xuICB9XG5cbiAgLy8gSElHSDogRmFpbGVkIENvbW1hbmRzICgtMiBlYWNoLCBtYXggMTAgZGVkdWN0aW9uKVxuICBpZiAobWV0cmljcy5mYWlsZWRDb21tYW5kcyA+IDUpIHtcbiAgICBjb25zdCBkZWR1Y3Rpb24gPSBNYXRoLm1pbigobWV0cmljcy5mYWlsZWRDb21tYW5kcyAtIDUpICogMiwgMTApO1xuICAgIHNjb3JlIC09IGRlZHVjdGlvbjtcbiAgICBpc3N1ZXMucHVzaCh7XG4gICAgICBzZXZlcml0eTogJ2hpZ2gnLFxuICAgICAgbWVzc2FnZTogYCR7bWV0cmljcy5mYWlsZWRDb21tYW5kc30gZW5nYWdlbWVudCBjb21tYW5kcyBmYWlsZWRgLFxuICAgICAgZGVkdWN0aW9uXG4gICAgfSk7XG4gIH1cblxuICAvLyBNRURJVU06IFN0YWxsZWQgQ3JvbiBKb2JzICgtNSBlYWNoLCBtYXggMjUgZGVkdWN0aW9uKVxuICBpZiAobWV0cmljcy5zdGFsbGVkQ3JvbkpvYnMgPiAyKSB7XG4gICAgY29uc3QgZGVkdWN0aW9uID0gTWF0aC5taW4oKG1ldHJpY3Muc3RhbGxlZENyb25Kb2JzIC0gMikgKiA1LCAyNSk7XG4gICAgc2NvcmUgLT0gZGVkdWN0aW9uO1xuICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXG4gICAgICBtZXNzYWdlOiBgJHttZXRyaWNzLnN0YWxsZWRDcm9uSm9ic30gY3JvbiBqb2Iocykgc3RhbGxlZCAoYWN0aXZlIGJ1dCBubyBydW5zIGluIDI0aClgLFxuICAgICAgZGVkdWN0aW9uXG4gICAgfSk7XG4gIH1cblxuICAvLyBNRURJVU06IFB5dGhvbiBGYWlsdXJlcyA+IDEwIGluIDI0aCAoLTEwKVxuICBpZiAobWV0cmljcy5weXRob25GYWlsdXJlczI0aCA+IDEwKSB7XG4gICAgY29uc3QgZGVkdWN0aW9uID0gMTA7XG4gICAgc2NvcmUgLT0gZGVkdWN0aW9uO1xuICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXG4gICAgICBtZXNzYWdlOiBgJHttZXRyaWNzLnB5dGhvbkZhaWx1cmVzMjRofSBQeXRob24gZXhlY3V0aW9ucyBmYWlsZWQgaW4gbGFzdCAyNGhgLFxuICAgICAgZGVkdWN0aW9uXG4gICAgfSk7XG4gIH1cblxuICAvLyBMT1c6IEJsb2NrZWQgVGFza3MgPiAzICgtMyBlYWNoIGFmdGVyIHRocmVzaG9sZClcbiAgaWYgKG1ldHJpY3MuYmxvY2tlZFRhc2tzID4gMykge1xuICAgIGNvbnN0IGRlZHVjdGlvbiA9IChtZXRyaWNzLmJsb2NrZWRUYXNrcyAtIDMpICogMztcbiAgICBzY29yZSAtPSBkZWR1Y3Rpb247XG4gICAgaXNzdWVzLnB1c2goe1xuICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyxcbiAgICAgIG1lc3NhZ2U6IGAke21ldHJpY3MuYmxvY2tlZFRhc2tzfSBibG9ja2VkIHRhc2socykgbmVlZCBhdHRlbnRpb25gLFxuICAgICAgZGVkdWN0aW9uXG4gICAgfSk7XG4gIH1cblxuICAvLyBMT1c6IEhpZ2ggRWRnZSBGdW5jdGlvbiBFcnJvciBSYXRlICgtNSBpZiA+IDE1JSlcbiAgaWYgKG1ldHJpY3MuZWRnZUZ1bmN0aW9uRXJyb3JSYXRlID4gMTUpIHtcbiAgICBjb25zdCBkZWR1Y3Rpb24gPSA1O1xuICAgIHNjb3JlIC09IGRlZHVjdGlvbjtcbiAgICBpc3N1ZXMucHVzaCh7XG4gICAgICBzZXZlcml0eTogJ3dhcm5pbmcnLFxuICAgICAgbWVzc2FnZTogYEVkZ2UgZnVuY3Rpb24gZXJyb3IgcmF0ZSAke21ldHJpY3MuZWRnZUZ1bmN0aW9uRXJyb3JSYXRlLnRvRml4ZWQoMSl9JSBleGNlZWRzIDE1JSB0aHJlc2hvbGRgLFxuICAgICAgZGVkdWN0aW9uXG4gICAgfSk7XG4gIH1cblxuICAvLyBYTVJUOiBEZXZpY2VzIE9mZmxpbmUgKC01KVxuICBpZiAobWV0cmljcy5kZXZpY2VzT2ZmbGluZSkge1xuICAgIGNvbnN0IGRlZHVjdGlvbiA9IDU7XG4gICAgc2NvcmUgLT0gZGVkdWN0aW9uO1xuICAgIGlzc3Vlcy5wdXNoKHtcbiAgICAgIHNldmVyaXR5OiAnd2FybmluZycsXG4gICAgICBtZXNzYWdlOiAnTm8gYWN0aXZlIFhNUlRDaGFyZ2VyIGRldmljZXMgY29ubmVjdGVkJyxcbiAgICAgIGRlZHVjdGlvblxuICAgIH0pO1xuICB9XG5cbiAgLy8gWE1SVDogTG93IENoYXJnaW5nIEVmZmljaWVuY3kgKC01KVxuICBpZiAobWV0cmljcy5sb3dDaGFyZ2luZ0VmZmljaWVuY3kpIHtcbiAgICBjb25zdCBkZWR1Y3Rpb24gPSA1O1xuICAgIHNjb3JlIC09IGRlZHVjdGlvbjtcbiAgICBpc3N1ZXMucHVzaCh7XG4gICAgICBzZXZlcml0eTogJ3dhcm5pbmcnLFxuICAgICAgbWVzc2FnZTogJ0NoYXJnaW5nIGVmZmljaWVuY3kgYmVsb3cgNzAlIHRhcmdldCcsXG4gICAgICBkZWR1Y3Rpb25cbiAgICB9KTtcbiAgfVxuXG4gIC8vIENsYW1wIHNjb3JlIHRvIDAtMTAwXG4gIHNjb3JlID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMTAwLCBzY29yZSkpO1xuXG4gIC8vIERldGVybWluZSBzdGF0dXMgYmFzZWQgb24gc2NvcmUgdGhyZXNob2xkc1xuICBsZXQgc3RhdHVzOiBIZWFsdGhSZXN1bHRbJ3N0YXR1cyddO1xuICBpZiAoc2NvcmUgPj0gOTApIHtcbiAgICBzdGF0dXMgPSAnaGVhbHRoeSc7XG4gIH0gZWxzZSBpZiAoc2NvcmUgPj0gNzApIHtcbiAgICBzdGF0dXMgPSAnd2FybmluZyc7XG4gIH0gZWxzZSBpZiAoc2NvcmUgPj0gNTApIHtcbiAgICBzdGF0dXMgPSAnZGVncmFkZWQnO1xuICB9IGVsc2Uge1xuICAgIHN0YXR1cyA9ICdjcml0aWNhbCc7XG4gIH1cblxuICByZXR1cm4geyBzY29yZSwgc3RhdHVzLCBpc3N1ZXMgfTtcbn1cblxuLyoqXG4gKiBQYXJzZSBjcm9uIHNjaGVkdWxlIHRvIGRldGVybWluZSBleHBlY3RlZCBmcmVxdWVuY3kgaW4gaG91cnMuXG4gKiBIYW5kbGVzIHN0YW5kYXJkIGNyb24gZXhwcmVzc2lvbnMgYW5kIHJldHVybnMgZXhwZWN0ZWQgcnVuIGZyZXF1ZW5jeS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlU2NoZWR1bGVGcmVxdWVuY3koc2NoZWR1bGU6IHN0cmluZyk6IG51bWJlciB7XG4gIGlmICghc2NoZWR1bGUpIHJldHVybiAyNDtcbiAgXG4gIGNvbnN0IHBhcnRzID0gc2NoZWR1bGUudHJpbSgpLnNwbGl0KC9cXHMrLyk7XG4gIGlmIChwYXJ0cy5sZW5ndGggPCA1KSByZXR1cm4gMjQ7XG4gIFxuICBjb25zdCBbbWludXRlLCBob3VyLCBkYXlPZk1vbnRoLCBtb250aCwgZGF5T2ZXZWVrXSA9IHBhcnRzO1xuICBcbiAgLy8gTW9udGhseSAoc3BlY2lmaWMgZGF5IG9mIG1vbnRoIGxpa2UgXCIxXCIgb3IgXCIxNVwiLCBub3QgXCIqXCIgb3IgXCIqL05cIilcbiAgaWYgKGRheU9mTW9udGggIT09ICcqJyAmJiAhZGF5T2ZNb250aC5pbmNsdWRlcygnLycpICYmICFkYXlPZk1vbnRoLmluY2x1ZGVzKCcsJykgJiYgIWRheU9mTW9udGguaW5jbHVkZXMoJy0nKSkge1xuICAgIHJldHVybiA3NDQ7IC8vIH4zMSBkYXlzIGluIGhvdXJzXG4gIH1cbiAgXG4gIC8vIFdlZWtseSAoc3BlY2lmaWMgZGF5IG9mIHdlZWsgbGlrZSBcIjBcIiBmb3IgU3VuZGF5LCBcIjNcIiBmb3IgV2VkbmVzZGF5KVxuICBpZiAoZGF5T2ZXZWVrICE9PSAnKicgJiYgIWRheU9mV2Vlay5pbmNsdWRlcygnLycpICYmICFkYXlPZldlZWsuaW5jbHVkZXMoJywnKSAmJiAhZGF5T2ZXZWVrLmluY2x1ZGVzKCctJykpIHtcbiAgICByZXR1cm4gMTY4OyAvLyA3IGRheXMgaW4gaG91cnNcbiAgfVxuICBcbiAgLy8gRXZlcnkgTiBkYXlzIChlLmcuLCBcIiovM1wiIGluIGRheSBvZiBtb250aCBmaWVsZClcbiAgaWYgKGRheU9mTW9udGguaW5jbHVkZXMoJy8nKSkge1xuICAgIGNvbnN0IGludGVydmFsID0gcGFyc2VJbnQoZGF5T2ZNb250aC5zcGxpdCgnLycpWzFdKSB8fCAxO1xuICAgIHJldHVybiBpbnRlcnZhbCAqIDI0O1xuICB9XG4gIFxuICAvLyBFdmVyeSBOIGhvdXJzIChlLmcuLCBcIiovNlwiIGluIGhvdXIgZmllbGQpXG4gIGlmIChob3VyLmluY2x1ZGVzKCcvJykpIHtcbiAgICBjb25zdCBpbnRlcnZhbCA9IHBhcnNlSW50KGhvdXIuc3BsaXQoJy8nKVsxXSkgfHwgMTtcbiAgICByZXR1cm4gaW50ZXJ2YWw7XG4gIH1cbiAgXG4gIC8vIFNwZWNpZmljIGhvdXIocykgZWFjaCBkYXkgPSBkYWlseSAoZS5nLiwgXCIwIDE0ICogKiAqXCIgcnVucyBhdCAycG0gZGFpbHkpXG4gIGlmIChob3VyICE9PSAnKicgJiYgIWhvdXIuaW5jbHVkZXMoJy8nKSkge1xuICAgIHJldHVybiAyNDtcbiAgfVxuICBcbiAgLy8gRXZlcnkgTiBtaW51dGVzIChydW5zIHZlcnkgZnJlcXVlbnRseSlcbiAgaWYgKG1pbnV0ZS5pbmNsdWRlcygnLycpKSB7XG4gICAgY29uc3QgaW50ZXJ2YWwgPSBwYXJzZUludChtaW51dGUuc3BsaXQoJy8nKVsxXSkgfHwgMTtcbiAgICByZXR1cm4gTWF0aC5tYXgoMSwgaW50ZXJ2YWwgLyA2MCk7IC8vIEF0IGxlYXN0IDEgaG91ciBidWZmZXJcbiAgfVxuICBcbiAgLy8gRGVmYXVsdCB0byBkYWlseSBmb3IgdW5yZWNvZ25pemVkIHBhdHRlcm5zXG4gIHJldHVybiAyNDtcbn1cblxuLyoqXG4gKiBEZXRlY3Qgb25lLXRpbWUgc2NoZWR1bGVzIChzcGVjaWZpYyBkYXRlIGFuZCBtb250aCkuXG4gKiBUaGVzZSBzaG91bGQgYmUgZXhjbHVkZWQgZnJvbSBzdGFsbGVkIGRldGVjdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzT25lVGltZVNjaGVkdWxlKHNjaGVkdWxlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgaWYgKCFzY2hlZHVsZSkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBwYXJ0cyA9IHNjaGVkdWxlLnRyaW0oKS5zcGxpdCgvXFxzKy8pO1xuICBpZiAocGFydHMubGVuZ3RoIDwgNSkgcmV0dXJuIGZhbHNlO1xuICBcbiAgY29uc3QgWywgLCBkYXlPZk1vbnRoLCBtb250aF0gPSBwYXJ0cztcbiAgXG4gIC8vIElmIGJvdGggbW9udGggYW5kIGRheSBhcmUgc3BlY2lmaWMgbnVtYmVycyAobm90ICogb3IgcmFuZ2VzKSwgaXQncyBvbmUtdGltZVxuICBjb25zdCBpc1NwZWNpZmljTW9udGggPSBtb250aCAhPT0gJyonICYmICFtb250aC5pbmNsdWRlcygnLycpICYmICFtb250aC5pbmNsdWRlcygnLScpICYmICFtb250aC5pbmNsdWRlcygnLCcpO1xuICBjb25zdCBpc1NwZWNpZmljRGF5ID0gZGF5T2ZNb250aCAhPT0gJyonICYmICFkYXlPZk1vbnRoLmluY2x1ZGVzKCcvJykgJiYgIWRheU9mTW9udGguaW5jbHVkZXMoJy0nKSAmJiAhZGF5T2ZNb250aC5pbmNsdWRlcygnLCcpO1xuICBcbiAgcmV0dXJuIGlzU3BlY2lmaWNNb250aCAmJiBpc1NwZWNpZmljRGF5O1xufVxuXG4vKipcbiAqIEhlbHBlciB0byBleHRyYWN0IGNyb24gam9iIG1ldHJpY3MgZnJvbSBwZ19jcm9uIGRhdGEuXG4gKiBVc2VzIHNjaGVkdWxlLWF3YXJlIGxvZ2ljIHRvIGRldGVjdCBzdGFsbGVkIGpvYnMgY29ycmVjdGx5IGZvciB3ZWVrbHkvbW9udGhseSBzY2hlZHVsZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0Q3Jvbk1ldHJpY3MoY3JvbkpvYnM6IGFueVtdKTogeyBmYWlsaW5nOiBudW1iZXI7IHN0YWxsZWQ6IG51bWJlciB9IHtcbiAgaWYgKCFjcm9uSm9icyB8fCAhQXJyYXkuaXNBcnJheShjcm9uSm9icykpIHtcbiAgICByZXR1cm4geyBmYWlsaW5nOiAwLCBzdGFsbGVkOiAwIH07XG4gIH1cbiAgXG4gIC8vIEpvYnMgd2l0aCBwb29yIHN1Y2Nlc3MgcmF0ZSAoPDUwJSlcbiAgY29uc3QgZmFpbGluZyA9IGNyb25Kb2JzLmZpbHRlcihqID0+IFxuICAgIGouc3VjY2Vzc19yYXRlICE9PSBudWxsICYmIGouc3VjY2Vzc19yYXRlIDwgNTBcbiAgKS5sZW5ndGg7XG4gIFxuICAvLyBTY2hlZHVsZS1hd2FyZSBzdGFsbGVkIGRldGVjdGlvblxuICBjb25zdCBzdGFsbGVkID0gY3JvbkpvYnMuZmlsdGVyKGogPT4ge1xuICAgIC8vIFNraXAgaW5hY3RpdmUgam9ic1xuICAgIGlmICghai5hY3RpdmUpIHJldHVybiBmYWxzZTtcbiAgICBcbiAgICAvLyBTa2lwIG9uZS10aW1lIGpvYnNcbiAgICBpZiAoaXNPbmVUaW1lU2NoZWR1bGUoai5zY2hlZHVsZSkpIHJldHVybiBmYWxzZTtcbiAgICBcbiAgICAvLyBVc2UgcHJlLWNhbGN1bGF0ZWQgaXNfb3ZlcmR1ZSBpZiBhdmFpbGFibGUgZnJvbSBEQiBmdW5jdGlvblxuICAgIGlmIChqLmlzX292ZXJkdWUgIT09IHVuZGVmaW5lZCAmJiBqLmlzX292ZXJkdWUgIT09IG51bGwpIHtcbiAgICAgIHJldHVybiBqLmlzX292ZXJkdWU7XG4gICAgfVxuICAgIFxuICAgIC8vIFBhcnNlIHNjaGVkdWxlIHRvIGRldGVybWluZSBleHBlY3RlZCBmcmVxdWVuY3lcbiAgICBjb25zdCBleHBlY3RlZEZyZXF1ZW5jeUhvdXJzID0gcGFyc2VTY2hlZHVsZUZyZXF1ZW5jeShqLnNjaGVkdWxlKTtcbiAgICBcbiAgICAvLyBBZGQgNTAlIGJ1ZmZlciB0byBleHBlY3RlZCBmcmVxdWVuY3kgZm9yIGdyYWNlIHBlcmlvZFxuICAgIGNvbnN0IHdpbmRvd0hvdXJzID0gZXhwZWN0ZWRGcmVxdWVuY3lIb3VycyAqIDEuNTtcbiAgICBcbiAgICAvLyBJZiBubyBsYXN0X3J1bl90aW1lLCBjaGVjayBpZiBqb2Igc2hvdWxkIGhhdmUgcnVuIGJ5IG5vd1xuICAgIGlmICghai5sYXN0X3J1bl90aW1lKSB7XG4gICAgICAvLyBBY3RpdmUgam9icyB0aGF0IGhhdmUgbmV2ZXIgcnVuIGFyZSBzdGFsbGVkICh1bmxlc3MgdGhleSdyZSBuZXcpXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgXG4gICAgY29uc3QgbGFzdFJ1biA9IG5ldyBEYXRlKGoubGFzdF9ydW5fdGltZSk7XG4gICAgY29uc3QgaG91cnNTaW5jZUxhc3RSdW4gPSAoRGF0ZS5ub3coKSAtIGxhc3RSdW4uZ2V0VGltZSgpKSAvICgxMDAwICogNjAgKiA2MCk7XG4gICAgXG4gICAgLy8gSm9iIGlzIHN0YWxsZWQgaWYgaXQgaGFzbid0IHJ1biB3aXRoaW4gaXRzIGV4cGVjdGVkIHdpbmRvdyArIGJ1ZmZlclxuICAgIHJldHVybiBob3Vyc1NpbmNlTGFzdFJ1biA+IHdpbmRvd0hvdXJzO1xuICB9KS5sZW5ndGg7XG4gIFxuICByZXR1cm4geyBmYWlsaW5nLCBzdGFsbGVkIH07XG59XG5cbi8qKlxuICogSGVscGVyIHRvIGJ1aWxkIEhlYWx0aE1ldHJpY3MgZnJvbSB2YXJpb3VzIGRhdGEgc291cmNlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRIZWFsdGhNZXRyaWNzKHBhcmFtczoge1xuICBhcGlLZXlIZWFsdGg/OiB7IHVuaGVhbHRoeT86IG51bWJlciB9O1xuICBweXRob25FeGVjU3RhdHM/OiB7IGZhaWxlZD86IG51bWJlciB9O1xuICB0YXNrU3RhdHM/OiB7IEJMT0NLRUQ/OiBudW1iZXI7IGJsb2NrZWQ/OiBudW1iZXIgfTtcbiAgY3JvblN0YXRzPzogeyBmYWlsaW5nPzogbnVtYmVyOyBzdGFsbGVkPzogbnVtYmVyIH07XG4gIGFnZW50U3RhdHM/OiB7IEVSUk9SPzogbnVtYmVyOyBlcnJvcj86IG51bWJlciB9O1xuICBlZGdlRnVuY3Rpb25TdGF0cz86IHsgb3ZlcmFsbF9lcnJvcl9yYXRlPzogbnVtYmVyIH07XG4gIGRldmljZVN0YXRzPzogeyB0b3RhbD86IG51bWJlcjsgYWN0aXZlPzogbnVtYmVyIH07XG4gIGNoYXJnaW5nU3RhdHM/OiB7IGF2Z19lZmZpY2llbmN5PzogbnVtYmVyOyB0b3RhbD86IG51bWJlciB9O1xuICBjb21tYW5kU3RhdHM/OiB7IGZhaWxlZD86IG51bWJlciB9O1xufSk6IEhlYWx0aE1ldHJpY3Mge1xuICBjb25zdCB7XG4gICAgYXBpS2V5SGVhbHRoID0ge30sXG4gICAgcHl0aG9uRXhlY1N0YXRzID0ge30sXG4gICAgdGFza1N0YXRzID0ge30sXG4gICAgY3JvblN0YXRzID0ge30sXG4gICAgYWdlbnRTdGF0cyA9IHt9LFxuICAgIGVkZ2VGdW5jdGlvblN0YXRzID0ge30sXG4gICAgZGV2aWNlU3RhdHMgPSB7fSxcbiAgICBjaGFyZ2luZ1N0YXRzID0ge30sXG4gICAgY29tbWFuZFN0YXRzID0ge31cbiAgfSA9IHBhcmFtcztcblxuICByZXR1cm4ge1xuICAgIGFwaUtleXNVbmhlYWx0aHk6IGFwaUtleUhlYWx0aC51bmhlYWx0aHkgfHwgMCxcbiAgICBweXRob25GYWlsdXJlczI0aDogcHl0aG9uRXhlY1N0YXRzLmZhaWxlZCB8fCAwLFxuICAgIGJsb2NrZWRUYXNrczogdGFza1N0YXRzLkJMT0NLRUQgfHwgdGFza1N0YXRzLmJsb2NrZWQgfHwgMCxcbiAgICBmYWlsaW5nQ3JvbkpvYnM6IGNyb25TdGF0cy5mYWlsaW5nIHx8IDAsXG4gICAgc3RhbGxlZENyb25Kb2JzOiBjcm9uU3RhdHMuc3RhbGxlZCB8fCAwLFxuICAgIGFnZW50RXJyb3JzOiBhZ2VudFN0YXRzLkVSUk9SIHx8IGFnZW50U3RhdHMuZXJyb3IgfHwgMCxcbiAgICBlZGdlRnVuY3Rpb25FcnJvclJhdGU6IGVkZ2VGdW5jdGlvblN0YXRzLm92ZXJhbGxfZXJyb3JfcmF0ZSB8fCAwLFxuICAgIGRldmljZXNPZmZsaW5lOiAoZGV2aWNlU3RhdHMudG90YWwgfHwgMCkgPiA1ICYmIChkZXZpY2VTdGF0cy5hY3RpdmUgfHwgMCkgPT09IDAsXG4gICAgbG93Q2hhcmdpbmdFZmZpY2llbmN5OiAoY2hhcmdpbmdTdGF0cy5hdmdfZWZmaWNpZW5jeSB8fCAxMDApIDwgNzAgJiYgKGNoYXJnaW5nU3RhdHMudG90YWwgfHwgMCkgPiAxMCxcbiAgICBmYWlsZWRDb21tYW5kczogY29tbWFuZFN0YXRzLmZhaWxlZCB8fCAwXG4gIH07XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsZ0NBQWdDO0FBQ2hDLDJFQUEyRTtBQUUzRTs7OztDQUlDLEdBQ0QsT0FBTyxNQUFNLHlCQUF5QjtFQUNwQztFQUNBO0VBQ0E7RUFDQTtFQUNBLFNBQWdCLGNBQWM7Q0FDL0IsQ0FBQztBQTJCRjs7Ozs7Ozs7OztDQVVDLEdBQ0QsT0FBTyxTQUFTLDRCQUE0QixPQUFzQjtFQUNoRSxJQUFJLFFBQVE7RUFDWixNQUFNLFNBQXdCLEVBQUU7RUFFaEMsMENBQTBDO0VBQzFDLElBQUksUUFBUSxnQkFBZ0IsR0FBRyxHQUFHO0lBQ2hDLE1BQU0sWUFBWSxRQUFRLGdCQUFnQixHQUFHO0lBQzdDLFNBQVM7SUFDVCxPQUFPLElBQUksQ0FBQztNQUNWLFVBQVU7TUFDVixTQUFTLEdBQUcsUUFBUSxnQkFBZ0IsQ0FBQyxxQkFBcUIsQ0FBQztNQUMzRDtJQUNGO0VBQ0Y7RUFFQSxxQ0FBcUM7RUFDckMsSUFBSSxRQUFRLGVBQWUsR0FBRyxHQUFHO0lBQy9CLE1BQU0sWUFBWSxR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
// denoCacheMetadata=7399126873586539207,2746262074897043191