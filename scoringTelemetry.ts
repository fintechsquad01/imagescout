
import { getSupabaseClient } from '@/lib/supabaseLogger';
import { isDevelopmentMode } from './devMode';

interface ScoreSuccessParams {
  imageName: string;
  imageSize: number;
  projectId?: string;
  userId?: string;
  responseTimeMs: number;
  isMock?: boolean;
  isTest?: boolean;
  retryCount: number;
  modelName?: string;
  scoringModel?: string; // Added scoring model support
}

interface ScoreFailureParams {
  imageName: string;
  imageSize: number;
  projectId?: string;
  userId?: string;
  responseTimeMs: number;
  errorMessage: string;
  isMock?: boolean;
  isTest?: boolean;
  retryCount: number;
  modelName?: string;
  scoringModel?: string; // Added scoring model support
}

/**
 * Log a successful score event to Supabase
 */
export async function logScoreSuccess(params: ScoreSuccessParams): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    // Skip if we're in dev mode and don't have Supabase credentials
    if (isDevelopmentMode() && (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
      console.log('[DEV MODE] Would log score success:', params);
      return;
    }
    
    const { data, error } = await supabase
      .from('scoring_logs')
      .insert([{
        image_name: params.imageName,
        image_size: params.imageSize,
        project_id: params.projectId,
        user_id: params.userId,
        response_time_ms: params.responseTimeMs,
        is_mock: params.isMock || false,
        is_test: params.isTest || false,
        retry_count: params.retryCount,
        model_name: params.modelName || params.scoringModel || 'default',
        status: 'success'
      }]);
      
    if (error) {
      console.error('Error logging score success:', error);
    }
  } catch (error) {
    console.error('Failed to log score success:', error);
  }
}

/**
 * Log a failed score event to Supabase
 */
export async function logScoreFailure(params: ScoreFailureParams): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    // Skip if we're in dev mode and don't have Supabase credentials
    if (isDevelopmentMode() && (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
      console.log('[DEV MODE] Would log score failure:', params);
      return;
    }
    
    const { data, error } = await supabase
      .from('scoring_logs')
      .insert([{
        image_name: params.imageName,
        image_size: params.imageSize,
        project_id: params.projectId,
        user_id: params.userId,
        response_time_ms: params.responseTimeMs,
        is_mock: params.isMock || false,
        is_test: params.isTest || false,
        retry_count: params.retryCount,
        model_name: params.modelName || params.scoringModel || 'default',
        status: 'error',
        error_message: params.errorMessage
      }]);
      
    if (error) {
      console.error('Error logging score failure:', error);
    }
  } catch (error) {
    console.error('Failed to log score failure:', error);
  }
}

/**
 * Log a generic scoring event
 */
export function logScoringEvent(event: string, details: any): void {
  // Skip for non-dev mode
  if (!isDevelopmentMode()) return;
  
  console.log(`[SCORING EVENT] ${event}:`, details);
}

/**
 * Get scoring stats
 */
export async function getScoringStats(): Promise<{
  totalScores: number;
  successRate: number;
  avgResponseTime: number;
  mockPercentage: number;
}> {
  try {
    const supabase = getSupabaseClient();
    
    // Skip if we're in dev mode and don't have Supabase credentials
    if (isDevelopmentMode() && (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
      return getMockScoringStats();
    }
    
    // Get all scoring logs
    const { data, error } = await supabase
      .from('scoring_logs')
      .select('*');
      
    if (error) {
      console.error('Error fetching scoring logs:', error);
      return getMockScoringStats();
    }
    
    // Calculate stats
    const totalScores = data.length;
    const successCount = data.filter(log => log.status === 'success').length;
    const successRate = totalScores > 0 ? (successCount / totalScores) * 100 : 0;
    
    // Calculate average response time
    const responseTimes = data.map(log => log.response_time_ms);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;
    
    // Calculate mock percentage
    const mockCount = data.filter(log => log.is_mock).length;
    const mockPercentage = totalScores > 0 ? (mockCount / totalScores) * 100 : 0;
    
    return {
      totalScores,
      successRate,
      avgResponseTime,
      mockPercentage
    };
  } catch (error) {
    console.error('Failed to get scoring stats:', error);
    return getMockScoringStats();
  }
}

/**
 * Get mock scoring stats for development
 */
export function getMockScoringStats(): {
  totalScores: number;
  successRate: number;
  avgResponseTime: number;
  mockPercentage: number;
} {
  return {
    totalScores: Math.floor(Math.random() * 100) + 50,
    successRate: Math.random() * 10 + 90, // 90-100%
    avgResponseTime: Math.random() * 500 + 100, // 100-600ms
    mockPercentage: Math.random() * 40 + 30 // 30-70%
  };
}
