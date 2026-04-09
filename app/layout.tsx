import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://kelohq.com'),
  title: {
    default: "Kelo - Collect & Prioritize Customer Feedback",
    template: "%s | Kelo",
  },
  description: "Collect customer feedback, prioritize feature requests, and share your product roadmap. The feedback tool that grows with you.",
  openGraph: {
    title: "Kelo - Transparent Feedback for SaaS",
    description: "Ship what users want, not what hype says.",
    url: "https://www.kelohq.com/",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1344,
        height: 768,
        alt: "Kelo - A transparent feedback tool for SaaS products",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kelo - Transparent Feedback for SaaS",
    description: "Ship what users want, not what hype says.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Manrope:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          {children}
          <ThemeToggle />
          <Toaster />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
