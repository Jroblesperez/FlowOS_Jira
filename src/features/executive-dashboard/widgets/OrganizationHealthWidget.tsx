import { memo } from 'react';
import type { OrganizationHealth } from '../../../core/domain/executive';
import { HealthCard } from '../../../frontend/components/HealthCards';
import { EmptyState } from '../../../frontend/components/WorkspaceStates';

export const OrganizationHealthWidget = memo(function OrganizationHealthWidget({
  health,
  previousScore,
}: {
  health?: OrganizationHealth;
  previousScore?: number;
}) {
  if (!health)
    return (
      <EmptyState
        title="Organization health unavailable"
        description="Other workspace sections remain available while this calculation recovers."
      />
    );
  const delta = previousScore === undefined ? undefined : health.score - previousScore;
  return (
    <HealthCard
      title="Organization Health"
      score={health.score}
      status={health.status}
      trend={
        delta === undefined
          ? health.label
          : delta > 0
            ? 'Improving'
            : delta < 0
              ? 'Declining'
              : 'Stable'
      }
      delta={delta}
      description="A weighted view of delivery, supplier performance, and execution risk."
      explanation={health.explanation[0]}
      action="Review drivers"
      icon="◆"
    />
  );
});
