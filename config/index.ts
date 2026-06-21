/**
 * Application Configuration
 * Centralized configuration management for all environment variables and constants
 */

import { log } from '../utils/log';

// Environment variables with validation
const getEnv = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key] || defaultValue;

  // For E2E tests, we allow missing env vars if QA bypass is enabled
  const isQABypass = import.meta.env.VITE_QA_BYPASS === 'true';
  if (value === undefined && !isQABypass) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value || '';
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
    schema: 'public',
    useQABypass: getOptionalEnv('VITE_USE_QA_BYPASS', 'false') === 'true',
  },

  // AI Services
  ai: {
    gemini: {
      // API Key is now handled securely on the server side via Vercel Functions
      model: 'gemini-2.5-flash',
      maxRetries: 3,
      timeout: 30000,
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

  // Gemini API key validation moved to the server-side

  if (warnings.length > 0) {
    log.warn('[ConfigValidation] Missing optional configurations', { warnings });
  }
};

// Export individual modules for convenience
export const { app, supabase, ai, storage, canvas, performance, ui, features, security } = config;
