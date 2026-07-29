export type HealthStatus = 'healthy' | 'watch' | 'at_risk' | 'critical';
export type AccModuleKey =
  | 'executive-dashboard'
  | 'delivery-dashboard'
  | 'sprint-health'
  | 'product-dashboard'
  | 'portfolio-dashboard'
  | 'team-dashboard'
  | 'agile-maturity'
  | 'ai-agile-coach'
  | 'executive-reports'
  | 'dependency-map'
  | 'okrs'
  | 'ai-chat'
  | 'software-house-dashboard'
  | 'pi-planning'
  | 'vmo';

export interface HealthMetric {
  id: string;
  label: string;
  value: number;
  unit: '%' | 'days' | 'count' | 'score' | 'currency';
  status: HealthStatus;
  trend: 'up' | 'down' | 'flat';
}
export interface Insight {
  id: string;
  severity: HealthStatus;
  title: string;
  summary: string;
  recommendedAction: string;
  evidence: string[];
}
export interface ExecutiveSnapshot {
  generatedAt: string;
  tenantId: string;
  metrics: HealthMetric[];
  insights: Insight[];
}
