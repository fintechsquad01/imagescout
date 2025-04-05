import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { UploadLogPayload, GenerationLogPayload } from '@/types/feedback';
import { isDevelopmentMode } from '@/utils/devMode';

export interface UseSupabaseLoggerReturn {
  logUpload: (data: Partial<UploadLogPayload> & { projectId?: string }) => Promise<boolean>;
  logUploadSuccess: (fileName: string, fileSize: number, fileType?: string, projectId?: string) => Promise<boolean>;
  logUploadError: (fileName: string, fileSize: number, error: string, fileType?: string, projectId?: string) => Promise<boolean>;
  logGenerationResult: (data: GenerationLogPayload) => Promise<boolean>;
  logGenerationSuccess: (imageId: string, prompt: string, model: string, duration?: number, projectId?: string) => Promise<boolean>;
  logGenerationError: (imageId: string, prompt: string, model: string, error: string, duration?: number, projectId?: string) => Promise<boolean>;
  getGenerationStats: () => Promise<any>;
  getUploadStats: () => Promise<any>;
  isLoading: boolean;
  dailyUploads: number;
  maxDailyUploads: number;
  remainingUploads: number;
  logImageUpload: (count: number) => Promise<boolean>;
  isAuthenticated: boolean;
}

export const useSupabaseLogger = (): UseSupabaseLoggerReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, getCurrentUser } = useSupabaseAuth();
  const [dailyUploads, setDailyUploads] = useState(0);
  const [maxDailyUploads] = useState(100); // Default limit
  const [remainingUploads, setRemainingUploads] = useState(100);

  const logUpload = useCallback(async (data: Partial<UploadLogPayload> & { projectId?: string }) => {
    if (!data.fileName) {
      console.warn('Filename is required for upload logging');
      return false;
    }
    
    try {
      const session = await getCurrentUser();
      const userId = session?.id;
      
      // Create a valid payload with all required fields
      const payload: UploadLogPayload = {
        fileName: data.fileName,
        fileSize: data.fileSize || 0,
        success: data.success !== undefined ? data.success : true,
        fileType: data.fileType,
        projectId: data.projectId,
        userId: userId || undefined,
        error: data.error
      };
      
      const { error } = await supabase.from('upload_logs').insert([{
        file_name: payload.fileName,
        file_size: payload.fileSize,
        success: payload.success,
        file_type: payload.fileType,
        project_id: payload.projectId,
        user_id: payload.userId,
        error: payload.error,
        created_at: new Date().toISOString()
      }]);
      
      if (error) {
        console.error('Error logging upload:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error logging upload:', error);
      return false;
    }
  }, [getCurrentUser]);

  const logUploadSuccess = useCallback(async (fileName: string, fileSize: number, fileType?: string, projectId?: string) => {
    return logUpload({ fileName, fileSize, success: true, fileType, projectId });
  }, [logUpload]);

  const logUploadError = useCallback(async (fileName: string, fileSize: number, error: string, fileType?: string, projectId?: string) => {
    return logUpload({ fileName, fileSize, success: false, error, fileType, projectId });
  }, [logUpload]);

  const logGenerationResult = useCallback(async (data: GenerationLogPayload) => {
    if (!data.imageId) {
      console.warn('ImageId is required for generation logging');
      return false;
    }
    
    try {
      const session = await getCurrentUser();
      const userId = session?.id;
      
      const { error } = await supabase.from('generation_logs').insert([{
        image_id: data.imageId,
        prompt: data.prompt,
        model: data.model,
        success: data.success,
        project_id: data.projectId,
        user_id: userId,
        error: data.error,
        duration: data.duration,
        created_at: new Date().toISOString()
      }]);
      
      if (error) {
        console.error('Error logging generation:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error logging generation:', error);
      return false;
    }
  }, [getCurrentUser]);

  const logGenerationSuccess = useCallback(async (imageId: string, prompt: string, model: string, duration?: number, projectId?: string) => {
    return logGenerationResult({ imageId, prompt, model, success: true, duration, projectId });
  }, [logGenerationResult]);

  const logGenerationError = useCallback(async (imageId: string, prompt: string, model: string, error: string, duration?: number, projectId?: string) => {
    return logGenerationResult({ imageId, prompt, model, success: false, error, duration, projectId });
  }, [logGenerationResult]);

  const getGenerationStats = useCallback(async (): Promise<any> => {
    setIsLoading(true);
    try {
      // Your existing getGenerationStats logic here
      return {};
    } catch (error) {
      console.error('Error fetching generation stats:', error);
      toast.error('Failed to fetch generation stats');
      return {};
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUploadStats = useCallback(async (): Promise<any> => {
    setIsLoading(true);
    try {
      // Your existing getUploadStats logic here
      return {};
    } catch (error) {
      console.error('Error fetching upload stats:', error);
      toast.error('Failed to fetch upload stats');
      return {};
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logImageUpload = useCallback(async (count: number) => {
    try {
      const user = await getCurrentUser();
      if (!user && !isDevelopmentMode()) {
        console.warn('Cannot log image upload: No user ID available');
        return false;
      }

      setDailyUploads(prev => prev + count);
      setRemainingUploads(prev => Math.max(0, prev - count));
      
      const session = await getCurrentUser();
      const userId = session?.id;
      
      const { error } = await supabase.from('upload_logs').insert([{
        image_count: count,
        user_id: userId,
        created_at: new Date().toISOString()
      }]);
      
      if (error) {
        console.error('Error logging upload:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in logImageUpload:', error);
      return false;
    }
  }, [getCurrentUser]);

  return {
    logUpload,
    logUploadSuccess,
    logUploadError,
    logGenerationResult,
    logGenerationSuccess,
    logGenerationError,
    getGenerationStats,
    getUploadStats,
    isLoading,
    dailyUploads,
    maxDailyUploads,
    remainingUploads,
    logImageUpload,
    isAuthenticated
  };
};
