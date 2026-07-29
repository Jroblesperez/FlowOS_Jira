import type { ExecutiveSnapshot, HealthMetric, Insight } from '../domain/metrics';
import type { AiProviderRegistry } from '../ports/ai-provider';
import type { JiraClient } from '../ports/jira-client';
import type { SnapshotRepository } from '../ports/snapshot-repository';

export class ExecutiveDashboardService {
  constructor(
    private readonly jira: JiraClient,
    private readonly snapshots: SnapshotRepository,
    private readonly ai: AiProviderRegistry,
  ) {}

  async buildSnapshot(): Promise<ExecutiveSnapshot> {
    const tenantId = await this.jira.getCurrentUserTenant();
    const issues = await this.jira.searchIssues({
      jql: 'updated >= -30d ORDER BY updated DESC',
      fields: ['status', 'resolutiondate', 'created', 'priority'],
      maxResults: 100,
    });
    const done = issues.filter((issue) =>
      String(issue.fields.status ?? '')
        .toLowerCase()
        .includes('done'),
    ).length;
    const deliveryScore = issues.length === 0 ? 100 : Math.round((done / issues.length) * 100);
    const metrics: HealthMetric[] = [
      {
        id: 'delivery-health',
        label: 'Delivery Health',
        value: deliveryScore,
        unit: '%',
        status: deliveryScore >= 80 ? 'healthy' : deliveryScore >= 60 ? 'watch' : 'at_risk',
        trend: 'flat',
      },
      {
        id: 'flow-health',
        label: 'Flow Health',
        value: Math.max(0, 100 - issues.length),
        unit: 'score',
        status: issues.length > 80 ? 'watch' : 'healthy',
        trend: 'flat',
      },
      {
        id: 'risk-count',
        label: 'Open Risks',
        value: issues.filter((issue) => String(issue.fields.priority ?? '').includes('High'))
          .length,
        unit: 'count',
        status: 'watch',
        trend: 'up',
      },
    ];
    const aiSummary = await this.ai.getDefault().complete({
      system: 'You are an enterprise agile coach. Return one concise executive insight.',
      user: JSON.stringify({ metrics }),
    });
    const insights: Insight[] = [
      {
        id: 'ai-executive-summary',
        severity: metrics[0].status,
        title: 'AI executive summary',
        summary: aiSummary,
        recommendedAction: 'Review the riskiest initiatives and unblock the oldest work items.',
        evidence: metrics.map((metric) => `${metric.label}: ${metric.value}${metric.unit}`),
      },
    ];
    const snapshot = { generatedAt: new Date().toISOString(), tenantId, metrics, insights };
    await this.snapshots.save(snapshot);
    return snapshot;
  }
}
