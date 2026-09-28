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
  title: "ComputeCanvas — Build the architecture. See the economics.",
  description: "Interactive AI architecture and economics simulator. Design and simulate AI systems before committing engineering resources. See how architecture choices affect cost, latency, capacity, and quality.",
  openGraph: {
    title: "ComputeCanvas — Build the architecture. See the economics.",
    description: "Interactive AI architecture and economics simulator. Design and simulate AI systems before committing engineering resources.",
    type: "website",
    siteName: "ComputeCanvas",
  },
  twitter: {
    card: "summary_large_image",
    title: "ComputeCanvas — Build the architecture. See the economics.",
    description: "Interactive AI architecture and economics simulator.",
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
