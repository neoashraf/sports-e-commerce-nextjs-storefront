/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Customer storefront is public and indexable. Product/content images are
  // served from the backend asset host — add its hostname here so next/image
  // can optimize them (e.g. { protocol: "https", hostname: "cdn.example.com" }).
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
