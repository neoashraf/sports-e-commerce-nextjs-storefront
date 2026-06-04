import type { Metadata } from "next";
import "./globals.css";
import { env } from "@/lib/env";
import { QueryProvider } from "@/lib/query-client";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "Sports E-Commerce",
    template: "%s | Sports E-Commerce",
  },
  description:
    "Shop sports gear, apparel, and equipment. Fast delivery across Bangladesh.",
  // Customer storefront is public and indexable.
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Sports E-Commerce",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
