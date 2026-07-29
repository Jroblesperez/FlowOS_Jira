import type { Meta, StoryObj } from '@storybook/react';
import { MetricCard } from './MetricCard';
const meta = { component: MetricCard, title: 'ACC/MetricCard' } satisfies Meta<typeof MetricCard>;
export default meta;
export const Healthy: StoryObj<typeof MetricCard> = {
  args: {
    metric: {
      id: 'delivery-health',
      label: 'Delivery Health',
      value: 92,
      unit: '%',
      status: 'healthy',
      trend: 'up',
    },
  },
};
