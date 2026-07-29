import Resolver from '@forge/resolver';
import { SnapshotEngine } from '../../core/application/snapshot-engine';
import { ForgeJiraClient } from '../../infrastructure/atlassian/forge-jira-client';
import { ForgeExecutiveStorage } from '../../infrastructure/storage/forge-executive-storage';
import type { ExecutiveConfiguration } from '../../core/domain/executive';

const resolver = new Resolver();
const storage = new ForgeExecutiveStorage();
const snapshots = new SnapshotEngine(new ForgeJiraClient(), storage);
resolver.define('executive.snapshot', async (request: unknown) => {
  const payload = (request as { payload?: { forceRefresh?: boolean } }).payload;
  return snapshots.getOrCreateExecutiveSnapshot(Boolean(payload?.forceRefresh));
});
resolver.define('executive.configuration.get', async () => storage.getConfiguration());
resolver.define('executive.diagnostics.get', async () => {
  const snapshot = await storage.getLatestSnapshot();
  return snapshot?.metadata;
});
resolver.define('executive.diagnostics.retry', async () =>
  snapshots.getOrCreateExecutiveSnapshot(true),
);
resolver.define('executive.configuration.save', async (request: unknown) => {
  const payload = (request as { payload: ExecutiveConfiguration }).payload;
  await storage.saveConfiguration(payload);
  return storage.getConfiguration();
});
export const handler = resolver.getDefinitions();
