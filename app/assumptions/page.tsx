import { Metadata } from 'next';
import AssumptionsClient from './AssumptionsClient';

export const metadata: Metadata = {
  title: 'Simulation Assumptions & Pricing — ComputeCanvas',
  description: 'Transparent pricing data, latency models, and mathematical assumptions used by ComputeCanvas.',
};

export default function AssumptionsPage() {
  return <AssumptionsClient />;
}
