import { Metadata } from 'next';
import Navigation from '@/components/navigation/Navigation';
import { Footer } from '@/components/sections/LandingSections';
import TemplatesClient from '../templates/TemplatesClient';

export const metadata: Metadata = {
  title: 'Blueprints — ComputeCanvas',
  description: 'Canonical AI architecture blueprints. Simulate Direct LLM, RAG Pipeline, and Router + Cache architectures with deterministic cost and latency modeling.',
};

export default function BlueprintsPage() {
  return (
    <>
      <Navigation />
      <main>
        <TemplatesClient />
      </main>
      <Footer />
    </>
  );
}
