import { supabase } from '@/lib/supabase';
import { 
  ScoringOptions, 
  ModelComparisonResult, 
  ModelComparisonResultWithCache,
  transformToComparisonResultWithCache,
  transformToComparisonResultsWithCache
} from '@/types/scoring';
import { analyzeImageWithVision } from '@/utils/visionApi';
import { VisionApiData } from '@/types/vision';
import { isDevelopmentMode } from '@/utils/devMode';
import { saveScoreToCache, getScoreFromCache, logScoringError } from '@/utils/scoreCacheUtils';

/**
 * Score a single image using one or more scoring models
 */
export const scoreImage = async (
  file: File,
  options?: ScoringOptions
): Promise<ModelComparisonResultWithCache[]> => {
  // Early validation
  if (!file) {
    throw new Error('No file provided for scoring');
  }

  try {
    const isComparisonMode = options?.compareModels === true && Array.isArray(options?.modelsToCompare);
    
    // Comparing multiple models
    if (isComparisonMode && options?.modelsToCompare && options.modelsToCompare.length > 0) {
      const results: ModelComparisonResult[] = [];
      
      for (const model of options.modelsToCompare) {
        try {
          // Prepare options for this specific model
          const modelOptions = {
            ...options,
            scoringConfig: model,
            compareModels: false, // Prevent infinite loop
            modelsToCompare: undefined // Clear to prevent confusion
          };
          
          // Get cached score if available
          let cachedResult = null;
          
          if (!options.forceMock) {
            cachedResult = await getScoreFromCache(file, model.id);
          }
          
          let visionData: VisionApiData;
          let score: number;
          let cached = !!cachedResult;
          
          if (cachedResult) {
            // Use cached data
            visionData = cachedResult.data;
            score = cachedResult.score;
          } else {
            // Get fresh data
            visionData = await analyzeImageWithVision(file, modelOptions);
            // For demo, use a simplified score
            score = Math.round((visionData.labels?.length || 0) * 10 + Math.random() * 20);
            
            // Cache the result
            if (!options.forceMock && !isDevelopmentMode()) {
              await saveScoreToCache(file, model.id, score, visionData);
            }
          }
          
          results.push({
            modelId: model.id,
            modelName: model.name,
            score,
            visionData,
            weights: model.weights,
            version: model.version,
            executionTime: Math.random() * 2000, // Mock execution time between 0-2 seconds
            cached,
            modelVersion: model.version
          });
        } catch (error) {
          console.error(`Error scoring with model ${model.name}:`, error);
          
          // Log the error for analysis
          await logScoringError({
            error: error instanceof Error ? error.message : String(error),
            imageId: 'unknown',
            modelId: model.id,
            context: { 
              fileName: file.name, 
              fileSize: file.size, 
              compareMode: true 
            }
          });
          
          // Add fallback result
          results.push({
            modelId: model.id,
            modelName: model.name,
            score: 0,
            visionData: { error: error instanceof Error ? error.message : String(error) } as VisionApiData,
            weights: model.weights,
            version: model.version,
            executionTime: 0,
            cached: false,
            modelVersion: model.version
          });
        }
      }
      
      // Transform the results to ensure they match the expected type with all required fields
      return transformToComparisonResultsWithCache(results);
    } else {
      // Single model scoring - just use default configured model
      const visionData = await analyzeImageWithVision(file, options);
      const score = Math.round((visionData.labels?.length || 0) * 10 + Math.random() * 20);
      
      const result: ModelComparisonResult = {
        modelId: options?.scoringConfig?.id || 'default',
        modelName: options?.scoringConfig?.name || 'Default Model',
        score,
        visionData,
        weights: options?.scoringConfig?.weights,
        version: options?.scoringConfig?.version || '1.0',
        executionTime: Math.random() * 1000,
        cached: false,
        modelVersion: options?.scoringConfig?.version
      };
      
      // Since we're returning an array type, we need to wrap the single result
      // Transform the result to ensure it matches the expected type with all required fields
      return transformToComparisonResultsWithCache([result]);
    }
  } catch (error) {
    console.error('Error in scoreImage:', error);
    
    // Log the error
    await logScoringError({
      error: error instanceof Error ? error.message : String(error),
      imageId: 'unknown',
      modelId: 'unknown',
      context: { 
        fileName: file.name, 
        fileSize: file.size
      }
    });
    
    throw error;
  }
};
