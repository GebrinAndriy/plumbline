import type { Metadata } from "next";
import { Inter, Literata } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"] });

// Literata instead of the mockup's Fraunces: business and customer names are often Cyrillic.
const literata = Literata({ variable: "--font-literata", subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  // Explicit, because Vercel's own production URL can still be the project's first address.
  metadataBase: process.env.APP_URL ? new URL(process.env.APP_URL) : undefined,
  title: "Plumbline",
  description: "Instant price quotes and lead management for small service businesses",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IE" className={`${inter.variable} ${literata.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
