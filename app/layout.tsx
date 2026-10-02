import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2",
  variable: "--font-geist-sans",
  display: "swap",
  weight: "100 900",
});

const geistMono = localFont({
  src: "../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ComputeCanvas — AI Architecture & Economics Workbench",
  description: "Interactive AI architecture and economics workbench. Model topology, simulate modeled monthly cost, cost per request, modeled tail latency, cache amortizations, and routing tradeoffs before writing deployment code.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "ComputeCanvas — AI Architecture & Economics Workbench",
    description: "Interactive AI architecture and economics workbench. Model topology, simulate modeled monthly cost, cost per request, modeled tail latency, cache amortizations, and routing tradeoffs before writing deployment code.",
    type: "website",
    siteName: "ComputeCanvas",
  },
  twitter: {
    card: "summary_large_image",
    title: "ComputeCanvas — AI Architecture & Economics Workbench",
    description: "Interactive AI architecture and economics workbench. Model topology, simulate modeled monthly cost, cost per request, modeled tail latency, cache amortizations, and routing tradeoffs before writing deployment code.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
