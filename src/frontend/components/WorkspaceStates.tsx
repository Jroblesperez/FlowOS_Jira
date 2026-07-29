import { memo } from 'react';

export const LoadingState = memo(function LoadingState({
  label = 'Preparing your executive view…',
}: {
  label?: string;
}) {
  return (
    <main className="workspace-state" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <h1>{label}</h1>
      <p>FlowOS is loading the latest available intelligence.</p>
    </main>
  );
});

export const ErrorState = memo(function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main className="workspace-state" role="alert">
      <span className="state-icon">!</span>
      <h1>We could not load this view</h1>
      <p>{message}</p>
      <button className="button button-primary" onClick={onRetry}>
        Try again
      </button>
    </main>
  );
});

export const EmptyState = memo(function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </section>
  );
});
