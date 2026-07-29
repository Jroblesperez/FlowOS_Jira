import { storage } from '@forge/api';
import type { ExecutiveConfiguration, ExecutiveSnapshot } from '../../core/domain/executive';
import type { ExecutiveStorage } from '../../core/ports/executive-storage';
import { defaultExecutiveConfiguration } from '../../core/application/default-configuration';
import { ConfigurationService } from '../../core/application/configuration-service';

export class ForgeExecutiveStorage implements ExecutiveStorage {
  private readonly configuration = new ConfigurationService();
  async getConfiguration(): Promise<ExecutiveConfiguration> {
    return this.configuration.normalize(
      (await storage.get<ExecutiveConfiguration>('executive:configuration')) ??
        defaultExecutiveConfiguration,
    );
  }
  async saveConfiguration(config: ExecutiveConfiguration): Promise<void> {
    const normalized = this.configuration.normalize(config);
    const validation = this.configuration.validate(normalized);
    if (!validation.valid) throw new Error(Object.values(validation.errors).join(' '));
    await storage.set('executive:configuration', normalized);
  }
  async getLatestSnapshot(): Promise<ExecutiveSnapshot | undefined> {
    return storage.get<ExecutiveSnapshot>('executive:snapshot:latest');
  }
  async saveSnapshot(snapshot: ExecutiveSnapshot): Promise<void> {
    await storage.set('executive:snapshot:latest', snapshot);
    await storage.set(`executive:snapshot:${snapshot.date}`, snapshot);
  }
}
