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
        confidence: 88,
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
        confidence: 95,
        recommendedAction: 'Assign an accountable owner and due date to every blocker.',
      });
    if (delivery.flowEfficiency < 70)
      add({
        id: 'reduce-wip',
        title: 'Reduce Work In Progress',
        priority: 'medium',
        category: 'flow',
        businessImpact: 'Improves focus and shortens delivery time.',
        estimatedBenefit: 'Improve flow efficiency during the next refresh.',
        confidence: 78,
        recommendedAction: 'Pause lower-value work until active commitments complete.',
      });
    for (const supplier of suppliers.filter((item) => item.score < 70).slice(0, 3))
      add({
        id: `supplier-${supplier.supplier}`,
        title: `Review Supplier ${supplier.supplier}`,
        priority: supplier.score < 55 ? 'high' : 'medium',
        category: 'supplier',
        businessImpact: 'Reduces supplier delivery exposure.',
        estimatedBenefit: 'Improve supplier health by resolving risks and blocked work.',
        confidence: 84,
        recommendedAction:
          'Review capacity, blockers, and recovery commitments with the supplier owner.',
      });
    if (!actions.length)
      add({
        id: 'maintain-execution',
        title: 'Maintain Execution Focus',
        priority: 'low',
        category: 'delivery',
        businessImpact: 'Preserves stable execution health.',
        estimatedBenefit: 'Sustain delivery and supplier performance.',
        confidence: 90,
        recommendedAction: 'Continue the current operating cadence and monitor leading indicators.',
      });
    return actions;
  }
}
