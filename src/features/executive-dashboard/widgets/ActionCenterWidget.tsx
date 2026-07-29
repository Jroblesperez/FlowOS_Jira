import { memo, useCallback, useState } from 'react';
import type { ExecutiveRecommendation } from '../../../core/domain/executive';
import { RecommendationCard } from '../../../frontend/components/HealthCards';
import { EmptyState } from '../../../frontend/components/WorkspaceStates';

export const ActionCenterWidget = memo(function ActionCenterWidget({
  recommendations,
  evaluated,
}: {
  recommendations: ExecutiveRecommendation[];
  evaluated: boolean;
}) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const dismiss = useCallback((id: string) => setDismissed((current) => [...current, id]), []);
  const visible = recommendations.filter((item) => !dismissed.includes(item.id));
  return (
    <section className="widget-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Decisions</p>
          <h2>Action Center</h2>
        </div>
        <span className="section-note">{visible.length} open</span>
      </div>
      {visible.length ? (
        <div className="action-list">
          {visible.map((action) => (
            <RecommendationCard key={action.id}>
              <div className="action-priority">
                <span className={`priority priority-${action.priority}`}>{action.priority}</span>
                <span>{action.category}</span>
                {action.confidence === undefined ? null : (
                  <span>{action.confidence}% confidence</span>
                )}
              </div>
              <h3>{action.title}</h3>
              <p>{action.businessImpact}</p>
              <dl>
                <div>
                  <dt>Estimated benefit</dt>
                  <dd>{action.estimatedBenefit}</dd>
                </div>
                <div>
                  <dt>Recommended action</dt>
                  <dd>{action.recommendedAction}</dd>
                </div>
              </dl>
              <div className="card-actions">
                <button className="button button-primary">Open</button>
                <button className="button button-subtle" onClick={() => dismiss(action.id)}>
                  Dismiss
                </button>
              </div>
            </RecommendationCard>
          ))}
        </div>
      ) : evaluated ? (
        <EmptyState
          title="Inbox clear"
          description="There are no open executive actions requiring attention."
        />
      ) : (
        <EmptyState
          title="Decisions could not be evaluated"
          description="The pilot data source did not provide enough reliable evidence."
        />
      )}
    </section>
  );
});
