import type {
  ExecutiveSnapshot,
  SectionAvailability,
  SnapshotFailure,
  SnapshotSection,
} from '../domain/executive';
import type { JiraIssue, JiraClient } from '../ports/jira-client';
import type { ExecutiveStorage } from '../ports/executive-storage';
import { consoleLogger, type Logger } from '../ports/logger';
import { ActionCenterService } from './action-center-service';
import { DeliveryHealthService } from './delivery-health-service';
import { ExecutiveAiBriefService } from './executive-ai-brief-service';
import { HealthScoringService } from './health-scoring-service';
import { SupplierHealthService } from './supplier-health-service';

const SNAPSHOT_VERSION = 2 as const;
const emptyCoverage = { evaluated: 0, availableFields: [], missingFields: [] };
const unavailable = (
  status: SectionAvailability['status'],
  reason: string,
): SectionAvailability => ({
  status,
  confidence: 'insufficient_data',
  reason,
  coverage: emptyCoverage,
});

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
      const diagnostic =
        error && typeof error === 'object' && 'diagnostic' in error
          ? (error as { diagnostic?: ReturnType<JiraClient['getDiagnostics']>[number] }).diagnostic
          : this.jira.getDiagnostics().slice(-1)[0];
      failures.push({
        section,
        message,
        occurredAt: new Date().toISOString(),
        operation: diagnostic?.operation,
        endpoint: diagnostic?.endpoint,
        httpStatus: diagnostic?.httpStatus,
        source: diagnostic?.source,
      });
      this.logger.error('snapshot.section_failed', {
        section,
        message,
        operation: diagnostic?.operation,
        endpoint: diagnostic?.endpoint,
        httpStatus: diagnostic?.httpStatus,
      });
    };

    let issues: JiraIssue[] | undefined;
    let activeSprints: number | undefined;
    let activeSprint:
      { id: number; name: string; startDate?: string; endDate?: string } | undefined;
    let boardFound = false;
    const [issueResult, boardResult] = await Promise.allSettled([
      this.jira.searchIssues({
        jql: `project = ${config.pilotProjectKey} ORDER BY updated DESC`,
        fields: [
          'status',
          'resolutiondate',
          'created',
          'priority',
          'assignee',
          'components',
          'project',
          'labels',
          'customfield_10064',
        ],
        maxResults: 500,
        projectKey: config.pilotProjectKey,
      }),
      this.jira.getBoard(config.pilotBoardId),
    ]);
    jiraRequestCount += 2;
    if (issueResult.status === 'fulfilled') issues = issueResult.value;
    else capture('jira', issueResult.reason);
    if (boardResult.status === 'fulfilled') {
      boardFound = true;
      const sprintResult = await Promise.allSettled([
        this.jira.getActiveSprints(config.pilotBoardId),
      ]);
      jiraRequestCount += 1;
      if (sprintResult[0].status === 'fulfilled') {
        activeSprints = sprintResult[0].value.length;
        activeSprint = sprintResult[0].value[0];
      } else capture('jira', sprintResult[0].reason);
    } else capture('jira', boardResult.reason);

    let deliveryHealth = latest?.deliveryHealth;
    let supplierHealth = latest?.supplierHealth;
    if (issues && activeSprints !== undefined) {
      try {
        deliveryHealth = this.delivery.calculate(issues, activeSprints, activeSprint);
      } catch (error) {
        capture('delivery', error);
      }
    } else if (!deliveryHealth) capture('delivery', new Error('Delivery inputs are unavailable.'));
    const configuredSuppliers = config.suppliers.filter((supplier) => supplier.accountIds.length);
    if (issues && configuredSuppliers.length) {
      try {
        supplierHealth = this.supplier.calculate(issues, configuredSuppliers);
      } catch (error) {
        capture('supplier', error);
      }
    } else if (!configuredSuppliers.length) supplierHealth = undefined;
    else if (!supplierHealth) capture('supplier', new Error('Supplier inputs are unavailable.'));

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
    const diagnostics = this.jira.getDiagnostics();
    const issueCoverage = issues
      ? {
          evaluated: issues.length,
          expected: issues.length,
          percentage: 100,
          availableFields: ['status', 'created'],
          missingFields: issues.some((issue) => issue.fields.customfield_10064 === undefined)
            ? ['Story Points']
            : [],
        }
      : emptyCoverage;
    const availability: Record<SnapshotSection, SectionAvailability> = {
      jira: failures.some((failure) => failure.section === 'jira')
        ? unavailable('source_error', 'One or more Jira pilot operations failed.')
        : {
            status: issues?.length ? 'available' : 'evaluated_no_findings',
            confidence: issues?.length ? 'medium' : 'low',
            coverage: issueCoverage,
          },
      delivery: deliveryHealth
        ? failures.some((failure) => failure.section === 'jira')
          ? {
              status: 'partial_coverage',
              confidence: 'low',
              reason: 'Using the latest reliable delivery result after a Jira source failure.',
              coverage: issueCoverage,
            }
          : {
              status: deliveryHealth.storyPointsCoverage < 100 ? 'partial_coverage' : 'available',
              confidence: deliveryHealth.confidence,
              coverage: issueCoverage,
            }
        : failures.some((failure) => failure.section === 'jira')
          ? unavailable('source_error', 'Board, sprint, or issue data is unavailable.')
          : unavailable('insufficient_data', 'No issues were available for evaluation.'),
      supplier: configuredSuppliers.length
        ? supplierHealth?.length
          ? {
              status: failures.some((failure) => failure.section === 'jira')
                ? 'partial_coverage'
                : 'available',
              confidence: failures.some((failure) => failure.section === 'jira') ? 'low' : 'medium',
              coverage: issueCoverage,
            }
          : unavailable('insufficient_data', 'No pilot issues matched configured suppliers.')
        : unavailable('not_configured', 'Map Jira users to suppliers in Configuration.'),
      organization: organizationHealth
        ? {
            status: failures.length ? 'partial_coverage' : 'available',
            confidence: failures.length ? 'low' : 'medium',
            coverage: issueCoverage,
          }
        : unavailable('insufficient_data', 'Delivery and supplier inputs are required.'),
      brief: aiSummary
        ? { status: 'available', confidence: 'medium', coverage: issueCoverage }
        : unavailable('insufficient_data', 'Executive brief inputs are incomplete.'),
    };
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
        status:
          failures.length ||
          Object.values(availability).some(
            (section) =>
              section.status !== 'available' && section.status !== 'evaluated_no_findings',
          )
            ? 'partial'
            : 'complete',
        source: 'refresh',
        generatedAt: now.toISOString(),
        expiresAt,
        durationMs: Date.now() - startedAt,
        jiraRequestCount,
        failures,
        availability,
        diagnostics,
        issueCount: issues?.length ?? 0,
        boardCount: boardFound ? 1 : 0,
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
