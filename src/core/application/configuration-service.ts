import type { ExecutiveConfiguration } from '../domain/executive';
import { defaultExecutiveConfiguration } from './default-configuration';

export interface ConfigurationValidation {
  valid: boolean;
  errors: Record<string, string>;
}

export class ConfigurationService {
  normalize(value: Partial<ExecutiveConfiguration> | undefined): ExecutiveConfiguration {
    return {
      ...defaultExecutiveConfiguration,
      ...value,
      healthScoreWeights: {
        ...defaultExecutiveConfiguration.healthScoreWeights,
        ...value?.healthScoreWeights,
      },
      healthThresholds: {
        ...defaultExecutiveConfiguration.healthThresholds,
        ...value?.healthThresholds,
      },
      businessHours: { ...defaultExecutiveConfiguration.businessHours, ...value?.businessHours },
      featureFlags: { ...defaultExecutiveConfiguration.featureFlags, ...value?.featureFlags },
      suppliers: value?.suppliers ?? defaultExecutiveConfiguration.suppliers,
    };
  }

  validate(config: ExecutiveConfiguration): ConfigurationValidation {
    const errors: Record<string, string> = {};
    const weightTotal = Object.values(config.healthScoreWeights).reduce(
      (sum, value) => sum + value,
      0,
    );
    if (!config.organizationName.trim()) errors.organizationName = 'Organization name is required.';
    if (weightTotal !== 100) errors.healthScoreWeights = 'Health weights must total 100.';
    if (config.refreshFrequencyMinutes < 5 || config.refreshFrequencyMinutes > 1440)
      errors.refreshFrequencyMinutes = 'Refresh frequency must be between 5 and 1440 minutes.';
    if (
      !(
        config.healthThresholds.healthy > config.healthThresholds.warning &&
        config.healthThresholds.warning > config.healthThresholds.critical
      )
    )
      errors.healthThresholds = 'Thresholds must descend from healthy to warning to critical.';
    if (!config.workingDays.length) errors.workingDays = 'Select at least one working day.';
    if (config.businessHours.start >= config.businessHours.end)
      errors.businessHours = 'Business hours must end after they start.';
    const accountIds = config.suppliers.flatMap((supplier) => supplier.accountIds);
    if (new Set(accountIds).size !== accountIds.length)
      errors.suppliers = 'A Jira account can belong to only one supplier.';
    return { valid: Object.keys(errors).length === 0, errors };
  }
}
