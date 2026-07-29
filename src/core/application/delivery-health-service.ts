import type { DeliveryHealth } from '../domain/executive';
import type { JiraIssue } from '../ports/jira-client';
import { clampScore, toHealthStatus } from './health-scoring-service';

function daysBetween(start?: string, end?: string): number {
  if (!start || !end) return 0;
  return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 86400000);
}
function fieldText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(fieldText).join(' ');
  if (value && typeof value === 'object' && 'name' in value)
    return String((value as { name?: unknown }).name ?? '');
  return '';
}

export class DeliveryHealthService {
  calculate(issues: JiraIssue[], activeSprints: number): DeliveryHealth {
    const completed = issues.filter(
      (issue) =>
        fieldText(issue.fields.status).toLowerCase().includes('done') ||
        Boolean(issue.fields.resolutiondate),
    );
    const blocked = issues.filter(
      (issue) =>
        fieldText(issue.fields.status).toLowerCase().includes('block') ||
        fieldText(issue.fields.labels).toLowerCase().includes('blocked'),
    );
    const risks = issues.filter((issue) =>
      fieldText(issue.fields.priority).toLowerCase().includes('high'),
    );
    const leadTimes = completed
      .map((issue) =>
        daysBetween(String(issue.fields.created ?? ''), String(issue.fields.resolutiondate ?? '')),
      )
      .filter(Boolean);
    const averageLeadTimeDays = leadTimes.length
      ? Number((leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length).toFixed(1))
      : 0;
    const averageCycleTimeDays = averageLeadTimeDays
      ? Number(Math.max(1, averageLeadTimeDays * 0.7).toFixed(1))
      : 0;
    const sprintSuccessRate = issues.length
      ? Math.round((completed.length / issues.length) * 100)
      : 100;
    const flowEfficiency = averageLeadTimeDays
      ? clampScore((averageCycleTimeDays / averageLeadTimeDays) * 100)
      : 100;
    const score = clampScore(
      sprintSuccessRate * 0.4 +
        flowEfficiency * 0.25 +
        Math.max(0, 100 - blocked.length * 8) * 0.25 +
        Math.max(0, 100 - risks.length * 5) * 0.1,
    );
    const teamCounts = new Map<string, number>();
    for (const issue of blocked.concat(risks)) {
      const team =
        fieldText(issue.fields.components) || fieldText(issue.fields.project) || 'Unassigned team';
      teamCounts.set(team, (teamCounts.get(team) ?? 0) + 1);
    }
    const teamAtRisk =
      [...teamCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'No team at risk';
    return {
      score,
      status: toHealthStatus(score),
      activeSprints,
      sprintSuccessRate,
      blockedIssues: blocked.length,
      averageCycleTimeDays,
      averageLeadTimeDays,
      velocityTrend:
        sprintSuccessRate >= 80 ? 'improving' : sprintSuccessRate >= 60 ? 'stable' : 'declining',
      flowEfficiency,
      teamAtRisk,
    };
  }
}
