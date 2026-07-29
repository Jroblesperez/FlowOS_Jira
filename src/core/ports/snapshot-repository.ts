import type { ExecutiveSnapshot } from '../domain/metrics';
export interface SnapshotRepository {
  save(snapshot: ExecutiveSnapshot): Promise<void>;
  getLatest(tenantId: string): Promise<ExecutiveSnapshot | undefined>;
}
