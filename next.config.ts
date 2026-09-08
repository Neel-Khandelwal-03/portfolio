import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * The CSP is deliberately strict: no third-party script origins, no framing,
 * and images restricted to this origin plus the blob store. `unsafe-inline` is
 * required for scripts because Next.js inlines its bootstrap and the
 * theme-before-paint snippet; `strict-dynamic` is not usable without nonces,
 * which would force every page to be dynamically rendered.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'" +
    (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
  "font-src 'self' data:",
  "connect-src 'self'" + (process.env.NODE_ENV === "development" ? " ws: wss:" : ""),
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Fail the production build on a type error rather than shipping it.
  // Next 16 no longer runs ESLint during `build`; `npm run lint` covers that.
  typescript: { ignoreBuildErrors: false },

  // Do not advertise the framework version to scanners.
  poweredByHeader: false,

  images: {
    // AVIF first, WebP as the fallback — both far smaller than the JPEG/PNG
    // originals, and Next negotiates per request.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
    // Uploads are validated by magic bytes before storage; SVG is rejected
    // there, so it can never be served from these origins.
    dangerouslyAllowSVG: false,
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        // The admin must never be cached by a CDN or a shared proxy.
        source: "/admin/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
      {
        source: "/api/admin/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }],
      },
    ];
  },
};

export default nextConfig;
