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
  calculate(
    issues: JiraIssue[],
    activeSprints: number,
    sprint?: DeliveryHealth['sprint'],
  ): DeliveryHealth | undefined {
    if (!issues.length) return undefined;
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
    const leadTimes = completed
      .map((issue) =>
        daysBetween(String(issue.fields.created ?? ''), String(issue.fields.resolutiondate ?? '')),
      )
      .filter(Boolean);
    const averageLeadTimeDays = leadTimes.length
      ? Number((leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length).toFixed(1))
      : 0;
    const completionRate = Math.round((completed.length / issues.length) * 100);
    const inProgress = issues.filter((issue) => {
      const value = fieldText(issue.fields.status).toLowerCase();
      return !completed.includes(issue) && !value.includes('to do');
    });
    const ages = inProgress
      .map((issue) => daysBetween(String(issue.fields.created ?? ''), new Date().toISOString()))
      .filter(Boolean);
    const averageWipAgeDays = ages.length
      ? Number((ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1))
      : 0;
    const storyPointCount = issues.filter((issue) =>
      Number.isFinite(Number(issue.fields.customfield_10064)),
    ).length;
    const storyPointsCoverage = Math.round((storyPointCount / issues.length) * 100);
    const score = clampScore(
      completionRate * 0.6 + Math.max(0, 100 - (blocked.length / issues.length) * 100) * 0.4,
    );
    const teamCounts = new Map<string, number>();
    for (const issue of blocked) {
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
      completionRate,
      blockedIssues: blocked.length,
      inProgressIssues: inProgress.length,
      completedIssues: completed.length,
      issueCount: issues.length,
      workInProgress: inProgress.length,
      throughput: completed.length,
      averageCycleTimeDays: undefined,
      averageLeadTimeDays,
      averageWipAgeDays,
      storyPointsCoverage,
      sprint,
      confidence: storyPointsCoverage >= 80 ? 'high' : storyPointsCoverage >= 50 ? 'medium' : 'low',
      teamAtRisk,
    };
  }
}
