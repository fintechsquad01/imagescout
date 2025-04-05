
import { getSupabaseClient, getCurrentUserId, sanitizePayload, handleLoggingError } from './loggerUtils';
import { UploadLogPayload, UploadStats } from '@/types/project';

// Log image upload
export const logImageUpload = async (payload: UploadLogPayload): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const userId = payload.userId || await getCurrentUserId();
    
    if (!userId) {
      console.warn('Cannot log image upload: No user ID available');
      return false;
    }
    
    // Convert to snake_case for Supabase
    const formattedPayload = {
      user_id: userId,
      image_count: payload.count || payload.image_count,
      project_id: payload.projectId || payload.project_id,
      image_ids: payload.imageIds || [],
      created_at: new Date().toISOString(),
      test: payload.test || false
    };
    
    const sanitized = sanitizePayload(formattedPayload);
    
    const { error } = await supabase
      .from('upload_logs')
      .insert(sanitized);
    
    if (error) {
      console.error('Error logging image upload:', error);
      handleLoggingError(error, 'upload_logs');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in logImageUpload:', error);
    return false;
  }
};

// Get user upload stats
export const getUploadStats = async (projectId?: string): Promise<UploadStats | null> => {
  try {
    const supabase = getSupabaseClient();
    const userId = await getCurrentUserId();
    
    if (!userId || !projectId) {
      console.warn('Cannot get upload stats: Missing user ID or project ID');
      return null;
    }
    
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Query uploads for today
    const { data, error } = await supabase
      .from('upload_logs')
      .select('image_count')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .gte('created_at', today.toISOString());
    
    if (error) {
      console.error('Error fetching upload stats:', error);
      return null;
    }
    
    // Calculate total uploads today
    const dailyUploads = data?.length
      ? data.reduce((sum, item) => sum + (item.image_count || 0), 0)
      : 0;
    
    // Get upload limits from user settings or use defaults
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('daily_upload_limit')
      .eq('user_id', userId)
      .single();
    
    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching user settings:', settingsError);
    }
    
    const maxDailyUploads = settings?.daily_upload_limit || 100;
    
    return {
      dailyUploads,
      maxUploads: maxDailyUploads,
      maxDailyUploads,
      remainingUploads: Math.max(0, maxDailyUploads - dailyUploads)
    };
  } catch (error) {
    console.error('Error in getUploadStats:', error);
    return null;
  }
};
