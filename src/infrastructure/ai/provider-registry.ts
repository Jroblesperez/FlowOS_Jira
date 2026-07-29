import type { AiProvider, AiProviderRegistry } from '../../core/ports/ai-provider';

class DeterministicProvider implements AiProvider {
  readonly id = 'deterministic-enterprise-coach';
  async complete(): Promise<string> {
    return 'Delivery is stable, but leadership should inspect risk concentration and aging blocked work before the next planning checkpoint.';
  }
}

export class StaticAiProviderRegistry implements AiProviderRegistry {
  private readonly defaultProvider = new DeterministicProvider();
  private readonly providers = new Map<string, AiProvider>([
    [this.defaultProvider.id, this.defaultProvider],
  ]);
  getDefault(): AiProvider {
    return [...this.providers.values()][0];
  }
  get(id: string): AiProvider | undefined {
    return this.providers.get(id);
  }
}
