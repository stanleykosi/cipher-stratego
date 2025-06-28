/**
 * @description
 * This file contains the configuration for the Next.js application.
 *
 * I have added a webpack configuration to provide browser-compatible polyfills
 * for Node.js core modules like `crypto` and `stream`. This is a crucial
 * step for many Web3 libraries, including `@arcium-hq/client`, which were
 * originally designed for a Node.js environment and use APIs not natively
 * available in browsers. This 'fallback' configuration tells webpack to use
 * the specified browser-friendly libraries whenever the code requests the
 * Node.js native ones.
 *
 * @notes
 * This configuration prevents runtime errors like "Module not found: Can't
 * resolve 'crypto'" when the application is run in the browser.
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // We need to provide browser-compatible fallbacks for Node.js core modules.
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
      };
    }

    return config;
  },
};

export default nextConfig;