/** @type {import('next').NextConfig} */
// next.config.js
const nextConfig = {
  async rewrites() {
    const rewrites = [
      {
        source: "/relay/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/relay/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];

    // In local development, proxy /api requests to the FastAPI backend
    if (process.env.NODE_ENV !== "production") {
      rewrites.unshift({
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      });
    }

    return rewrites;
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

module.exports = nextConfig;
