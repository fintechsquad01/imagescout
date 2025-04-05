
import { 
  ModelComparisonResult,
  ModelComparisonResultWithCache,
  BatchScoringResult
} from '@/types/scoring';

// Import RenderNetResponse from the right location
import { RenderNetResponse } from '@/types/content';

/**
 * Function to convert RenderNetResponse to BatchScoringResult
 */
export function mapResponseToScoringResult(
  response: RenderNetResponse | undefined, 
  filename: string
): BatchScoringResult {
  // If response is undefined, return error result
  if (!response) {
    return {
      id: `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      filename,
      model: 'unknown',
      score: null,
      status: 'error',
      cached: false,
      error: 'No response received from scoring service'
    };
  }
  
  // Map response to BatchScoringResult with safe defaults
  return {
    id: response.id || `result-${Date.now()}`,
    filename,
    model: response.model,
    // Mock score for demonstration
    score: response.status === 'success' ? 85 : null,
    status: (response.status as 'success' | 'error' | 'pending') || 'error',
    cached: Boolean(response.cached),
    error: response.error,
    imageUrl: response.imageUrl
  };
}

/**
 * Helper function to transform ModelComparisonResult to ModelComparisonResultWithCache
 */
export function transformToComparisonResultWithCache(result: ModelComparisonResult): ModelComparisonResultWithCache {
  return {
    ...result,
    cached: result.cached || false,
    weights: result.weights || { 
      labels: 1,
      objects: 1,
      landmarks: 1, 
      colors: 1,
      baseScore: 10,
      maxScore: 100
    },
    version: result.version || result.modelVersion || '1.0',
    cacheStatus: result.cached ? {
      fromCache: true,
      cacheDate: new Date().toISOString(),
      cacheKey: `cache_${result.modelId}`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    } : undefined
  };
}

/**
 * Function to transform array of results
 */
export function transformToComparisonResultsWithCache(results: ModelComparisonResult[]): ModelComparisonResultWithCache[] {
  return results.map(transformToComparisonResultWithCache);
}
