import { memo } from 'react';
import { InsightCard } from '../../../frontend/components/HealthCards';
import { EmptyState } from '../../../frontend/components/WorkspaceStates';

export const ExecutiveBriefWidget = memo(function ExecutiveBriefWidget({
  summary,
}: {
  summary?: string[];
}) {
  return (
    <section className="widget-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Intelligence</p>
          <h2>Executive Brief</h2>
        </div>
        <span className="ai-badge">AI assisted</span>
      </div>
      {summary?.length ? (
        <InsightCard>
          <ul className="brief-list">
            {summary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </InsightCard>
      ) : (
        <EmptyState
          title="Brief temporarily unavailable"
          description="Operational health remains visible while intelligence generation recovers."
        />
      )}
    </section>
  );
});
