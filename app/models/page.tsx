import { Metadata } from 'next';
import AssumptionsClient from '../assumptions/AssumptionsClient';

export const metadata: Metadata = {
  title: 'Models — ComputeCanvas',
  description: 'Model Assumption Registry. Verifiable pricing data, latency models, and mathematical assumptions used by ComputeCanvas.',
};

export default function ModelsPage() {
  return <AssumptionsClient />;
}
