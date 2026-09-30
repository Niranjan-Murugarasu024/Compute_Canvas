import { Metadata } from 'next';
import Navigation from '@/components/navigation/Navigation';
import { Footer } from '@/components/sections/LandingSections';
import TemplatesClient from './TemplatesClient';

export const metadata: Metadata = {
  title: 'Templates — ComputeCanvas',
  description: 'Explore production-grade AI architecture templates. Simulate Direct LLM, RAG Pipeline, and Router + Cache architectures with deterministic cost and latency modeling.',
};

export default function TemplatesPage() {
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
