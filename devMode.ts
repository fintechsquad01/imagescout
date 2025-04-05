/**
 * Utility functions for development mode behaviors
 * 
 * Environment variables:
 * - VITE_SUPABASE_URL: Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Supabase anon/public key
 * - VITE_VISION_API_KEY: Google Vision API key
 * - VITE_USE_EDGE_FUNCTIONS: Whether to use Supabase Edge Functions (true/false)
 * - VITE_ENABLE_REAL_SCORING: Force real API calls even in dev mode (true/false)
 * - VITE_ENABLE_STRIPE_BILLING: Enable Stripe billing integration (true/false)
 */

/**
 * Checks if the application is running in development mode
 */
export const isDevelopmentMode = (): boolean => {
  return import.meta.env.DEV || 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1';
};

/**
 * Logs development mode bypasses for debugging
 */
export const logDevModeBypass = (feature: string): void => {
  if (isDevelopmentMode()) {
    console.log(`[DEV MODE] Bypassing ${feature} check - all features enabled in development`);
  }
};

/**
 * Checks if auth bypass should be enabled (only in development)
 */
export const isAuthBypassEnabled = (): boolean => {
  const bypassEnabled = isDevelopmentMode();
  
  if (bypassEnabled) {
    console.log('[DEV MODE] Auth bypass enabled - simulating authenticated admin user');
  }
  
  return bypassEnabled;
};

/**
 * Logs role-based access control bypass with detail level
 */
export const logRoleBypass = (requiredRoles: string[]): void => {
  if (isDevelopmentMode()) {
    console.log(`[DEV MODE] Bypassing role check - granting access to roles: ${requiredRoles.join(', ')}`);
  }
};

/**
 * Logs feature flag bypass with detail level
 */
export const logFeatureFlagBypass = (flagName: string): void => {
  if (isDevelopmentMode()) {
    console.log(`[DEV MODE] Bypassing feature flag check: ${flagName} - all features enabled in development`);
  }
};

/**
 * Logs Stripe billing bypass
 */
export const logStripeBillingBypass = (): void => {
  if (isDevelopmentMode()) {
    console.log('[DEV MODE] Bypassing Stripe billing integration - simulating successful payment flows');
  }
};

/**
 * Returns the console style string for dev mode logs
 */
export const getDevModeLogStyle = (): string => {
  return 'background: #FEF3C7; color: #92400E; padding: 2px 4px; border-radius: 2px; font-weight: bold;';
};

/**
 * Get the current development status as a formatted string for display
 */
export const getDevModeStatus = (): { active: boolean; adminAccess: boolean; featureFlags: boolean; message: string } => {
  const isDevMode = isDevelopmentMode();
  return {
    active: isDevMode,
    adminAccess: isDevMode,
    featureFlags: isDevMode,
    message: isDevMode 
      ? 'Development mode active: All features enabled, auth bypassed, admin access granted'
      : 'Production mode: Standard authentication and authorization enforced'
  };
};

/**
 * Get detailed dev mode status for dashboard display
 */
export const getDetailedDevModeStatus = (): {
  active: boolean;
  adminAccess: boolean;
  featureFlags: boolean;
  stripeBypass: boolean;
  authBypass: boolean;
  message: string;
  features: string[];
  env: {
    supabaseUrl: boolean;
    supabaseKey: boolean;
    visionApiKey: boolean;
    useEdgeFunctions: boolean;
    enableRealScoring: boolean;
  };
} => {
  const isDevMode = isDevelopmentMode();
  
  return {
    active: isDevMode,
    adminAccess: isDevMode,
    featureFlags: isDevMode,
    stripeBypass: isDevMode,
    authBypass: isDevMode,
    message: isDevMode 
      ? 'Development mode active: All access restrictions bypassed'
      : 'Production mode: Standard authentication and authorization enforced',
    features: isDevMode 
      ? [
          'Authentication bypass',
          'Admin role access',
          'All feature flags enabled',
          'Stripe billing simulation',
          'Project role bypass',
          'History & analytics access'
        ]
      : [],
    env: {
      supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
      supabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      visionApiKey: !!import.meta.env.VITE_VISION_API_KEY,
      useEdgeFunctions: !!import.meta.env.VITE_USE_EDGE_FUNCTIONS,
      enableRealScoring: !!import.meta.env.VITE_ENABLE_REAL_SCORING
    }
  };
};

/**
 * Creates a tooltip description for dev mode indicators
 */
export const getDevModeTooltip = (component: string): string => {
  return `Development mode active: ${component} restrictions bypassed for local testing`;
};
