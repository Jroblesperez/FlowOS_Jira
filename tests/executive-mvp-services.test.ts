import { expect, it } from 'vitest';
import { DeliveryHealthService } from '../src/core/application/delivery-health-service';
import { HealthScoringService } from '../src/core/application/health-scoring-service';
import { SupplierHealthService } from '../src/core/application/supplier-health-service';
import { ExecutiveAiBriefService } from '../src/core/application/executive-ai-brief-service';
import { SnapshotEngine } from '../src/core/application/snapshot-engine';
import { defaultExecutiveConfiguration } from '../src/core/application/default-configuration';
import type { ExecutiveSnapshot } from '../src/core/domain/executive';
import type { JiraClient } from '../src/core/ports/jira-client';
import type { ExecutiveStorage } from '../src/core/ports/executive-storage';

const issues = [
  {
    key: 'FLOW-1',
    fields: {
      status: { name: 'Done' },
      created: '2026-07-01T00:00:00.000Z',
      resolutiondate: '2026-07-05T00:00:00.000Z',
      priority: { name: 'Low' },
      assignee: { accountId: 'a' },
    },
  },
  {
    key: 'FLOW-2',
    fields: {
      status: { name: 'Blocked' },
      created: '2026-07-03T00:00:00.000Z',
      priority: { name: 'High' },
      assignee: { accountId: 'b' },
      project: { name: 'Payments' },
    },
  },
];

it('calculates delivery health from Jira work data', () => {
  const result = new DeliveryHealthService().calculate(issues, 2);
  expect(result.activeSprints).toBe(2);
  expect(result.blockedIssues).toBe(1);
  expect(result.teamAtRisk).toBe('Payments');
});

it('calculates supplier health from manual supplier mapping', () => {
  const result = new SupplierHealthService().calculate(issues, [
    { name: 'SOFKA', accountIds: ['b'], capacity: 3 },
  ]);
  expect(result[0].supplier).toBe('SOFKA');
  expect(result[0].blockedIssues).toBe(1);
  expect(result[0].currentCapacity).toBe(3);
});

it('calculates organization health with configurable weights', () => {
  const delivery = new DeliveryHealthService().calculate(issues, 1);
  const suppliers = new SupplierHealthService().calculate(issues, [
    { name: 'SOFKA', accountIds: ['b'], capacity: 3 },
  ]);
  const result = new HealthScoringService().calculateOrganizationHealth(delivery, suppliers, {
    delivery: 60,
    supplier: 30,
    risk: 10,
  });
  expect(result.score > 0).toBe(true);
});

it('generates concise executive brief without Jira terminology', () => {
  const delivery = new DeliveryHealthService().calculate(issues, 1);
  const suppliers = new SupplierHealthService().calculate(issues, [
    { name: 'SOFKA', accountIds: ['b'], capacity: 3 },
  ]);
  const organization = new HealthScoringService().calculateOrganizationHealth(delivery, suppliers, {
    delivery: 60,
    supplier: 30,
    risk: 10,
  });
  const summary = new ExecutiveAiBriefService().summarize(organization, delivery, suppliers, []);
  expect(summary.length <= 10).toBe(true);
  expect(summary.join(' ').includes('Issue')).toBe(false);
});

it('stores and reuses fresh executive snapshots', async () => {
  let latest: ExecutiveSnapshot | undefined;
  let searchCalls = 0;
  const jira: JiraClient = {
    getCurrentUserTenant: async () => 'tenant',
    countActiveSprints: async () => 1,
    searchIssues: async () => {
      searchCalls += 1;
      return issues;
    },
  };
  const storage: ExecutiveStorage = {
    getConfiguration: async () => ({
      ...defaultExecutiveConfiguration,
      suppliers: [{ name: 'SOFKA', accountIds: ['b'], capacity: 3 }],
    }),
    saveConfiguration: async () => undefined,
    getLatestSnapshot: async () => latest,
    saveSnapshot: async (snapshot) => {
      latest = snapshot;
    },
  };
  const engine = new SnapshotEngine(jira, storage);
  await engine.getOrCreateExecutiveSnapshot();
  await engine.getOrCreateExecutiveSnapshot();
  expect(searchCalls).toBe(1);
});
