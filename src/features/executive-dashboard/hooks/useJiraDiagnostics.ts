import { invoke } from '@forge/bridge';
import { useCallback, useEffect, useState } from 'react';
import type { SnapshotMetadata } from '../../../core/domain/executive';

export function useJiraDiagnostics() {
  const [metadata, setMetadata] = useState<SnapshotMetadata>();
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string>();
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMetadata(await invoke<SnapshotMetadata | undefined>('executive.diagnostics.get'));
      setError(undefined);
    } catch {
      setError('Diagnostics could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const retry = useCallback(async () => {
    setRetrying(true);
    try {
      const snapshot = await invoke<{ metadata?: SnapshotMetadata }>('executive.diagnostics.retry');
      setMetadata(snapshot.metadata);
      setError(undefined);
    } catch {
      setError('The pilot diagnostics retry failed.');
    } finally {
      setRetrying(false);
    }
  }, []);
  return { metadata, loading, retrying, error, retry };
}
