import type { HealthMetric } from '../../core/domain/metrics';
import { accTokens } from '../theme/tokens';
export function MetricCard({ metric }: { metric: HealthMetric }) {
  return (
    <article
      style={{
        background: accTokens.color.panel,
        borderRadius: accTokens.radius,
        padding: accTokens.spacing.md,
      }}
    >
      <p style={{ color: accTokens.color.subtle, margin: 0 }}>{metric.label}</p>
      <strong style={{ fontSize: 28 }}>
        {metric.value}
        {metric.unit === 'count' ? '' : metric.unit}
      </strong>
      <p>{metric.status.replace('_', ' ')}</p>
    </article>
  );
}
