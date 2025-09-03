/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'md'],
  
  // Enable static export for documentation
  output: 'export',
  
  // Base path for GitHub Pages or subdirectory hosting
  basePath: process.env.BASE_PATH || '',
  
  // Asset prefix for CDN
  assetPrefix: process.env.ASSET_PREFIX || '',
  
  // Webpack configuration for markdown
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      use: 'raw-loader'
    });
    
    return config;
  },
  
  // Environment variables
  env: {
    SITE_URL: process.env.SITE_URL || 'https://semantic-protocol.org',
    GITHUB_URL: 'https://github.com/semantic-protocol/core',
    DISCORD_URL: 'https://discord.gg/semantic-protocol'
  }
};

module.exports = nextConfig;