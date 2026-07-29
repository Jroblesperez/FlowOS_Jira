import { memo } from 'react';
import { useExecutiveSnapshot } from './hooks/useExecutiveSnapshot';
import {
  useDeliveryHealth,
  useOrganizationHealth,
  useSupplierHealth,
} from './hooks/useHealthSections';
import { ActionCenterWidget } from './widgets/ActionCenterWidget';
import { DeliveryHealthWidget } from './widgets/DeliveryHealthWidget';
import { ExecutiveBriefWidget } from './widgets/ExecutiveBriefWidget';
import { OrganizationHealthWidget } from './widgets/OrganizationHealthWidget';
import { SupplierHealthWidget } from './widgets/SupplierHealthWidget';
import { ErrorState, LoadingState } from '../../frontend/components/WorkspaceStates';
import './executive-workspace.css';

export const ExecutiveWorkspace = memo(function ExecutiveWorkspace() {
  const { snapshot, loading, refreshing, error, refresh, retry } = useExecutiveSnapshot();
  const organization = useOrganizationHealth(snapshot);
  const delivery = useDeliveryHealth(snapshot);
  const { suppliers, attention } = useSupplierHealth(snapshot);
  if (loading && !snapshot) return <LoadingState />;
  if (error && !snapshot) return <ErrorState message={error.message} onRetry={retry} />;
  if (!snapshot)
    return <ErrorState message="No executive snapshot is available." onRetry={retry} />;
  return (
    <main className="executive-workspace">
      <header className="workspace-header">
        <div>
          <p className="organization-name">{snapshot.organizationName}</p>
          <h1>Executive Workspace</h1>
          <p className="workspace-subtitle">The decisions that need your attention today.</p>
        </div>
        <button
          className="button button-subtle refresh-button"
          onClick={refresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>
      {snapshot.metadata?.status === 'partial' ? (
        <div className="partial-banner" role="status">
          Some information is temporarily unavailable. The latest reliable sections remain visible.
        </div>
      ) : null}
      <section className="top-grid">
        <OrganizationHealthWidget health={organization} />
        <div className="attention-card">
          <p className="eyebrow">Needs attention</p>
          <strong>{attention?.supplier ?? delivery?.teamAtRisk ?? 'No immediate risk'}</strong>
          <span>
            {attention
              ? `Supplier health ${attention.score}%`
              : 'Execution is within configured thresholds.'}
          </span>
        </div>
      </section>
      <DeliveryHealthWidget health={delivery} />
      <SupplierHealthWidget suppliers={suppliers} />
      <div className="workspace-columns">
        <ExecutiveBriefWidget summary={snapshot.aiSummary} />
        <ActionCenterWidget recommendations={snapshot.recommendations} />
      </div>
      <footer className="snapshot-footer">
        Updated {new Date(snapshot.date).toLocaleString()} ·{' '}
        {snapshot.metadata?.source ?? 'snapshot'} · {snapshot.metadata?.durationMs ?? 0} ms
      </footer>
    </main>
  );
});
