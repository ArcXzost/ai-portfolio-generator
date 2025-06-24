/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude playwright-core from bundling on server-side
      config.externals.push('playwright-core');
      
      // Also exclude other problematic modules
      config.externals.push({
        'electron': 'electron',
        'playwright-core': 'playwright-core'
      });
      
      // Ignore binary files and other assets
      config.module.rules.push({
        test: /\.(ttf|woff|woff2|eot|svg|html)$/,
        use: 'ignore-loader'
      });
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['playwright-core', '@sparticuz/chromium']
  }
};

module.exports = nextConfig;