import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Azure App Service deployment optimizations
  compress: true,
  poweredByHeader: false,
  
  // Environment-specific configuration
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || '',
  },
};

export default nextConfig;
