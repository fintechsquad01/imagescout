import { supabase } from '@/lib/supabase';
import { 
  ScoreCacheEntry, 
  ScoreCacheLog, 
  ScoringErrorEntry, 
  CachedStatus 
} from '@/types/scoring';

/**
 * Get a cached score for an image and model
 */
export const getScoreFromCache = async (file: File, modelId: string): Promise<ScoreCacheEntry | null> => {
  if (!file || !modelId) {
    console.warn('Invalid parameters for getScoreFromCache');
    return null;
  }

  try {
    // For now, use the file name as a simple hash
    const imageHash = file.name + file.size.toString();
    
    // Look for cached entry
    const { data, error } = await supabase
      .from('scoring_cache')
      .select('*')
      .eq('image_hash', imageHash)
      .eq('model_id', modelId)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching from cache:', error);
      return null;
    }
    
    if (!data) {
      // Log cache miss
      logCacheAccess(imageHash, modelId, CachedStatus.MISS);
      return null;
    }
    
    // Log cache hit
    logCacheAccess(imageHash, modelId, CachedStatus.HIT, data.score);
    
    return {
      id: data.id,
      imageHash: data.image_hash,
      modelId: data.model_id,
      score: data.score,
      createdAt: data.created_at,
      data: data.data
    };
  } catch (error) {
    console.error('Error getting score from cache:', error);
    return null;
  }
};

/**
 * Save a score to the cache
 */
export const saveScoreToCache = async (
  file: File, 
  modelId: string, 
  score: number,
  data?: any
): Promise<boolean> => {
  if (!file || !modelId) {
    console.warn('Invalid parameters for saveScoreToCache');
    return false;
  }

  try {
    // Simple hash using filename and size
    const imageHash = file.name + file.size.toString();
    
    const { error } = await supabase
      .from('scoring_cache')
      .insert({
        image_hash: imageHash,
        model_id: modelId,
        score: score,
        data: data || null,
        created_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error saving to cache:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error saving score to cache:', error);
    return false;
  }
};

/**
 * Clear the entire scoring cache
 */
export const clearScoreCache = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('scoring_cache')
      .delete()
      .neq('id', '0'); // Delete all rows
      
    if (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
};

/**
 * Clear cache entries for a specific image
 */
export const clearSingleScoreCache = async (imageId: string): Promise<boolean> => {
  if (!imageId) {
    console.warn('Invalid imageId for clearSingleScoreCache');
    return false;
  }
  
  try {
    // Note: We're assuming the scoring_cache table has an image_id column
    const { error } = await supabase
      .from('scoring_cache')
      .delete()
      .eq('image_id', imageId);
      
    if (error) {
      console.error(`Error clearing cache for image ${imageId}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error clearing cache for image ${imageId}:`, error);
    return false;
  }
};

/**
 * Log access to the scoring cache
 */
const logCacheAccess = async (
  imageHash: string,
  modelId: string,
  status: CachedStatus,
  score?: number
): Promise<void> => {
  try {
    await supabase
      .from('scoring_cache_logs')
      .insert({
        image_hash: imageHash,
        model_id: modelId,
        status: status,
        score: score,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging cache access:', error);
  }
};

/**
 * Log a scoring error
 */
export const logScoringError = async (data: {
  error: string;
  imageId: string;
  modelId: string;
  context?: any;
}): Promise<void> => {
  try {
    await supabase
      .from('scoring_errors')
      .insert({
        error_message: data.error,
        image_id: data.imageId,
        model_id: data.modelId,
        context: data.context,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging scoring error:', error);
  }
};
