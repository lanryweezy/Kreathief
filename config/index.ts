/**
 * Application Configuration
 * Centralized configuration management for all environment variables and constants
 */

// Environment variables with validation
const getEnv = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key] || defaultValue;

  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const getOptionalEnv = (key: string, defaultValue = ''): string => {
  return import.meta.env[key] || defaultValue;
};

// API Configuration
export const config = {
  // Application
  app: {
    name: 'Kreathief',
    version: '1.0.0',
    environment: import.meta.env.MODE || 'development',
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  },

  // Supabase Configuration
  supabase: {
    url: getEnv('VITE_SUPABASE_URL'),
    anonKey: getEnv('VITE_SUPABASE_ANON_KEY'),
    schema: 'kreathief',
    useQABypass: getOptionalEnv('VITE_USE_QA_BYPASS', 'false') === 'true',
  },

  // AI Services
  ai: {
    gemini: {
      apiKey: getOptionalEnv('VITE_GEMINI_API_KEY'),
      model: 'gemini-2.5-flash',
      maxRetries: 3,
      timeout: 30000,
    },
  },

  // External APIs
  apis: {
    unsplash: {
      accessKey: getOptionalEnv('VITE_UNSPLASH_ACCESS_KEY'),
      secretKey: getOptionalEnv('VITE_UNSPLASH_SECRET_KEY'),
      baseUrl: 'https://api.unsplash.com',
    },
    streamline: {
      apiKey: getOptionalEnv('VITE_STREAMLINE_API_KEY'),
      baseUrl: 'https://api.streamlinehq.com',
    },
    freepik: {
      apiKey: getOptionalEnv('VITE_FREEPIK_API_KEY'),
      baseUrl: 'https://api.freepik.com',
    },
    vecteezy: {
      apiKey: getOptionalEnv('VITE_VECTEEZY_API_KEY'),
      baseUrl: 'https://api.vecteezy.com',
    },
    dynamicMockups: {
      apiKey: getOptionalEnv('VITE_DYNAMIC_MOCKUPS_API_KEY'),
      baseUrl: 'https://api.dynamicmockups.com',
    },
  },

  // Storage Configuration
  storage: {
    indexedDB: {
      name: 'kreathief_db',
      version: 3,
    },
    localStorage: {
      prefix: 'kreathief_',
      keys: {
        user: 'kreathief_user',
        onboarding: 'kreathief_onboarding_seen',
        qaSession: 'kreathief_qa_session',
        projects: 'kreathief_projects',
        recentFonts: 'kreathief_recent_fonts',
        recentColors: 'kreathief_recent_colors',
        settings: 'kreathief_settings',
      },
    },
  },

  // Canvas Defaults
  canvas: {
    defaultWidth: 1080,
    defaultHeight: 1080,
    minZoom: 0.1,
    maxZoom: 5,
    snapThreshold: 5,
    gridSpacing: 10,
  },

  // Performance Settings
  performance: {
    autoSaveInterval: 10000, // 10 seconds
    debounceDelay: 300,
    maxHistorySize: 50,
    maxUndoSteps: 100,
  },

  // UI Configuration
  ui: {
    toastDuration: 3000,
    modalAnimationDuration: 200,
    sidebarMinWidth: 280,
    sidebarMaxWidth: 400,
  },

  // Feature Flags
  features: {
    enableAI: true,
    enableCollaboration: false,
    enableCloudSync: true,
    enableOfflineMode: true,
    enableBetaFeatures: import.meta.env.DEV,
  },

  // Security
  security: {
    sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxLoginAttempts: 5,
    passwordMinLength: 8,
  },
} as const;

// Type inference helper
export type Config = typeof config;

// Validation function to check API keys at runtime
export const validateConfig = (): void => {
  const warnings: string[] = [];

  if (!config.supabase.url || !config.supabase.anonKey) {
    warnings.push('Supabase credentials not configured');
  }

  if (!config.ai.gemini.apiKey) {
    warnings.push('Gemini API key not configured - AI features disabled');
  }

  if (!config.apis.unsplash.accessKey) {
    warnings.push('Unsplash API key not configured');
  }

  if (warnings.length > 0) {
    console.warn('[Config Validation]', ...warnings);
  }
};

// Export individual modules for convenience
export const { app, supabase, ai, apis, storage, canvas, performance, ui, features, security } = config;
