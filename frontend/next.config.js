/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output — required for the Docker image to work without
  // the full node_modules tree at runtime.
  output: "standalone",

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Cloudinary images
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

module.exports = nextConfig;
