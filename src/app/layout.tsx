import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { ThemeScript } from "@/components/theme-script";
import { siteUrl } from "@/lib/env";
import { getSiteSettings } from "@/services/portfolio";

import "./globals.css";

/**
 * One variable font, self-hosted by Next at build time and preloaded — no
 * render-blocking request to a third-party font CDN.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const url = siteUrl();
  const title = settings.siteTitle || "Neel Khandelwal";
  const description =
    settings.siteDescription ||
    "Portfolio of Neel Khandelwal — software engineer working across full-stack " +
      "development, backend systems and applied data science.";

  return {
    metadataBase: new URL(url),
    title: { default: title, template: `%s — ${title.split("—")[0].trim()}` },
    description,
    keywords: settings.seoKeywords.length > 0 ? settings.seoKeywords : undefined,
    authors: [{ name: "Neel Khandelwal" }],
    creator: "Neel Khandelwal",
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: title,
      title,
      description,
      url,
      images: settings.ogImageUrl ? [{ url: settings.ogImageUrl }] : ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: settings.ogImageUrl ? [settings.ogImageUrl] : ["/opengraph-image"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0e14" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh bg-bg text-fg antialiased">{children}</body>
    </html>
  );
}
