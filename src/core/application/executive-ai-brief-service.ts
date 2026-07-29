import type {
  DeliveryHealth,
  ExecutiveRecommendation,
  OrganizationHealth,
  SupplierHealth,
} from '../domain/executive';

export class ExecutiveAiBriefService {
  summarize(
    organization: OrganizationHealth,
    delivery: DeliveryHealth,
    suppliers: SupplierHealth[],
    recommendations: ExecutiveRecommendation[],
  ): string[] {
    const supplier = suppliers.slice().sort((a, b) => a.score - b.score)[0];
    const bullets = [
      `Organization Health is ${organization.score}% and ${organization.label.toLowerCase()}.`,
      `Delivery is ${delivery.status.replace('_', ' ')} with ${delivery.blockedIssues} blocked work items.`,
      `${delivery.teamAtRisk} needs attention today.`,
      supplier
        ? `Supplier ${supplier.supplier} has a ${supplier.score}% score and ${supplier.blockedIssues} blocked work items.`
        : 'No supplier risk is currently visible.',
      ...recommendations.slice(0, 6).map((item) => `${item.title}: ${item.businessImpact}`),
    ];
    return bullets.slice(0, 10);
  }
}
