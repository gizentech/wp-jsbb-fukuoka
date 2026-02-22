/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'jsbb-kurume.cdn.newt.so',
      'jsbb-kurume.assets.newt.so',
      'jsbb-fukuoka.com'
    ],
    unoptimized: true, // 本番環境でも画像最適化を無効化
  },
  trailingSlash: true,
};

module.exports = nextConfig;