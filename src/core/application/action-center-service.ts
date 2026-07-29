import type { DeliveryHealth, ExecutiveRecommendation, SupplierHealth } from '../domain/executive';

export class ActionCenterService {
  recommend(delivery: DeliveryHealth, suppliers: SupplierHealth[]): ExecutiveRecommendation[] {
    const actions: ExecutiveRecommendation[] = [];
    const add = (action: Omit<ExecutiveRecommendation, 'futureStatus'>) =>
      actions.push({ ...action, futureStatus: 'open' });
    if (delivery.teamAtRisk !== 'No team at risk')
      add({
        id: 'review-team-at-risk',
        title: `Review ${delivery.teamAtRisk}`,
        priority: 'high',
        category: 'delivery',
        businessImpact: 'Protects the nearest delivery commitment.',
        estimatedBenefit: 'Lower missed-commitment risk in the current cycle.',
        recommendedAction: 'Open a recovery review with the delivery owner today.',
      });
    if (delivery.blockedIssues > 0)
      add({
        id: 'close-blockers',
        title: 'Close Blockers',
        priority: 'high',
        category: 'flow',
        businessImpact: 'Restores execution flow for blocked work.',
        estimatedBenefit: `Release up to ${delivery.blockedIssues} blocked work items.`,
        recommendedAction: 'Assign an accountable owner and due date to every blocker.',
      });
    for (const supplier of suppliers.filter((item) => item.score < 70).slice(0, 3))
      add({
        id: `supplier-${supplier.supplier}`,
        title: `Review Supplier ${supplier.supplier}`,
        priority: supplier.score < 55 ? 'high' : 'medium',
        category: 'supplier',
        businessImpact: 'Reduces supplier delivery exposure.',
        estimatedBenefit: 'Improve supplier health by resolving risks and blocked work.',
        recommendedAction:
          'Review capacity, blockers, and recovery commitments with the supplier owner.',
      });
    return actions;
  }
}
