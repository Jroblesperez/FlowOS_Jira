import { expect, it } from 'vitest';
import { DeliveryHealthService } from '../src/core/application/delivery-health-service';
import { defaultExecutiveConfiguration } from '../src/core/application/default-configuration';
import { SnapshotEngine } from '../src/core/application/snapshot-engine';
import type { ExecutiveSnapshot, JiraDiagnostic } from '../src/core/domain/executive';
import type { ExecutiveStorage } from '../src/core/ports/executive-storage';
import type { JiraClient, JiraIssue } from '../src/core/ports/jira-client';
import type { Logger } from '../src/core/ports/logger';

const logger: Logger = { info: () => undefined, error: () => undefined };

function storage(configuration = defaultExecutiveConfiguration): ExecutiveStorage {
  let latest: ExecutiveSnapshot | undefined;
  return {
    getConfiguration: async () => configuration,
    saveConfiguration: async () => undefined,
    getLatestSnapshot: async () => latest,
    saveSnapshot: async (snapshot) => {
      latest = snapshot;
    },
  };
}

function jira(overrides: Partial<JiraClient> = {}): JiraClient {
  return {
    searchIssues: async () => [],
    getCurrentUserTenant: async () => 'user',
    getBoard: async () => ({ id: 140, name: 'Pays Genius' }),
    getActiveSprints: async () => [],
    getDiagnostics: () => [],
    ...overrides,
  };
}

it('does not report healthy delivery when Jira returns zero issues', async () => {
  const snapshot = await new SnapshotEngine(
    jira(),
    storage(),
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    logger,
  ).getOrCreateExecutiveSnapshot();
  expect(snapshot.deliveryHealth).toBe(undefined);
  expect(snapshot.metadata?.availability.delivery.status).toBe('insufficient_data');
  expect(snapshot.metadata?.availability.delivery.confidence).toBe('insufficient_data');
  expect(snapshot.metadata?.availability.jira.status).toBe('evaluated_no_findings');
});

it('marks supplier health as not configured instead of assigning a perfect score', async () => {
  const snapshot = await new SnapshotEngine(
    jira({ searchIssues: async () => [{ key: 'CPD-1', fields: { status: 'In Progress' } }] }),
    storage(),
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    logger,
  ).getOrCreateExecutiveSnapshot();
  expect(snapshot.supplierHealth).toBe(undefined);
  expect(snapshot.metadata?.availability.supplier.status).toBe('not_configured');
});

it('does not assign a perfect supplier score when configured accounts have no issues', async () => {
  const configured = {
    ...defaultExecutiveConfiguration,
    suppliers: [{ name: 'SOFKA' as const, accountIds: ['supplier-user'], capacity: 2 }],
  };
  const snapshot = await new SnapshotEngine(
    jira({ searchIssues: async () => [{ key: 'CPD-1', fields: { status: 'In Progress' } }] }),
    storage(configured),
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    logger,
  ).getOrCreateExecutiveSnapshot();
  expect(snapshot.supplierHealth?.length).toBe(0);
  expect(snapshot.metadata?.availability.supplier.status).toBe('insufficient_data');
});

it('keeps sprint source failures distinct from a confirmed zero sprint result', async () => {
  const diagnostic: JiraDiagnostic = {
    operation: 'getActiveSprints',
    endpoint: '/rest/agile/1.0/board/140/sprint?state=active',
    method: 'GET',
    timestamp: new Date().toISOString(),
    durationMs: 3,
    result: 'error',
    httpStatus: 401,
    source: 'jira-software',
  };
  const snapshot = await new SnapshotEngine(
    jira({
      searchIssues: async () => [{ key: 'CPD-1', fields: { status: 'In Progress' } }],
      getActiveSprints: async () => Promise.reject(new Error('Authentication Required')),
      getDiagnostics: () => [diagnostic],
    }),
    storage(),
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    logger,
  ).getOrCreateExecutiveSnapshot();
  expect(snapshot.deliveryHealth).toBe(undefined);
  expect(snapshot.metadata?.availability.delivery.status).toBe('source_error');
  expect(snapshot.metadata?.failures.some((failure) => failure.httpStatus === 401)).toBe(true);
});

it('never manufactures cycle time or enterprise risk from priority', () => {
  const issues: JiraIssue[] = [
    {
      key: 'CPD-1',
      fields: {
        status: { name: 'In Progress' },
        priority: { name: 'High' },
        created: '2026-07-20T00:00:00.000Z',
      },
    },
  ];
  const delivery = new DeliveryHealthService().calculate(issues, 0);
  expect(delivery?.averageCycleTimeDays).toBe(undefined);
  expect(delivery?.blockedIssues).toBe(0);
});
