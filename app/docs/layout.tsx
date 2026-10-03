import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Docs — ComputeCanvas',
  description: 'Methodology and documentation for ComputeCanvas, an architecture planning and comparative decision instrument for AI systems.',
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
