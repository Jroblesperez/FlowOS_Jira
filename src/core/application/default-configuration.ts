import type { ExecutiveConfiguration } from '../domain/executive';

export const defaultExecutiveConfiguration: ExecutiveConfiguration = {
  organizationName: 'FlowOS Organization',
  suppliers: ['Internal', 'SOFKA', 'NTT DATA', 'NEORIS', 'DEVSU', 'Others'].map((name) => ({
    name: name as ExecutiveConfiguration['suppliers'][number]['name'],
    accountIds: [],
    capacity: 0,
  })),
  healthScoreWeights: { delivery: 50, supplier: 30, risk: 20 },
  healthThresholds: { healthy: 85, warning: 70, critical: 55 },
  workingDays: [1, 2, 3, 4, 5],
  businessHours: { start: '09:00', end: '17:00', timeZone: 'America/Guayaquil' },
  aiProvider: 'mock',
  refreshFrequencyMinutes: 30,
  pilotProjectKey: 'CPD',
  pilotBoardId: 140,
  featureFlags: { executiveWorkspace: true, configurationPage: true },
};
