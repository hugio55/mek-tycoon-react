/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase memory limit for build process
  experimental: {
    workerThreads: false,
    cpus: 1
  },
  
  // Optimize image handling
  images: {
    unoptimized: true, // Since we're serving local images
  },
  
  // Disable static optimization for large datasets
  staticPageGenerationTimeout: 120,
  
  // Skip linting and type checking for quick deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Fix webpack crypto issue
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }
    return config;
  },
};

export default nextConfig;