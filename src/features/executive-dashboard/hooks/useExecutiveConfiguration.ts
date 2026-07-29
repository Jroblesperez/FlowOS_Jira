import { invoke } from '@forge/bridge';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ConfigurationService } from '../../../core/application/configuration-service';
import { defaultExecutiveConfiguration } from '../../../core/application/default-configuration';
import type { ExecutiveConfiguration } from '../../../core/domain/executive';

const service = new ConfigurationService();

export function useExecutiveConfiguration() {
  const [configuration, setConfiguration] = useState<ExecutiveConfiguration>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<Error>();
  const validation = useMemo(
    () => (configuration ? service.validate(configuration) : { valid: false, errors: {} }),
    [configuration],
  );
  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setConfiguration(
        service.normalize(await invoke<ExecutiveConfiguration>('executive.configuration.get')),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Configuration could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const save = useCallback(async () => {
    if (!configuration || !service.validate(configuration).valid) return;
    setSaving(true);
    setSaved(false);
    setError(undefined);
    try {
      setConfiguration(
        await invoke<ExecutiveConfiguration>('executive.configuration.save', configuration),
      );
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('Configuration could not be saved.'));
    } finally {
      setSaving(false);
    }
  }, [configuration]);
  const reset = useCallback(() => {
    setConfiguration(service.normalize(defaultExecutiveConfiguration));
    setSaved(false);
  }, []);
  return {
    configuration,
    setConfiguration,
    loading,
    saving,
    saved,
    error,
    validation,
    save,
    reset,
    retry: load,
  };
}
