import { Metadata } from 'next';
import Navigation from '@/components/navigation/Navigation';
import { Footer } from '@/components/sections/LandingSections';
import ExploreClient from './ExploreClient';

export const metadata: Metadata = {
  title: 'Explore — ComputeCanvas',
  description: 'Explore interactive AI architecture stories. See how different architectures affect cost, latency, and quality.',
};

export default function ExplorePage() {
  return (
    <>
      <Navigation />
      <main>
        <ExploreClient />
      </main>
      <Footer />
    </>
  );
}
