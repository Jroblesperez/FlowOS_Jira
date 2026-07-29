import { expect, it } from 'vitest';
import { ExecutiveDashboardService } from '../src/core/application/executive-dashboard-service';
import type { AiProviderRegistry } from '../src/core/ports/ai-provider';
import type { JiraClient } from '../src/core/ports/jira-client';
import type { SnapshotRepository } from '../src/core/ports/snapshot-repository';

it('builds and persists an executive snapshot', async () => {
  let saved = false;
  const jira: JiraClient = {
    getCurrentUserTenant: async () => 'tenant-1',
    searchIssues: async () => [
      { key: 'ACC-1', fields: { status: 'Done', priority: 'High' } },
      { key: 'ACC-2', fields: { status: 'In Progress', priority: 'Low' } },
    ],
    getBoard: async () => ({ id: 140, name: 'Pays Genius' }),
    getActiveSprints: async () => [{ id: 1, name: 'Sprint', state: 'active' }],
    getDiagnostics: () => [],
  };
  const repo: SnapshotRepository = {
    save: async () => {
      saved = true;
    },
    getLatest: async () => undefined,
  };
  const ai: AiProviderRegistry = {
    getDefault: () => ({ id: 'test', complete: async () => 'Inspect risk.' }),
    get: () => undefined,
  };
  const snapshot = await new ExecutiveDashboardService(jira, repo, ai).buildSnapshot();
  expect(saved).toBe(true);
  expect(snapshot.metrics.find((metric) => metric.id === 'delivery-health')?.value).toBe(50);
  expect(snapshot.insights[0].summary).toBe('Inspect risk.');
});
