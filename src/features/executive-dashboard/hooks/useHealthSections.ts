import { useMemo } from 'react';
import type { ExecutiveSnapshot } from '../../../core/domain/executive';

export function useOrganizationHealth(snapshot?: ExecutiveSnapshot) {
  return useMemo(() => snapshot?.organizationHealth, [snapshot?.organizationHealth]);
}

export function useDeliveryHealth(snapshot?: ExecutiveSnapshot) {
  return useMemo(() => snapshot?.deliveryHealth, [snapshot?.deliveryHealth]);
}

export function useSupplierHealth(snapshot?: ExecutiveSnapshot) {
  return useMemo(
    () => ({
      suppliers: snapshot?.supplierHealth ?? [],
      attention: snapshot?.supplierHealth
        ?.slice()
        .sort((left, right) => left.score - right.score)[0],
    }),
    [snapshot?.supplierHealth],
  );
}
