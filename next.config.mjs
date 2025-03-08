/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ["pdf-parse"],
      },
      env: {
        MAX_FILE_SIZE: process.env.MAX_FILE_SIZE,
      },
};

export default nextConfig;
