export type HealthStatus = 'healthy' | 'watch' | 'at_risk' | 'critical';
export type SupplierName = 'Internal' | 'SOFKA' | 'NTT DATA' | 'NEORIS' | 'DEVSU' | 'Others';
export type SnapshotSection = 'jira' | 'delivery' | 'supplier' | 'organization' | 'brief';

export interface HealthThresholds {
  healthy: number;
  warning: number;
  critical: number;
}

export interface HealthScoreWeights {
  delivery: number;
  supplier: number;
  risk: number;
}

export interface SupplierConfiguration {
  name: SupplierName;
  accountIds: string[];
  capacity: number;
}

export interface ExecutiveConfiguration {
  organizationName: string;
  suppliers: SupplierConfiguration[];
  healthScoreWeights: HealthScoreWeights;
  healthThresholds: HealthThresholds;
  workingDays: number[];
  businessHours: { start: string; end: string; timeZone: string };
  aiProvider: 'mock';
  refreshFrequencyMinutes: number;
  featureFlags: { executiveWorkspace: boolean; configurationPage: boolean };
}

export interface DeliveryHealth {
  score: number;
  status: HealthStatus;
  activeSprints: number;
  sprintSuccessRate: number;
  blockedIssues: number;
  averageCycleTimeDays: number;
  averageLeadTimeDays: number;
  velocityTrend: 'improving' | 'stable' | 'declining';
  flowEfficiency: number;
  teamAtRisk: string;
}

export interface SupplierHealth {
  supplier: SupplierName;
  score: number;
  status: HealthStatus;
  resources: number;
  openRisks: number;
  blockedIssues: number;
  averageResolutionTimeDays: number;
  currentCapacity: number;
}

export interface OrganizationHealth {
  score: number;
  status: HealthStatus;
  label: string;
  explanation: string[];
}

export interface ExecutiveRecommendation {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  category: 'delivery' | 'supplier' | 'flow';
  businessImpact: string;
  estimatedBenefit: string;
  confidence: number;
  recommendedAction: string;
  futureStatus: 'open' | 'dismissed' | 'completed';
}

export interface SnapshotFailure {
  section: SnapshotSection;
  message: string;
  occurredAt: string;
}

export interface SnapshotMetadata {
  version: 2;
  status: 'complete' | 'partial';
  source: 'cache' | 'refresh';
  generatedAt: string;
  expiresAt: string;
  durationMs: number;
  jiraRequestCount: number;
  failures: SnapshotFailure[];
  refresh: { attempt: number; cacheHits: number; cacheMisses: number };
}

export interface ExecutiveSnapshot {
  id: string;
  date: string;
  organizationName: string;
  organizationHealth?: OrganizationHealth;
  deliveryHealth?: DeliveryHealth;
  supplierHealth?: SupplierHealth[];
  aiSummary?: string[];
  recommendations: ExecutiveRecommendation[];
  expiresAt: string;
  metadata?: SnapshotMetadata;
}
