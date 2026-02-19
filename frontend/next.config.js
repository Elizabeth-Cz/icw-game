/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '**',
      },
    ],
    // Allow importing images from the local assets directory
    unoptimized: true,
  },
};

module.exports = nextConfig;
