/**
 * Development-only logging utility
 * Logs are only output when NODE_ENV is 'development'
 * In production, all logs are silently ignored to improve performance
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const devLog = {
  log: (...args: any[]) => {
    if (isDevelopment) console.log(...args);
  },

  warn: (...args: any[]) => {
    if (isDevelopment) console.warn(...args);
  },

  error: (...args: any[]) => {
    if (isDevelopment) console.error(...args);
  },

  // Always log errors in production (for debugging critical issues)
  errorAlways: (...args: any[]) => {
    console.error(...args);
  },
};
