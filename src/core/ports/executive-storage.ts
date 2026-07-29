import type { ExecutiveConfiguration, ExecutiveSnapshot } from '../domain/executive';
export interface ExecutiveStorage {
  getConfiguration(): Promise<ExecutiveConfiguration>;
  saveConfiguration(config: ExecutiveConfiguration): Promise<void>;
  getLatestSnapshot(): Promise<ExecutiveSnapshot | undefined>;
  saveSnapshot(snapshot: ExecutiveSnapshot): Promise<void>;
}
