
/**
 * Environment variable validation utilities
 * Helps validate and provide fallbacks for required environment variables
 */

import { isDevelopmentMode, logDevModeBypass } from './devMode';

// Environment variable names
export const ENV_VARS = {
  SUPABASE_URL: 'VITE_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'VITE_SUPABASE_ANON_KEY',
  VISION_API_KEY: 'VITE_VISION_API_KEY',
  USE_EDGE_FUNCTIONS: 'VITE_USE_EDGE_FUNCTIONS',
  ENABLE_REAL_SCORING: 'VITE_ENABLE_REAL_SCORING',
  ENABLE_STRIPE_BILLING: 'VITE_ENABLE_STRIPE_BILLING',
  TEST_EDGE_FUNCTION: 'VITE_TEST_EDGE_FUNCTION',
  LOG_API_RESPONSES: 'VITE_LOG_API_RESPONSES'
};

type EnvVarName = keyof typeof ENV_VARS;

/**
 * Get an environment variable with development fallback
 * @param name The environment variable name without VITE_ prefix
 * @param devFallback Fallback value to use in development mode
 */
export function getEnvVar(name: EnvVarName, devFallback?: string): string | undefined {
  const fullName = ENV_VARS[name];
  const value = import.meta.env[fullName];
  
  // In development mode, log and use fallback if provided
  if (!value && isDevelopmentMode() && devFallback !== undefined) {
    logDevModeBypass(`missing ${fullName} - using fallback`);
    return devFallback;
  }
  
  return value;
}

/**
 * Validate required environment variables
 * @returns Object with validation results
 */
export function validateEnvVars(): {
  isValid: boolean;
  missingVars: string[];
  inDevelopment: boolean;
  usingMocks: boolean;
} {
  const inDevelopment = isDevelopmentMode();
  const missingVars: string[] = [];
  
  // Check required variables
  if (!import.meta.env[ENV_VARS.SUPABASE_URL]) {
    missingVars.push(ENV_VARS.SUPABASE_URL);
  }
  
  if (!import.meta.env[ENV_VARS.SUPABASE_ANON_KEY]) {
    missingVars.push(ENV_VARS.SUPABASE_ANON_KEY);
  }
  
  // If not using Edge Functions, Vision API key is required
  const useEdgeFunctions = import.meta.env[ENV_VARS.USE_EDGE_FUNCTIONS] === 'true';
  if (!useEdgeFunctions && !import.meta.env[ENV_VARS.VISION_API_KEY]) {
    missingVars.push(ENV_VARS.VISION_API_KEY);
  }
  
  // Determine if we'll use mocks
  const usingMocks = inDevelopment && missingVars.length > 0;
  
  // In development, missing vars is acceptable (will use mocks)
  const isValid = inDevelopment ? true : missingVars.length === 0;
  
  // Log validation results in development
  if (inDevelopment) {
    if (missingVars.length > 0) {
      console.warn(
        `%c[ENV] Missing environment variables: ${missingVars.join(', ')}`,
        'color: #ff9800; font-weight: bold'
      );
      console.info(
        '%c[ENV] Using mock data in development mode',
        'color: #2196f3; font-weight: bold'
      );
    } else {
      console.info(
        '%c[ENV] All required environment variables are set',
        'color: #4caf50; font-weight: bold'
      );
    }
  }
  
  return {
    isValid,
    missingVars,
    inDevelopment,
    usingMocks
  };
}

/**
 * Check if an environment flag is enabled
 * In development mode, returns true unless explicitly set to 'false'
 */
export function isEnvFlagEnabled(name: EnvVarName): boolean {
  const fullName = ENV_VARS[name];
  const value = import.meta.env[fullName];
  
  // In development mode, feature flags are enabled by default
  if (isDevelopmentMode()) {
    // Only return false if explicitly set to 'false'
    if (value === 'false') {
      return false;
    }
    
    // Log bypass if not explicitly set
    if (value === undefined) {
      logDevModeBypass(`${fullName} not set - defaulting to enabled`);
    }
    
    return true;
  }
  
  // In production, only return true if explicitly set to 'true'
  return value === 'true';
}

/**
 * Check if we should use Edge Functions
 */
export function shouldUseEdgeFunctions(): boolean {
  return isEnvFlagEnabled('USE_EDGE_FUNCTIONS');
}

/**
 * Check if we should use real scoring (even in dev mode)
 */
export function shouldUseRealScoring(): boolean {
  return isEnvFlagEnabled('ENABLE_REAL_SCORING');
}

/**
 * Get environment configuration summary for diagnostics
 */
export function getEnvSummary(): {
  env: 'development' | 'production';
  useEdgeFunctions: boolean;
  useRealScoring: boolean;
  enableStripeBilling: boolean;
  testEdgeFunction: boolean;
  logApiResponses: boolean;
  supportsAnalysis: boolean;
} {
  const useEdgeFunctions = shouldUseEdgeFunctions();
  const useRealScoring = shouldUseRealScoring();
  
  // Check if we have what we need for analysis
  const hasVisionKey = !!import.meta.env[ENV_VARS.VISION_API_KEY];
  const hasSupabaseKeys = !!import.meta.env[ENV_VARS.SUPABASE_URL] && 
                         !!import.meta.env[ENV_VARS.SUPABASE_ANON_KEY];
  
  // We can do analysis if:
  // 1. We're using Edge Functions and have Supabase keys, or
  // 2. We're using direct API and have Vision API key
  const supportsAnalysis = (useEdgeFunctions && hasSupabaseKeys) || 
                          (!useEdgeFunctions && hasVisionKey);
  
  return {
    env: isDevelopmentMode() ? 'development' : 'production',
    useEdgeFunctions,
    useRealScoring,
    enableStripeBilling: isEnvFlagEnabled('ENABLE_STRIPE_BILLING'),
    testEdgeFunction: isEnvFlagEnabled('TEST_EDGE_FUNCTION'),
    logApiResponses: isEnvFlagEnabled('LOG_API_RESPONSES'),
    supportsAnalysis
  };
}
