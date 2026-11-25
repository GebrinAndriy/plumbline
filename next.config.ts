import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  experimental: {
    // Logos are up to 1 MB; the default 1 MB limit counts the multipart overhead too.
    serverActions: { bodySizeLimit: "2mb" },
  },
  images: {
    remotePatterns: ["/logos/**", "/choices/**"].map((pathname) => ({
      protocol: "https" as const,
      hostname: "*.public.blob.vercel-storage.com",
      pathname,
    })),
  },
  // Next's default list plus Telegram and Viber: their link previews read only the first <head>, not streamed tags.
  htmlLimitedBots:
    /facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|TelegramBot|Viber/i,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders(process.env.NODE_ENV === "development"),
      },
    ];
  },
};

export default nextConfig;
