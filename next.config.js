/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com', 'images.unsplash.com', 'replicate.delivery'],
  },
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    FALAI_API_KEY: process.env.FALAI_API_KEY,
  },
}

module.exports = nextConfig
