import type { Metadata } from "next";
import "./globals.css";
import { env } from "@/lib/env";
import { QueryProvider } from "@/lib/query-client";
import { AppChrome } from "@/components/AppChrome";
import { Header } from "@/components/shell/Header";
import { Footer } from "@/components/shell/Footer";

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
        <QueryProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
          >
            Skip to content
          </a>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <AppChrome />
        </QueryProvider>
      </body>
    </html>
  );
}
