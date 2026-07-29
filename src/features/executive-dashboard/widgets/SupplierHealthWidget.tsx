import { memo } from 'react';
import type { SupplierHealth } from '../../../core/domain/executive';
import { EmptyState } from '../../../frontend/components/WorkspaceStates';

export const SupplierHealthWidget = memo(function SupplierHealthWidget({
  suppliers,
}: {
  suppliers: SupplierHealth[];
}) {
  if (!suppliers.length)
    return (
      <EmptyState
        title="No supplier data"
        description="Map Jira accounts to suppliers in Configuration to activate this view."
      />
    );
  return (
    <section className="widget-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Partners</p>
          <h2>Supplier Health</h2>
        </div>
        <span className="section-note">Lowest scores appear first</span>
      </div>
      <div className="supplier-list">
        {suppliers
          .slice()
          .sort((a, b) => a.score - b.score)
          .map((supplier) => (
            <article className="supplier-row" key={supplier.supplier}>
              <div>
                <strong>{supplier.supplier}</strong>
                <span>
                  {supplier.resources} resources · {supplier.currentCapacity} capacity
                </span>
              </div>
              <div className="supplier-metrics">
                <span>{supplier.openRisks} risks</span>
                <span>{supplier.blockedIssues} blocked</span>
                <span>{supplier.averageResolutionTimeDays}d resolution</span>
              </div>
              <strong className={`score-pill status-${supplier.status}`}>{supplier.score}%</strong>
            </article>
          ))}
      </div>
    </section>
  );
});
