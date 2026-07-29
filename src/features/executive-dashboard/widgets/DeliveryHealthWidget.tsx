import { memo } from 'react';
import type { DeliveryHealth } from '../../../core/domain/executive';
import { HealthCard, TrendCard } from '../../../frontend/components/HealthCards';
import { EmptyState } from '../../../frontend/components/WorkspaceStates';

export const DeliveryHealthWidget = memo(function DeliveryHealthWidget({
  health,
}: {
  health?: DeliveryHealth;
}) {
  if (!health)
    return (
      <EmptyState
        title="Delivery health unavailable"
        description="FlowOS will retry this section during the next refresh."
      />
    );
  return (
    <section className="widget-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Execution</p>
          <h2>Delivery Health</h2>
        </div>
        <span className="section-note">Team requiring attention: {health.teamAtRisk}</span>
      </div>
      <div className="delivery-grid">
        <HealthCard
          title="Overall Delivery"
          score={health.score}
          status={health.status}
          trend={`${health.confidence} confidence`}
          description="Current delivery reliability and execution flow."
          icon="↗"
        />
        <div className="trend-grid">
          <TrendCard
            label="Active cycles"
            value={String(health.activeSprints)}
            detail="Currently in progress"
          />
          <TrendCard
            label="Completion ratio"
            value={`${health.completionRate}%`}
            detail={`${health.completedIssues} of ${health.issueCount} issues completed`}
          />
          <TrendCard
            label="Blocked work"
            value={String(health.blockedIssues)}
            detail="Requires intervention"
          />
          <TrendCard
            label="WIP aging"
            value={`${health.averageWipAgeDays}d`}
            detail={`Cycle time ${
              health.averageCycleTimeDays === undefined
                ? 'Unknown'
                : `${health.averageCycleTimeDays}d`
            }`}
          />
          <TrendCard
            label="Story points coverage"
            value={`${health.storyPointsCoverage}%`}
            detail={`Throughput ${health.throughput} · WIP ${health.workInProgress}`}
          />
        </div>
      </div>
    </section>
  );
});
