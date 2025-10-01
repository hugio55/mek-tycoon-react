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
  
  // Fix webpack crypto and WebAssembly issues
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
        fs: false,
        path: false,
      };
    }

    // Handle WebAssembly files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Add rule for WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    // Don't exclude MeshSDK packages - they need to be bundled for WASM support

    return config;
  },
};

export default nextConfig;