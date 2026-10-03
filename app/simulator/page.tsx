import { Metadata } from 'next';
import { Suspense } from 'react';
import SimulatorClient, { SimulatorFallbackShell } from './SimulatorClient';
import SimulatorErrorBoundary from '@/components/simulator/SimulatorErrorBoundary';
import { TEMPLATES } from '@/lib/simulation/engine';
import { decodeArchitectureState } from '@/lib/simulation/sharing';

export const metadata: Metadata = {
  title: 'Workbench — ComputeCanvas',
  description: 'Deterministic AI architecture and economics engineering workbench. Model cost, latency percentiles, and bottleneck topology in real-time.',
};

interface PageProps {
  searchParams: Promise<{
    template?: string;
    data?: string;
  }>;
}

export default async function SimulatorPage({ searchParams }: PageProps) {
  const params = await searchParams;
  let initialTemplateId: string | undefined;
  let initialArchitecture = undefined;
  let initialWorkload = undefined;
  let initialCalibration = undefined;

  if (params?.data && typeof params.data === 'string') {
    const decoded = decodeArchitectureState(params.data);
    if (decoded.success && decoded.data) {
      initialArchitecture = decoded.data.architecture;
      initialWorkload = decoded.data.workload;
      initialCalibration = decoded.data.calibration;
    }
  } else if (params?.template && typeof params.template === 'string') {
    const query = params.template.toLowerCase();
    const template = TEMPLATES.find(t => t.id === query || t.id.includes(query) || query.includes(t.id));
    if (template) {
      initialTemplateId = template.id;
      initialArchitecture = template.architecture;
      initialWorkload = template.defaultWorkload;
    }
  }

  return (
    <SimulatorErrorBoundary>
      <Suspense fallback={<SimulatorFallbackShell />}>
        <SimulatorClient
          initialTemplateId={initialTemplateId}
          initialArchitecture={initialArchitecture}
          initialWorkload={initialWorkload}
          initialCalibration={initialCalibration}
        />
      </Suspense>
    </SimulatorErrorBoundary>
  );
}
