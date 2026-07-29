import type { HealthStatus, HealthThresholds } from '../domain/executive';

export interface HealthMetric {
  key: string;
  value: number;
  label: string;
}

export interface HealthRule {
  metric: HealthMetric;
  weight: number;
  normalize(value: number): number;
  explain(score: number): string;
}

export interface HealthCalculation {
  score: number;
  status: HealthStatus;
  explanations: string[];
}

export class HealthNormalizer {
  static clamp(value: number): number {
    return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
  }
}

export class HealthAggregator {
  aggregate(rules: HealthRule[]): number {
    const totalWeight = rules.reduce((sum, rule) => sum + Math.max(0, rule.weight), 0);
    if (totalWeight === 0) return 0;
    return HealthNormalizer.clamp(
      rules.reduce(
        (sum, rule) => sum + rule.normalize(rule.metric.value) * Math.max(0, rule.weight),
        0,
      ) / totalWeight,
    );
  }
}

export class HealthCalculator {
  constructor(private readonly aggregator = new HealthAggregator()) {}

  calculate(rules: HealthRule[], thresholds: HealthThresholds): HealthCalculation {
    const score = this.aggregator.aggregate(rules);
    const status: HealthStatus =
      score >= thresholds.healthy
        ? 'healthy'
        : score >= thresholds.warning
          ? 'watch'
          : score >= thresholds.critical
            ? 'at_risk'
            : 'critical';
    return {
      score,
      status,
      explanations: rules.map((rule) => rule.explain(rule.normalize(rule.metric.value))),
    };
  }
}

export function createScoreRule(
  key: string,
  label: string,
  value: number,
  weight: number,
): HealthRule {
  return {
    metric: { key, label, value },
    weight,
    normalize: HealthNormalizer.clamp,
    explain: (score) => `${label} contributes ${score}/100 at ${weight}% weight.`,
  };
}
