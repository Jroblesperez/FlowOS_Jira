import { expect, it } from 'vitest';
import { ConfigurationService } from '../src/core/application/configuration-service';
import { defaultExecutiveConfiguration } from '../src/core/application/default-configuration';
import { createScoreRule, HealthCalculator } from '../src/core/application/health-engine';
import { SnapshotEngine } from '../src/core/application/snapshot-engine';
import type { ExecutiveSnapshot } from '../src/core/domain/executive';
import type { JiraClient } from '../src/core/ports/jira-client';
import type { ExecutiveStorage } from '../src/core/ports/executive-storage';
import type { Logger } from '../src/core/ports/logger';

const silentLogger: Logger = { info: () => undefined, error: () => undefined };

it('normalizes and validates legacy configuration safely', () => {
  const service = new ConfigurationService();
  const normalized = service.normalize({
    organizationName: 'Enterprise',
    healthScoreWeights: { delivery: 60, supplier: 30, risk: 10 },
  });
  expect(normalized.healthThresholds.healthy).toBe(85);
  expect(service.validate(normalized).valid).toBe(true);
});

it('rejects duplicate supplier mappings and invalid weight totals', () => {
  const service = new ConfigurationService();
  const configuration = service.normalize({
    ...defaultExecutiveConfiguration,
    healthScoreWeights: { delivery: 80, supplier: 30, risk: 10 },
    suppliers: [
      { name: 'Internal', accountIds: ['same'], capacity: 1 },
      { name: 'SOFKA', accountIds: ['same'], capacity: 1 },
    ],
  });
  const validation = service.validate(configuration);
  expect(validation.valid).toBe(false);
  expect(validation.errors.suppliers).toBeDefined();
  expect(validation.errors.healthScoreWeights).toBeDefined();
});

it('calculates weighted health from independent configurable rules', () => {
  const result = new HealthCalculator().calculate(
    [
      createScoreRule('delivery', 'Delivery', 90, 75),
      createScoreRule('supplier', 'Supplier', 50, 25),
    ],
    { healthy: 85, warning: 70, critical: 55 },
  );
  expect(result.score).toBe(80);
  expect(result.status).toBe('watch');
  expect(result.explanations.length).toBe(2);
});

it('returns a partial snapshot when Jira data is partially unavailable', async () => {
  let saved: ExecutiveSnapshot | undefined;
  const jira: JiraClient = {
    getCurrentUserTenant: async () => 'tenant',
    searchIssues: async () => Promise.reject(new Error('Jira unavailable')),
    countActiveSprints: async () => 2,
  };
  const storage: ExecutiveStorage = {
    getConfiguration: async () => defaultExecutiveConfiguration,
    saveConfiguration: async () => undefined,
    getLatestSnapshot: async () => undefined,
    saveSnapshot: async (snapshot) => {
      saved = snapshot;
    },
  };
  const snapshot = await new SnapshotEngine(
    jira,
    storage,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    silentLogger,
  ).getOrCreateExecutiveSnapshot();
  expect(snapshot.metadata?.status).toBe('partial');
  expect(snapshot.deliveryHealth).toBe(undefined);
  expect(saved?.id).toBe(snapshot.id);
});

it('discards a corrupted cache entry and refreshes it', async () => {
  let searches = 0;
  const corrupted = { id: 'broken', expiresAt: 'not-a-date' } as ExecutiveSnapshot;
  const jira: JiraClient = {
    getCurrentUserTenant: async () => 'tenant',
    searchIssues: async () => {
      searches += 1;
      return [];
    },
    countActiveSprints: async () => 0,
  };
  const storage: ExecutiveStorage = {
    getConfiguration: async () => defaultExecutiveConfiguration,
    saveConfiguration: async () => undefined,
    getLatestSnapshot: async () => corrupted,
    saveSnapshot: async () => undefined,
  };
  const snapshot = await new SnapshotEngine(
    jira,
    storage,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    silentLogger,
  ).getOrCreateExecutiveSnapshot();
  expect(searches).toBe(1);
  expect(snapshot.metadata?.version).toBe(2);
});
