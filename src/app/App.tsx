import { view } from '@forge/bridge';
import { useEffect, useState } from 'react';
import { ConfigurationPage } from '../features/executive-dashboard/ConfigurationPage';
import { ExecutiveDashboard } from '../features/executive-dashboard/ExecutiveDashboard';
import { LoadingState } from '../frontend/components/WorkspaceStates';

export function App() {
  const [moduleKey, setModuleKey] = useState<string>();
  useEffect(() => {
    void view.getContext().then((context) => setModuleKey(context.moduleKey));
  }, []);
  if (!moduleKey) return <LoadingState label="Opening FlowOS…" />;
  return moduleKey === 'flowos-configuration' ? <ConfigurationPage /> : <ExecutiveDashboard />;
}
