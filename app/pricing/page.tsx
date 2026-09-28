import { Metadata } from 'next';
import PricingClient from './PricingClient';

export const metadata: Metadata = {
  title: 'Pricing — ComputeCanvas V1',
  description: 'ComputeCanvas is currently free while we validate the architecture simulation engine with AI engineers and architects.',
};

export default function PricingPage() {
  return <PricingClient />;
}
