/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle (.next/standalone) so the Docker
  // runtime image only ships the traced node_modules, not the full tree.
  output: "standalone",
  // Customer storefront is public and indexable. Product/content images are
  // served from the backend asset host — add its hostname here so next/image
  // can optimize them (e.g. { protocol: "https", hostname: "cdn.example.com" }).
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
