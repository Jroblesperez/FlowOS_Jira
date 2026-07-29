import { kvs } from '@forge/kvs';
import type { ExecutiveSnapshot } from '../../core/domain/metrics';
import type { SnapshotRepository } from '../../core/ports/snapshot-repository';

export class ForgeSnapshotRepository implements SnapshotRepository {
  async save(snapshot: ExecutiveSnapshot): Promise<void> {
    await kvs.set(this.key(snapshot.tenantId), snapshot);
  }
  async getLatest(tenantId: string): Promise<ExecutiveSnapshot | undefined> {
    return kvs.get<ExecutiveSnapshot>(this.key(tenantId));
  }
  private key(tenantId: string): string {
    return `executive-snapshot:${tenantId}`;
  }
}
