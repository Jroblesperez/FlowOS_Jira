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
          trend={health.velocityTrend}
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
            label="Success rate"
            value={`${health.sprintSuccessRate}%`}
            detail="Completed work ratio"
          />
          <TrendCard
            label="Blocked work"
            value={String(health.blockedIssues)}
            detail="Requires intervention"
          />
          <TrendCard
            label="Cycle time"
            value={`${health.averageCycleTimeDays}d`}
            detail={`Lead time ${health.averageLeadTimeDays}d`}
          />
          <TrendCard
            label="Flow efficiency"
            value={`${health.flowEfficiency}%`}
            detail={`Velocity ${health.velocityTrend}`}
          />
        </div>
      </div>
    </section>
  );
});
