import type { SupplierConfiguration, SupplierHealth } from '../domain/executive';
import type { JiraIssue } from '../ports/jira-client';
import { clampScore, toHealthStatus } from './health-scoring-service';

function accountId(issue: JiraIssue): string {
  const assignee = issue.fields.assignee as { accountId?: string } | undefined;
  return assignee?.accountId ?? '';
}
function status(issue: JiraIssue): string {
  const value = issue.fields.status as { name?: string } | string | undefined;
  return typeof value === 'string' ? value : (value?.name ?? '');
}
function priority(issue: JiraIssue): string {
  const value = issue.fields.priority as { name?: string } | string | undefined;
  return typeof value === 'string' ? value : (value?.name ?? '');
}
function daysBetween(start?: string, end?: string): number {
  if (!start || !end) return 0;
  return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 86400000);
}

export class SupplierHealthService {
  calculate(issues: JiraIssue[], suppliers: SupplierConfiguration[]): SupplierHealth[] {
    return suppliers.map((supplier) => {
      const supplierIssues = issues.filter((issue) =>
        supplier.accountIds.includes(accountId(issue)),
      );
      const completed = supplierIssues.filter((issue) => Boolean(issue.fields.resolutiondate));
      const blockedIssues = supplierIssues.filter((issue) =>
        status(issue).toLowerCase().includes('block'),
      ).length;
      const openRisks = supplierIssues.filter(
        (issue) => priority(issue).toLowerCase().includes('high') && !issue.fields.resolutiondate,
      ).length;
      const resolutionTimes = completed
        .map((issue) =>
          daysBetween(
            String(issue.fields.created ?? ''),
            String(issue.fields.resolutiondate ?? ''),
          ),
        )
        .filter(Boolean);
      const averageResolutionTimeDays = resolutionTimes.length
        ? Number((resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length).toFixed(1))
        : 0;
      const score = clampScore(
        100 - blockedIssues * 10 - openRisks * 8 - Math.max(0, averageResolutionTimeDays - 7) * 2,
      );
      return {
        supplier: supplier.name,
        score,
        status: toHealthStatus(score),
        resources: supplier.accountIds.length,
        openRisks,
        blockedIssues,
        averageResolutionTimeDays,
        currentCapacity: supplier.capacity,
      };
    });
  }
}
