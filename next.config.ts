import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ['@whiskeysockets/baileys', 'pino', 'qrcode', 'chromadb'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    // Ignore tap dependency which causes build errors in thread-stream
    config.resolve.alias = {
      ...config.resolve.alias,
      tap: false,
    };
    return config;
  },
};

export default nextConfig;
