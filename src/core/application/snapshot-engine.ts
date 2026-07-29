import type { ExecutiveSnapshot, SnapshotFailure, SnapshotSection } from '../domain/executive';
import type { JiraIssue, JiraClient } from '../ports/jira-client';
import type { ExecutiveStorage } from '../ports/executive-storage';
import { consoleLogger, type Logger } from '../ports/logger';
import { ActionCenterService } from './action-center-service';
import { DeliveryHealthService } from './delivery-health-service';
import { ExecutiveAiBriefService } from './executive-ai-brief-service';
import { HealthScoringService } from './health-scoring-service';
import { SupplierHealthService } from './supplier-health-service';

const SNAPSHOT_VERSION = 2 as const;

export class SnapshotEngine {
  private refreshAttempt = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(
    private readonly jira: JiraClient,
    private readonly storage: ExecutiveStorage,
    private readonly delivery = new DeliveryHealthService(),
    private readonly supplier = new SupplierHealthService(),
    private readonly scoring = new HealthScoringService(),
    private readonly actionCenter = new ActionCenterService(),
    private readonly brief = new ExecutiveAiBriefService(),
    private readonly logger: Logger = consoleLogger,
  ) {}

  async getOrCreateExecutiveSnapshot(forceRefresh = false): Promise<ExecutiveSnapshot> {
    const startedAt = Date.now();
    const config = await this.storage.getConfiguration();
    const latest = await this.readValidSnapshot();
    if (!forceRefresh && latest && new Date(latest.expiresAt).getTime() > Date.now()) {
      this.cacheHits += 1;
      this.logger.info('snapshot.cache_hit', {
        snapshotId: latest.id,
        durationMs: Date.now() - startedAt,
      });
      return {
        ...latest,
        metadata: latest.metadata
          ? {
              ...latest.metadata,
              source: 'cache',
              refresh: { ...latest.metadata.refresh, cacheHits: this.cacheHits },
            }
          : undefined,
      };
    }

    this.cacheMisses += 1;
    this.refreshAttempt += 1;
    const failures: SnapshotFailure[] = [];
    let jiraRequestCount = 0;
    const capture = (section: SnapshotSection, error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown service failure';
      failures.push({ section, message, occurredAt: new Date().toISOString() });
      this.logger.error('snapshot.section_failed', { section, message });
    };

    let issues: JiraIssue[] | undefined;
    let activeSprints: number | undefined;
    const [issueResult, sprintResult] = await Promise.allSettled([
      this.jira.searchIssues({
        jql: 'updated >= -30d ORDER BY updated DESC',
        fields: [
          'status',
          'resolutiondate',
          'created',
          'priority',
          'assignee',
          'components',
          'project',
          'labels',
        ],
        maxResults: 10000,
      }),
      this.jira.countActiveSprints(),
    ]);
    jiraRequestCount += 2;
    if (issueResult.status === 'fulfilled') issues = issueResult.value;
    else capture('jira', issueResult.reason);
    if (sprintResult.status === 'fulfilled') activeSprints = sprintResult.value;
    else capture('jira', sprintResult.reason);

    let deliveryHealth = latest?.deliveryHealth;
    let supplierHealth = latest?.supplierHealth;
    if (issues && activeSprints !== undefined) {
      try {
        deliveryHealth = this.delivery.calculate(issues, activeSprints);
      } catch (error) {
        capture('delivery', error);
      }
    } else if (!deliveryHealth) capture('delivery', new Error('Delivery inputs are unavailable.'));
    if (issues) {
      try {
        supplierHealth = this.supplier.calculate(issues, config.suppliers);
      } catch (error) {
        capture('supplier', error);
      }
    } else if (!supplierHealth) capture('supplier', new Error('Supplier inputs are unavailable.'));

    let organizationHealth = latest?.organizationHealth;
    if (deliveryHealth && supplierHealth) {
      try {
        organizationHealth = this.scoring.calculateOrganizationHealth(
          deliveryHealth,
          supplierHealth,
          config.healthScoreWeights,
          config.healthThresholds,
        );
      } catch (error) {
        capture('organization', error);
      }
    } else if (!organizationHealth)
      capture('organization', new Error('Health inputs are unavailable.'));

    const recommendations = deliveryHealth
      ? this.actionCenter.recommend(deliveryHealth, supplierHealth ?? [])
      : (latest?.recommendations ?? []);
    let aiSummary = latest?.aiSummary;
    if (organizationHealth && deliveryHealth) {
      try {
        aiSummary = this.brief.summarize(
          organizationHealth,
          deliveryHealth,
          supplierHealth ?? [],
          recommendations,
        );
      } catch (error) {
        capture('brief', error);
      }
    } else if (!aiSummary) capture('brief', new Error('Brief inputs are unavailable.'));

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + config.refreshFrequencyMinutes * 60000,
    ).toISOString();
    const snapshot: ExecutiveSnapshot = {
      id: `executive:${now.toISOString()}`,
      date: now.toISOString(),
      organizationName: config.organizationName,
      organizationHealth,
      deliveryHealth,
      supplierHealth,
      aiSummary,
      recommendations,
      expiresAt,
      metadata: {
        version: SNAPSHOT_VERSION,
        status: failures.length ? 'partial' : 'complete',
        source: 'refresh',
        generatedAt: now.toISOString(),
        expiresAt,
        durationMs: Date.now() - startedAt,
        jiraRequestCount,
        failures,
        refresh: {
          attempt: this.refreshAttempt,
          cacheHits: this.cacheHits,
          cacheMisses: this.cacheMisses,
        },
      },
    };
    await this.storage.saveSnapshot(snapshot);
    this.logger.info('snapshot.refresh_complete', {
      snapshotId: snapshot.id,
      status: snapshot.metadata?.status,
      durationMs: snapshot.metadata?.durationMs,
      jiraRequestCount,
    });
    return snapshot;
  }

  private async readValidSnapshot(): Promise<ExecutiveSnapshot | undefined> {
    const snapshot = await this.storage.getLatestSnapshot();
    if (!snapshot) return undefined;
    const validDate = Number.isFinite(new Date(snapshot.expiresAt).getTime());
    const validShape = typeof snapshot.id === 'string' && Array.isArray(snapshot.recommendations);
    if (validDate && validShape) return snapshot;
    this.logger.error('snapshot.corrupted', { snapshotId: snapshot.id });
    return undefined;
  }
}
