/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for optimized Vercel deployments (reduces serverless bundle size)
  // DISABLED: Testing if this prevents webpack externals from working properly
  // Standalone mode bundles everything together which may ignore externals configuration
  // output: 'standalone',

  // CRITICAL: Disable source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,

  // Increase memory limit for build process
  experimental: {
    workerThreads: false,
    cpus: 1,
    // Enable legacy browser support (transpiles to ES5 for iOS 12+)
    legacyBrowsers: true,
    browsersListForSwc: true,
  },

  // Optimize image handling
  images: {
    unoptimized: true, // Since we're serving local images
  },

  // Disable static optimization for large datasets
  staticPageGenerationTimeout: 120,

  // Skip type checking for quick deployment
  typescript: {
    ignoreBuildErrors: true,
  },

  // Use Turbopack (Next.js 16 default, faster than webpack)
  turbopack: {},

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

    // Externalize heavy packages for SERVER bundles only (reduces serverless function size)
    // These packages are still available in node_modules at runtime on Vercel
    // Client bundles still include them for WASM support
    if (isServer) {
      config.externals = config.externals || [];

      // Ensure externals is an array we can push to
      if (!Array.isArray(config.externals)) {
        config.externals = [config.externals];
      }

      // Add heavy blockchain packages (only used in admin minting routes)
      config.externals.push(
        '@meshsdk/core',
        '@meshsdk/react',
        '@emurgo/cardano-serialization-lib-nodejs',
        '@emurgo/cardano-serialization-lib-browser',
        '@fabianbormann/cardano-peer-connect',
        '@lucid-evolution/lucid',
        // AWS SDK (optional dependency of unzipper, not used in our code)
        '@aws-sdk/client-s3',
        // Three.js and physics engines (only used in a few experimental pages)
        'three',
        'cannon',
        'cannon-es',
        // Additional heavy packages for bundle size reduction
        'archiver',
        'adm-zip',
        'jszip',
        'fs-extra'
        // REMOVED: Sentry and OpenTelemetry externals cause webpack parsing errors
        // These are needed at build time, can't be externalized
      );
    }

    // Keep default Next.js optimization settings
    // Custom chunk splitting can cause "self is not defined" errors in server context

    return config;
  },
};

export default nextConfig;
