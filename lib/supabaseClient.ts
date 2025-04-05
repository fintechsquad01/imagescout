
import { createBrowserClient } from '@supabase/ssr';
import { isDevelopmentMode, logDevModeBypass } from '@/utils/devMode';
import { toast } from 'sonner';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cache Supabase client instance
let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Creates and returns a Supabase client using createBrowserClient from @supabase/ssr
 * If we're in development mode, logs extra info and provides fallbacks
 */
export const getSupabaseClient = () => {
  // In development mode, log access and use fallbacks if needed
  if (isDevelopmentMode()) {
    if (!supabaseUrl || !supabaseAnonKey) {
      logDevModeBypass('supabase-client');
      console.warn(
        '%c[DEV MODE] Missing Supabase credentials, using development fallbacks',
        'color: #ff9800; font-weight: bold'
      );
    }
  } else {
    // In production, validate environment variables
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase credentials');
      toast('Configuration Error: Supabase connection failed. Please contact support.');
    }
  }

  // Use cached instance if available
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  // Create a new client
  try {
    // Use fallback values in dev mode, throw in production
    const url = supabaseUrl || (isDevelopmentMode() 
      ? 'https://example.supabase.co' 
      : '');
    const key = supabaseAnonKey || (isDevelopmentMode() 
      ? 'dev-mode-key' 
      : '');

    if (!url || !key) {
      throw new Error('Supabase credentials are required');
    }

    supabaseClientInstance = createBrowserClient(url, key);
    return supabaseClientInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    
    // In development mode, provide a mock client
    if (isDevelopmentMode()) {
      logDevModeBypass('supabase-client-error');
      // Create a minimal mock client that won't crash the app
      return createMockSupabaseClient();
    }
    
    // In production, rethrow the error
    throw error;
  }
};

/**
 * Creates a mock Supabase client for development purposes
 * This prevents crashes when Supabase is not configured
 */
function createMockSupabaseClient() {
  console.info('[DEV MODE] Using mock Supabase client');
  
  // Return a minimal mock client that won't crash the app
  return {
    // Required client properties
    supabaseUrl: 'https://example.supabase.co',
    supabaseKey: 'dev-mode-key',
    
    // Mock basic functions
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => Promise.resolve({ data: [], error: null }),
            range: () => Promise.resolve({ data: [], error: null, count: 0 }),
          }),
          contains: () => Promise.resolve({ data: [], error: null }),
          ilike: () => Promise.resolve({ data: [], error: null }),
          gte: () => ({
            lte: () => Promise.resolve({ data: [], error: null })
          }),
          or: () => Promise.resolve({ data: [], error: null }),
        }),
        order: () => ({
          range: () => Promise.resolve({ data: [], error: null, count: 0 })
        }),
        count: () => Promise.resolve({ count: 0, error: null }),
        insert: () => Promise.resolve({ data: null, error: null }),
      }),
      count: () => Promise.resolve({ count: 0, error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: () => Promise.resolve({ error: null }),
      signIn: () => Promise.resolve({ data: { user: null }, error: null }),
      signUp: () => Promise.resolve({ data: { user: null }, error: null }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: { path: 'mock-path' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://placeholder.co/300' } }),
      }),
    },
    functions: {
      invoke: (name: string) => {
        console.info(`[DEV MODE] Mock function invoke: ${name}`);
        if (name === 'score-image') {
          return Promise.resolve({
            data: {
              labels: ['mock', 'image', 'labels'],
              colors: ['rgb(42, 75, 153)', 'rgb(89, 156, 231)'],
              objects: ['object1', 'object2'],
              landmarks: [],
              safeSearch: {
                adult: 'UNLIKELY',
                violence: 'UNLIKELY',
                racy: 'UNLIKELY'
              }
            },
            error: null
          });
        }
        return Promise.resolve({ data: {}, error: null });
      }
    },
    // Add required properties with empty implementations
    rpc: () => Promise.resolve({ data: null, error: null })
  } as unknown as ReturnType<typeof createBrowserClient>;
}

// Export a singleton instance for direct imports
export const supabase = getSupabaseClient();
