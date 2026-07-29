import { memo, type ReactNode } from 'react';
import type { HealthStatus } from '../../core/domain/executive';

interface HealthCardProps {
  title: string;
  score: number;
  status: HealthStatus;
  trend?: string;
  delta?: number;
  description: string;
  explanation?: string;
  action?: string;
  icon?: string;
}

export const HealthCard = memo(function HealthCard({
  title,
  score,
  status,
  trend = 'Stable',
  delta,
  description,
  explanation,
  action,
  icon = '●',
}: HealthCardProps) {
  return (
    <article className={`health-card status-${status}`}>
      <div className="card-heading">
        <span className="card-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="status-label">{status.replace('_', ' ')}</span>
      </div>
      <p className="eyebrow">{title}</p>
      <div className="health-value">
        {score}
        <span>%</span>
      </div>
      <p className="trend-line">
        {trend}
        {delta !== undefined ? ` · ${delta >= 0 ? '+' : ''}${delta}%` : ''}
      </p>
      <p className="card-description">{description}</p>
      {explanation ? (
        <p className="ai-explanation">
          <strong>Insight</strong> {explanation}
        </p>
      ) : null}
      {action ? <button className="text-button">{action}</button> : null}
    </article>
  );
});

export const TrendCard = memo(function TrendCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="trend-card">
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
});

export const InsightCard = memo(function InsightCard({ children }: { children?: ReactNode }) {
  return <article className="insight-card">{children}</article>;
});
export const RiskCard = memo(function RiskCard({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <article className="risk-card">
      <strong>{title}</strong>
      <p>{detail}</p>
    </article>
  );
});
export const RecommendationCard = memo(function RecommendationCard({
  children,
}: {
  children?: unknown;
}) {
  return <article className="recommendation-card">{children}</article>;
});
