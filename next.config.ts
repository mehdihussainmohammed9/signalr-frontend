import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Azure App Service deployment optimizations
  compress: true,
  poweredByHeader: false,
  output: 'standalone',
  
  // Environment-specific configuration
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || '',
  },
};

export default nextConfig;
