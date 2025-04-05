
import { getSupabaseClient as getClient } from '@/lib/supabaseClient';

// Re-export the supabase client getter
export const getSupabaseClient = getClient;

// Get the current user ID
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    
    if (error || !data.user) {
      console.log('No authenticated user found');
      return null;
    }
    
    return data.user.id;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
};

// Sanitize payload before sending to Supabase
export const sanitizePayload = (payload: any): any => {
  // Deep clone
  const sanitized = JSON.parse(JSON.stringify(payload));
  
  // Remove undefined values
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });
  
  return sanitized;
};

// Handle errors during logging
export const handleLoggingError = (error: any, tableName: string): void => {
  // Log to console for now
  console.error(`Error logging to ${tableName}:`, error);
  
  // In development mode, add a console trace
  if (process.env.NODE_ENV === 'development') {
    console.trace(`Logging error stack trace for ${tableName}`);
  }
  
  // Future: Could send to error tracking system
};
