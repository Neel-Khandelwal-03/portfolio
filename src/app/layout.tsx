import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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

/**
 * Monospace carries the technical metadata — section numbers, dates,
 * technologies, panel labels. A real mono face rather than the system stack,
 * because the system default differs wildly across platforms and this text is
 * a deliberate part of the visual identity.
 *
 * A single weight is requested: uppercase mono at 400 with wide tracking reads
 * as a label already, and the second weight would double the download.
 */
const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  variable: "--font-mono-face",
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
    { media: "(prefers-color-scheme: dark)", color: "#080a0f" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="bg-bg text-fg min-h-dvh antialiased">{children}</body>
    </html>
  );
}
