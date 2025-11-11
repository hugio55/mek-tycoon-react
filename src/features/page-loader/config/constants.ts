export const FEATURE_FLAGS = {
  ENABLED: true,
  ENABLED_IN_DEV: true,
  ENABLED_IN_PROD: true,
  ENABLED_ROUTES: [] as string[],
};

export const TIMING = {
  MIN_DISPLAY_TIME: 300,
  TOTAL_TIMEOUT: 10000,
  QUERY_TIMEOUT: 8000,
  PROGRESS_UPDATE_INTERVAL: 100,
  FADE_DURATION: 1000,
};

export const PROGRESS_WEIGHTS = {
  QUERY_DETECTION: 0.4,
  COMMON_MILESTONES: 0.3,
  TIME_BASED: 0.3,
};

export const LOADING_MESSAGES = [
  'INITIALIZING SYSTEMS...',
  'ESTABLISHING SECURE CONNECTION...',
  'LOADING NETWORK DATA...',
  'SYNCHRONIZING BLOCKCHAIN...',
  'PREPARING INTERFACE...',
  'DECRYPTING CREDENTIALS...',
  'CALIBRATING SENSORS...',
  'COMPILING ASSETS...',
  'AUTHENTICATING USER...',
  'ALMOST READY...',
];

export const MESSAGE_ROTATION_INTERVAL = 2500;

export const COMMON_MILESTONES = [
  { at: 0, label: 'INITIALIZING...' },
  { at: 25, label: 'LOADING USER DATA...' },
  { at: 50, label: 'LOADING ASSETS...' },
  { at: 75, label: 'PREPARING DISPLAY...' },
  { at: 100, label: 'READY' },
];

// Legacy key - replaced with environment-specific keys
export const BYPASS_STORAGE_KEY = 'disablePageLoader'; // DEPRECATED - Use environment-specific keys instead

// Environment-specific storage keys
export const BYPASS_STORAGE_KEY_LOCALHOST = 'disablePageLoaderLocalhost';
export const BYPASS_STORAGE_KEY_PRODUCTION = 'disablePageLoaderProduction';
