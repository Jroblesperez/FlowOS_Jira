export interface AiPrompt {
  system: string;
  user: string;
  metadata?: Record<string, string>;
}
export interface AiProvider {
  readonly id: string;
  complete(prompt: AiPrompt): Promise<string>;
}
export interface AiProviderRegistry {
  getDefault(): AiProvider;
  get(id: string): AiProvider | undefined;
}
