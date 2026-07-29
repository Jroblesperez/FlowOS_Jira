import { invoke } from '@forge/bridge';
import { useCallback, useEffect, useState } from 'react';
import type { ExecutiveSnapshot } from '../../../core/domain/executive';

let cachedSnapshot: ExecutiveSnapshot | undefined;

export function useExecutiveSnapshot() {
  const [snapshot, setSnapshot] = useState<ExecutiveSnapshot | undefined>(cachedSnapshot);
  const [loading, setLoading] = useState(!cachedSnapshot);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const load = useCallback(async (forceRefresh = false) => {
    forceRefresh ? setRefreshing(true) : setLoading(true);
    setError(undefined);
    try {
      const result = await invoke<ExecutiveSnapshot>('executive.snapshot', { forceRefresh });
      cachedSnapshot = result;
      setSnapshot(result);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause : new Error('The Executive Workspace could not be loaded.'),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!cachedSnapshot) void load();
  }, [load]);
  useEffect(() => {
    if (!snapshot) return undefined;
    const refreshAt = new Date(snapshot.expiresAt).getTime();
    const delay = Math.max(1_000, refreshAt - Date.now());
    const timer = window.setTimeout(() => {
      void load(true);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [load, snapshot?.expiresAt]);
  return {
    snapshot,
    loading,
    refreshing,
    error,
    refresh: () => load(true),
    retry: () => load(false),
  };
}
