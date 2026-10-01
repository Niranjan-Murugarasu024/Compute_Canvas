import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ComputeCanvas — AI Architecture & Economics Workbench",
  description: "Interactive AI architecture and economics workbench. Model topology, simulate deterministic monthly spend, cost per request, modeled tail latency, cache amortizations, and routing tradeoffs before writing deployment code.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "ComputeCanvas — AI Architecture & Economics Workbench",
    description: "Interactive AI architecture and economics workbench. Model topology, simulate deterministic monthly spend, cost per request, modeled tail latency, cache amortizations, and routing tradeoffs before writing deployment code.",
    type: "website",
    siteName: "ComputeCanvas",
  },
  twitter: {
    card: "summary_large_image",
    title: "ComputeCanvas — AI Architecture & Economics Workbench",
    description: "Interactive AI architecture and economics workbench. Model topology, simulate deterministic monthly spend, cost per request, modeled tail latency, cache amortizations, and routing tradeoffs before writing deployment code.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} ${spaceGrotesk.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
