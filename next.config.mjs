import {withSentryConfig} from '@sentry/nextjs';
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
        'cannon-es',
        // Additional heavy packages for bundle size reduction
        'archiver',
        'adm-zip',
        'jszip',
        'fs-extra',
        // Sentry packages (reduces bundle bloat)
        '@sentry/node',
        '@sentry/core',
        // OpenTelemetry (bundled with Sentry, very large)
        '@opentelemetry/api',
        '@opentelemetry/core',
        '@opentelemetry/instrumentation',
        '@opentelemetry/sdk-trace-base',
        '@opentelemetry/sdk-trace-node'
      );
    }

    // Keep default Next.js optimization settings
    // Custom chunk splitting can cause "self is not defined" errors in server context

    return config;
  },
};

// Conditionally enable Sentry only when explicitly enabled via environment variable
// This prevents Sentry from bloating the Vercel deployment bundle (~16-20 MB per function)
// To enable Sentry, set ENABLE_SENTRY=true in environment variables
const useSentry = process.env.ENABLE_SENTRY === 'true';

export default useSentry
  ? withSentryConfig(nextConfig, {
      // For all available options, see:
      // https://www.npmjs.com/package/@sentry/webpack-plugin#options

      org: "over-exposed",

      project: "javascript-nextjs",

      // Only print logs for uploading source maps in CI
      silent: !process.env.CI,

      // For all available options, see:
      // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

      // DISABLED: Upload a larger set of source maps (was increasing bundle size)
      widenClientFileUpload: false,

      // DISABLED: Route browser requests to Sentry (adds runtime overhead)
      // tunnelRoute: "/monitoring",

      // Automatically tree-shake Sentry logger statements to reduce bundle size
      disableLogger: true,

      // Hide source maps from bundle (don't include in deployment)
      hideSourceMaps: true,

      // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
      // See the following for more information:
      // https://docs.sentry.io/product/crons/
      // https://vercel.com/docs/cron-jobs
      automaticVercelMonitors: true,
    })
  : nextConfig;
