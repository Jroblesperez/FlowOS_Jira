export type HealthStatus = 'healthy' | 'watch' | 'at_risk' | 'critical' | 'unknown';
export type SupplierName = 'Internal' | 'SOFKA' | 'NTT DATA' | 'NEORIS' | 'DEVSU' | 'Others';
export type SnapshotSection = 'jira' | 'delivery' | 'supplier' | 'organization' | 'brief';
export type AvailabilityStatus =
  | 'available'
  | 'insufficient_data'
  | 'source_error'
  | 'not_configured'
  | 'partial_coverage'
  | 'evaluated_no_findings';
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient_data';

export interface DataCoverage {
  evaluated: number;
  expected?: number;
  percentage?: number;
  availableFields: string[];
  missingFields: string[];
}

export interface SectionAvailability {
  status: AvailabilityStatus;
  confidence: ConfidenceLevel;
  reason?: string;
  coverage: DataCoverage;
}

export interface JiraDiagnostic {
  operation: string;
  endpoint: string;
  method: 'GET' | 'POST';
  timestamp: string;
  durationMs: number;
  result: 'success' | 'empty' | 'error';
  httpStatus?: number;
  itemCount?: number;
  projectKey?: string;
  boardId?: number;
  jql?: string;
  safeMessage?: string;
  source: 'jira-platform' | 'jira-software';
  possibleScope?: string;
  lastSuccessfulAt?: string;
}

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
  pilotProjectKey: string;
  pilotBoardId: number;
  featureFlags: { executiveWorkspace: boolean; configurationPage: boolean };
}

export interface DeliveryHealth {
  score: number;
  status: HealthStatus;
  activeSprints: number;
  completionRate: number;
  blockedIssues: number;
  inProgressIssues: number;
  completedIssues: number;
  issueCount: number;
  workInProgress: number;
  throughput: number;
  averageCycleTimeDays?: number;
  averageLeadTimeDays: number;
  averageWipAgeDays: number;
  storyPointsCoverage: number;
  sprint?: { id: number; name: string; startDate?: string; endDate?: string };
  confidence: ConfidenceLevel;
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
  confidence?: number;
  recommendedAction: string;
  futureStatus: 'open' | 'dismissed' | 'completed';
}

export interface SnapshotFailure {
  section: SnapshotSection;
  message: string;
  occurredAt: string;
  operation?: string;
  endpoint?: string;
  httpStatus?: number;
  source?: JiraDiagnostic['source'];
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
  availability: Record<SnapshotSection, SectionAvailability>;
  diagnostics: JiraDiagnostic[];
  issueCount: number;
  boardCount: number;
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
