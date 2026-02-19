import type { Metadata } from "next";
import { Raleway, Libre_Baskerville, Nunito } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";

const raleway = Raleway({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-raleway",
});

const libreBaskerville = Libre_Baskerville({
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-libre-baskerville",
});

const nunito = Nunito({
  weight: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://feedbackhub.app'),
  title: {
    default: "FeedbackHub - Collect & Prioritize Customer Feedback",
    template: "%s | FeedbackHub",
  },
  description: "Collect customer feedback, prioritize feature requests, and share your product roadmap. The feedback tool that grows with you.",
  openGraph: {
    title: "FeedbackHub - Collect & Prioritize Customer Feedback",
    description: "Collect customer feedback, prioritize feature requests, and share your product roadmap.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FeedbackHub - Collect & Prioritize Customer Feedback",
    description: "Collect customer feedback, prioritize feature requests, and share your product roadmap.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${raleway.variable} ${libreBaskerville.variable} ${nunito.variable} antialiased`}>
        {children}
        <Toaster />
        <SpeedInsights />
      </body>
    </html>
  );
}
