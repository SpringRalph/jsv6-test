/** @type {import('next').NextConfig} */

console.log("项目启动：如果出现 cz-shortcut-listen 的 hydration 警告，可忽略（可能由浏览器扩展引起）");

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
