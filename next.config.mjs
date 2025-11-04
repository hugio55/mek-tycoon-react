import {withSentryConfig} from '@sentry/nextjs';
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for optimized Vercel deployments (reduces serverless bundle size)
  output: 'standalone',

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
        // 3D library (only used in specific pages with dynamic imports)
        'three',
        // AWS SDK (optional dependency of unzipper, not used in our code)
        '@aws-sdk/client-s3'
      );
    }

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