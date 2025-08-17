/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // В продакшене игнорируем ESLint ошибки
    ignoreDuringBuilds: true,
  },
  typescript: {
    // В продакшене игнорируем TypeScript ошибки 
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig