import { Metadata } from 'next';
import AssumptionsClient from './AssumptionsClient';

export const metadata: Metadata = {
  title: 'Models — ComputeCanvas',
  description: 'Model Assumption Registry. Transparent pricing data, latency models, and mathematical assumptions used by ComputeCanvas.',
};

export default function AssumptionsPage() {
  return <AssumptionsClient />;
}
