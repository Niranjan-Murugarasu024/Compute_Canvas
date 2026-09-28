import Navigation from '@/components/navigation/Navigation';
import HeroInteractive from '@/components/hero/HeroInteractive';
import {
  EveryRequestSection,
  CostDecompositionSection,
  ScaleSection,
  WhatWouldYouBuildSection,
  StoryFlowSection,
  TemplatesPreviewSection,
  Footer,
} from '@/components/sections/LandingSections';

export default function Home() {
  return (
    <>
      <Navigation />
      <main>
        <HeroInteractive />
        <EveryRequestSection />
        <CostDecompositionSection />
        <ScaleSection />
        <WhatWouldYouBuildSection />
        <StoryFlowSection />
        <TemplatesPreviewSection />
      </main>
      <Footer />
    </>
  );
}
