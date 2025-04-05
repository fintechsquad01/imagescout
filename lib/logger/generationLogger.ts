
import { getSupabaseClient, getCurrentUserId, sanitizePayload, handleLoggingError } from './loggerUtils';
import { GenerationLogPayload, createGenerationLogPayload } from '@/types/project';

// Log generation result
export const logGenerationResult = async (payload: GenerationLogPayload): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const userId = payload.userId || await getCurrentUserId();
    
    if (!userId) {
      console.warn('Cannot log generation: No user ID available');
      return false;
    }
    
    // Convert to snake_case for Supabase
    const formattedPayload = {
      user_id: userId,
      image_id: payload.imageId,
      model: payload.model,
      prompt: payload.prompt,
      success: payload.success,
      execution_time: payload.executionTime,
      retry_used: payload.retry_used,
      result_url: payload.result_url,
      error_message: payload.error,
      project_id: payload.projectId,
      created_at: new Date().toISOString(),
      test: payload.test || false
    };
    
    const sanitized = sanitizePayload(formattedPayload);
    
    const { error } = await supabase
      .from('generation_logs')
      .insert(sanitized);
    
    if (error) {
      console.error('Error logging generation result:', error);
      handleLoggingError(error, 'generation_logs');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in logGenerationResult:', error);
    return false;
  }
};

// Log prompt history
export const logPromptHistory = async (payload: any): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const userId = payload.userId || await getCurrentUserId();
    
    if (!userId) {
      console.warn('Cannot log prompt history: No user ID available');
      return false;
    }
    
    // Convert to snake_case for Supabase
    const formattedPayload = {
      user_id: userId,
      image_id: payload.imageId,
      prompt: payload.prompt,
      model_used: payload.model,
      success: payload.success,
      project_id: payload.projectId,
      result_url: payload.imageUrl,
      created_at: new Date().toISOString(),
      is_favorite: payload.isFavorite || false,
      tags: payload.tags || []
    };
    
    const sanitized = sanitizePayload(formattedPayload);
    
    const { error } = await supabase
      .from('prompt_history')
      .insert(sanitized);
    
    if (error) {
      console.error('Error logging prompt history:', error);
      handleLoggingError(error, 'prompt_history');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in logPromptHistory:', error);
    return false;
  }
};

// Re-exported for backwards compatibility
export const logToSupabase = logGenerationResult;
