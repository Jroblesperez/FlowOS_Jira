import type {
  DeliveryHealth,
  HealthScoreWeights,
  HealthStatus,
  HealthThresholds,
  OrganizationHealth,
  SupplierHealth,
} from '../domain/executive';
import { createScoreRule, HealthCalculator, HealthNormalizer } from './health-engine';

const defaultThresholds: HealthThresholds = { healthy: 85, warning: 70, critical: 55 };

export function toHealthStatus(score: number, thresholds = defaultThresholds): HealthStatus {
  return new HealthCalculator().calculate(
    [createScoreRule('score', 'Score', score, 100)],
    thresholds,
  ).status;
}

export const clampScore = HealthNormalizer.clamp;

export class HealthScoringService {
  constructor(private readonly calculator = new HealthCalculator()) {}

  calculateOrganizationHealth(
    delivery: DeliveryHealth,
    suppliers: SupplierHealth[],
    weights: HealthScoreWeights,
    thresholds = defaultThresholds,
  ): OrganizationHealth {
    const supplierAverage =
      suppliers.length === 0
        ? 100
        : suppliers.reduce((total, supplier) => total + supplier.score, 0) / suppliers.length;
    const riskScore = clampScore(
      100 -
        delivery.blockedIssues * 5 -
        suppliers.reduce((total, supplier) => total + supplier.openRisks * 3, 0),
    );
    const result = this.calculator.calculate(
      [
        createScoreRule('delivery', 'Delivery health', delivery.score, weights.delivery),
        createScoreRule('supplier', 'Supplier health', supplierAverage, weights.supplier),
        createScoreRule('risk', 'Risk exposure', riskScore, weights.risk),
      ],
      thresholds,
    );
    const label =
      result.status === 'healthy'
        ? 'Healthy'
        : result.status === 'watch'
          ? 'Watch'
          : result.status === 'at_risk'
            ? 'At risk'
            : 'Critical';
    return { score: result.score, status: result.status, label, explanation: result.explanations };
  }
}
