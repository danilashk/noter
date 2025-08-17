import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Простая конфигурация для Vercel
  experimental: {
    appDir: true,
  },
  // Убираем output: 'standalone' который может вызывать проблемы
  swcMinify: true,
};

export default nextConfig;
