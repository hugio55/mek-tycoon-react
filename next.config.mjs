import {withSentryConfig} from '@sentry/nextjs';
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for optimized Vercel deployments (reduces serverless bundle size)
  // DISABLED: Testing if this prevents webpack externals from working properly
  // Standalone mode bundles everything together which may ignore externals configuration
  // output: 'standalone',

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
        'cannon-es'
      );
    }

    // Additional optimizations for bundle size
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      // Split chunks more aggressively to reduce serverless function sizes
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Separate framework code
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            priority: 40,
            enforce: true,
          },
          // Separate Convex client
          convex: {
            name: 'convex',
            test: /[\\/]node_modules[\\/]convex[\\/]/,
            chunks: 'all',
            priority: 30,
          },
          // Separate visualization libraries (three.js, recharts)
          visualization: {
            name: 'visualization',
            test: /[\\/]node_modules[\\/](three|cannon|cannon-es|recharts)[\\/]/,
            chunks: 'all',
            priority: 25,
          },
          // Separate UI libraries
          ui: {
            name: 'ui',
            test: /[\\/]node_modules[\\/](framer-motion|motion|lucide-react)[\\/]/,
            chunks: 'all',
            priority: 20,
          },
          // Common chunks shared by multiple pages
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 10,
          },
        },
      },
    };

    return config;
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "over-exposed",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});