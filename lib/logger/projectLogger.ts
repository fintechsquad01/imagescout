
import { handleLoggingError, getSupabaseClient, getCurrentUserId } from './loggerUtils';
import { Project } from '@/types/types';

export const getCurrentUserProjects = async (): Promise<Project[]> => {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  
  if (!userId) {
    console.warn('No user ID available for fetching projects');
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      handleLoggingError(error, 'getCurrentUserProjects');
      return [];
    }
    
    return data || [];
  } catch (err) {
    handleLoggingError(err, 'getCurrentUserProjects');
    return [];
  }
};

export const createProject = async (name: string, description?: string): Promise<Project | null> => {
  const supabase = getSupabaseClient();
  const userId = await getCurrentUserId();
  
  if (!userId) {
    console.warn('No user ID available for creating project');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        name,
        description,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      handleLoggingError(error, 'createProject');
      return null;
    }
    
    return data;
  } catch (err) {
    handleLoggingError(err, 'createProject');
    return null;
  }
};
