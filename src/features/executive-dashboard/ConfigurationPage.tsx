import type { ReactNode } from 'react';
import type { ExecutiveConfiguration } from '../../core/domain/executive';
import { ErrorState, LoadingState } from '../../frontend/components/WorkspaceStates';
import { useExecutiveConfiguration } from './hooks/useExecutiveConfiguration';
import { useJiraDiagnostics } from './hooks/useJiraDiagnostics';
import './executive-workspace.css';

type InputEvent = { currentTarget: { value: string } };

export function ConfigurationPage() {
  const diagnostics = useJiraDiagnostics();
  const {
    configuration,
    setConfiguration,
    loading,
    saving,
    saved,
    error,
    validation,
    save,
    reset,
    retry,
  } = useExecutiveConfiguration();
  if (loading) return <LoadingState label="Loading FlowOS configuration…" />;
  if (error && !configuration) return <ErrorState message={error.message} onRetry={retry} />;
  if (!configuration) return <ErrorState message="Configuration is unavailable." onRetry={retry} />;
  const update = <K extends keyof ExecutiveConfiguration>(
    key: K,
    value: ExecutiveConfiguration[K],
  ) => setConfiguration({ ...configuration, [key]: value });
  const updateWeight = (key: keyof ExecutiveConfiguration['healthScoreWeights'], value: number) =>
    update('healthScoreWeights', { ...configuration.healthScoreWeights, [key]: value });
  const updateThreshold = (key: keyof ExecutiveConfiguration['healthThresholds'], value: number) =>
    update('healthThresholds', { ...configuration.healthThresholds, [key]: value });
  return (
    <main className="executive-workspace configuration-page">
      <header className="workspace-header">
        <div>
          <p className="organization-name">Administration</p>
          <h1>FlowOS Configuration</h1>
          <p className="workspace-subtitle">
            Control how executive health is calculated and refreshed.
          </p>
        </div>
      </header>
      {error ? (
        <div className="partial-banner" role="alert">
          {error.message}
        </div>
      ) : null}
      <form
        onSubmit={(event: { preventDefault(): void }) => {
          event.preventDefault();
          void save();
        }}
      >
        <ConfigurationSection title="Jira Connection & Diagnostics">
          <p className="field-help">
            Pilot scope: {configuration.pilotProjectKey} · Board {configuration.pilotBoardId}
          </p>
          {diagnostics.error ? <p className="field-error">{diagnostics.error}</p> : null}
          {diagnostics.loading ? (
            <p className="field-help">Loading the latest pilot diagnostics…</p>
          ) : diagnostics.metadata ? (
            <>
              <div className="score-preview">
                <p className="eyebrow">Latest snapshot</p>
                <strong>{diagnostics.metadata.status}</strong>
                <span>
                  {diagnostics.metadata.issueCount ?? 0} issues ·{' '}
                  {diagnostics.metadata.boardCount ?? 0} board
                </span>
              </div>
              <div className="diagnostics-list">
                {(diagnostics.metadata.diagnostics ?? []).map((item) => (
                  <article key={`${item.operation}-${item.timestamp}`} className="diagnostic-row">
                    <div>
                      <strong>{item.operation}</strong>
                      <code>
                        {item.method} {item.endpoint}
                      </code>
                    </div>
                    <div>
                      <span>
                        {item.httpStatus ?? 'No status'} · {item.result}
                      </span>
                      <span>
                        {item.itemCount ?? 0} items · {item.durationMs} ms
                      </span>
                      <small>
                        {item.safeMessage ??
                          `Last success ${item.lastSuccessfulAt ?? item.timestamp}`}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p className="field-help">No snapshot diagnostics are available yet.</p>
          )}
          <button
            type="button"
            className="button button-subtle"
            disabled={diagnostics.retrying}
            onClick={() => void diagnostics.retry()}
          >
            {diagnostics.retrying ? 'Retrying…' : 'Retry pilot diagnostics'}
          </button>
        </ConfigurationSection>
        <ConfigurationSection title="Organization">
          <Field label="Organization name" error={validation.errors.organizationName}>
            <input
              value={configuration.organizationName}
              onChange={(event: InputEvent) =>
                update('organizationName', event.currentTarget.value)
              }
            />
          </Field>
          <div className="form-grid">
            <Field
              label="Refresh frequency (minutes)"
              error={validation.errors.refreshFrequencyMinutes}
            >
              <input
                type="number"
                min="5"
                max="1440"
                value={configuration.refreshFrequencyMinutes}
                onChange={(event: InputEvent) =>
                  update('refreshFrequencyMinutes', Number(event.currentTarget.value))
                }
              />
            </Field>
            <Field label="Time zone">
              <input
                value={configuration.businessHours.timeZone}
                onChange={(event: InputEvent) =>
                  update('businessHours', {
                    ...configuration.businessHours,
                    timeZone: event.currentTarget.value,
                  })
                }
              />
            </Field>
            <Field label="Business day starts">
              <input
                type="time"
                value={configuration.businessHours.start}
                onChange={(event: InputEvent) =>
                  update('businessHours', {
                    ...configuration.businessHours,
                    start: event.currentTarget.value,
                  })
                }
              />
            </Field>
            <Field label="Business day ends" error={validation.errors.businessHours}>
              <input
                type="time"
                value={configuration.businessHours.end}
                onChange={(event: InputEvent) =>
                  update('businessHours', {
                    ...configuration.businessHours,
                    end: event.currentTarget.value,
                  })
                }
              />
            </Field>
          </div>
          <Field label="Working days" error={validation.errors.workingDays}>
            <div className="day-picker">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <label key={day}>
                  <input
                    type="checkbox"
                    checked={configuration.workingDays.includes(index)}
                    onChange={() =>
                      update(
                        'workingDays',
                        configuration.workingDays.includes(index)
                          ? configuration.workingDays.filter((value) => value !== index)
                          : [...configuration.workingDays, index].sort(),
                      )
                    }
                  />
                  {day}
                </label>
              ))}
            </div>
          </Field>
        </ConfigurationSection>
        <ConfigurationSection title="Health model">
          <div className="form-grid">
            <Field label="Delivery weight">
              <input
                type="number"
                min="0"
                max="100"
                value={configuration.healthScoreWeights.delivery}
                onChange={(event: InputEvent) =>
                  updateWeight('delivery', Number(event.currentTarget.value))
                }
              />
            </Field>
            <Field label="Supplier weight">
              <input
                type="number"
                min="0"
                max="100"
                value={configuration.healthScoreWeights.supplier}
                onChange={(event: InputEvent) =>
                  updateWeight('supplier', Number(event.currentTarget.value))
                }
              />
            </Field>
            <Field label="Risk weight" error={validation.errors.healthScoreWeights}>
              <input
                type="number"
                min="0"
                max="100"
                value={configuration.healthScoreWeights.risk}
                onChange={(event: InputEvent) =>
                  updateWeight('risk', Number(event.currentTarget.value))
                }
              />
            </Field>
            <Field label="Healthy threshold">
              <input
                type="number"
                min="0"
                max="100"
                value={configuration.healthThresholds.healthy}
                onChange={(event: InputEvent) =>
                  updateThreshold('healthy', Number(event.currentTarget.value))
                }
              />
            </Field>
            <Field label="Warning threshold">
              <input
                type="number"
                min="0"
                max="100"
                value={configuration.healthThresholds.warning}
                onChange={(event: InputEvent) =>
                  updateThreshold('warning', Number(event.currentTarget.value))
                }
              />
            </Field>
            <Field label="Critical threshold" error={validation.errors.healthThresholds}>
              <input
                type="number"
                min="0"
                max="100"
                value={configuration.healthThresholds.critical}
                onChange={(event: InputEvent) =>
                  updateThreshold('critical', Number(event.currentTarget.value))
                }
              />
            </Field>
          </div>
          <div className="score-preview">
            <p className="eyebrow">Model preview</p>
            <strong>
              {configuration.healthScoreWeights.delivery +
                configuration.healthScoreWeights.supplier +
                configuration.healthScoreWeights.risk}
              %
            </strong>
            <span>
              Weight allocation{' '}
              {validation.errors.healthScoreWeights ? 'needs attention' : 'is valid'}
            </span>
          </div>
        </ConfigurationSection>
        <ConfigurationSection title="Suppliers">
          <p className="field-help">
            Map each Jira account to one supplier. Duplicate mappings are rejected.
          </p>
          {configuration.suppliers.map((supplier, index) => (
            <div className="supplier-config" key={supplier.name}>
              <strong>{supplier.name}</strong>
              <Field label="Jira account IDs">
                <input
                  value={supplier.accountIds.join(', ')}
                  onChange={(event: InputEvent) => {
                    const suppliers = [...configuration.suppliers];
                    suppliers[index] = {
                      ...supplier,
                      accountIds: event.currentTarget.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean),
                    };
                    update('suppliers', suppliers);
                  }}
                />
              </Field>
              <Field label="Capacity">
                <input
                  type="number"
                  min="0"
                  value={supplier.capacity}
                  onChange={(event: InputEvent) => {
                    const suppliers = [...configuration.suppliers];
                    suppliers[index] = { ...supplier, capacity: Number(event.currentTarget.value) };
                    update('suppliers', suppliers);
                  }}
                />
              </Field>
            </div>
          ))}
          {validation.errors.suppliers ? (
            <p className="field-error">{validation.errors.suppliers}</p>
          ) : null}
        </ConfigurationSection>
        <div className="form-actions">
          <button type="button" className="button button-subtle" onClick={reset}>
            Reset defaults
          </button>
          <button
            type="submit"
            className="button button-primary"
            disabled={!validation.valid || saving}
          >
            {saving ? 'Saving…' : 'Save configuration'}
          </button>
          {saved ? (
            <span className="save-confirmation" role="status">
              Configuration saved.
            </span>
          ) : null}
        </div>
      </form>
    </main>
  );
}

function ConfigurationSection({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="configuration-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children?: ReactNode;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
      {error ? <small className="field-error">{error}</small> : null}
    </label>
  );
}
