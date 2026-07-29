import type { AccModuleKey } from '../../core/domain/metrics';
export interface FeatureDefinition {
  key: AccModuleKey;
  label: string;
  phase: 'foundation' | 'scale' | 'enterprise';
  enabledByDefault: boolean;
}
export const featureCatalog: FeatureDefinition[] = [
  {
    key: 'executive-dashboard',
    label: 'Executive Dashboard',
    phase: 'foundation',
    enabledByDefault: true,
  },
  {
    key: 'delivery-dashboard',
    label: 'Delivery Dashboard',
    phase: 'foundation',
    enabledByDefault: true,
  },
  { key: 'sprint-health', label: 'Sprint Health', phase: 'foundation', enabledByDefault: true },
  { key: 'ai-agile-coach', label: 'AI Agile Coach', phase: 'foundation', enabledByDefault: true },
  {
    key: 'portfolio-dashboard',
    label: 'Portfolio Dashboard',
    phase: 'scale',
    enabledByDefault: false,
  },
  { key: 'dependency-map', label: 'Dependency Map', phase: 'scale', enabledByDefault: false },
  { key: 'okrs', label: 'OKRs', phase: 'scale', enabledByDefault: false },
  {
    key: 'executive-reports',
    label: 'Executive Reports',
    phase: 'enterprise',
    enabledByDefault: false,
  },
  {
    key: 'product-dashboard',
    label: 'Product Dashboard',
    phase: 'enterprise',
    enabledByDefault: false,
  },
  { key: 'team-dashboard', label: 'Team Dashboard', phase: 'enterprise', enabledByDefault: false },
  { key: 'agile-maturity', label: 'Agile Maturity', phase: 'enterprise', enabledByDefault: false },
  { key: 'ai-chat', label: 'AI Chat', phase: 'enterprise', enabledByDefault: false },
  {
    key: 'software-house-dashboard',
    label: 'Software House Dashboard',
    phase: 'enterprise',
    enabledByDefault: false,
  },
  { key: 'pi-planning', label: 'PI Planning', phase: 'enterprise', enabledByDefault: false },
  { key: 'vmo', label: 'VMO', phase: 'enterprise', enabledByDefault: false },
];
