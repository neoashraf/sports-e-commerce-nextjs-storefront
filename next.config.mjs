/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle (.next/standalone) so the Docker
  // runtime image only ships the traced node_modules, not the full tree.
  //
  // Gated behind BUILD_STANDALONE: the standalone tracer symlinks node_modules
  // into .next/standalone, which fails with EPERM on Windows + OneDrive (no
  // symlink permission). The Dockerfile sets BUILD_STANDALONE=1 so the deploy
  // image still gets server.js; a plain local `next build` skips it and passes.
  ...(process.env.BUILD_STANDALONE ? { output: "standalone" } : {}),
  // Customer storefront is public and indexable. Product/content images are
  // served from the backend asset host — add its hostname here so next/image
  // can optimize them (e.g. { protocol: "https", hostname: "cdn.example.com" }).
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
