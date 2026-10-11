import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  output: 'export',
  // Dev server on a phone over Wi-Fi (http://<mac-ip>:3000): Next blocks dev assets from other origins otherwise,
  // which leaves the page stuck on the loading placeholder.
  allowedDevOrigins: ['192.168.*.*', '*.local'],
  turbopack: {
    rules: {
      '*.css': { loaders: ['@tailwindcss/turbopack'], as: '*.css' },
    },
  },
};

export default createNextIntlPlugin('./i18n/request.ts')(nextConfig);
