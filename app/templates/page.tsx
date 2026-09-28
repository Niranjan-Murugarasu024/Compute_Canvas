import { Metadata } from 'next';
import Navigation from '@/components/navigation/Navigation';
import { Footer } from '@/components/sections/LandingSections';
import TemplatesClient from './TemplatesClient';

export const metadata: Metadata = {
  title: 'Templates — ComputeCanvas',
  description: 'Start from proven AI architecture templates. RAG, AI Agents, Customer Support, Code Assistants, and more.',
};

export default function TemplatesPage() {
  return (
    <>
      <Navigation />
      <main style={{ paddingTop: 100 }}>
        <TemplatesClient />
      </main>
      <Footer />
    </>
  );
}
