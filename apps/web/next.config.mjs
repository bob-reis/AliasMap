/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: true,
    serverActions: {
      bodySizeLimit: '1mb'
    }
  },
  reactStrictMode: true
};

export default nextConfig;

