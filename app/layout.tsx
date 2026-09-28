import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ComputeCanvas — Design AI Architecture. See the Cost Before You Build It.",
  description: "Interactive AI architecture simulator for modeling estimated cost, latency, bottlenecks, and architecture trade-offs.",
  openGraph: {
    title: "ComputeCanvas — Design AI Architecture. See the Cost Before You Build It.",
    description: "Interactive AI architecture simulator for modeling estimated cost, latency, bottlenecks, and architecture trade-offs.",
    type: "website",
    siteName: "ComputeCanvas",
  },
  twitter: {
    card: "summary_large_image",
    title: "ComputeCanvas — Design AI Architecture. See the Cost Before You Build It.",
    description: "Interactive AI architecture simulator for modeling estimated cost, latency, bottlenecks, and architecture trade-offs.",
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
