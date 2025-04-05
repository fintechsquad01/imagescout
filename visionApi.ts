
import { toast } from "@/components/ui/use-toast";
import { VisionApiData } from "@/types/types";
import { scoreImage } from "@/services/imageScoring";
import { isDevelopmentMode } from '@/utils/devMode';
import { getEnvSummary } from '@/utils/envValidation';
import { logScoreSuccess, logScoreFailure } from '@/utils/scoringTelemetry';
import { ScoringConfig, DEFAULT_SCORING_CONFIG } from '@/types/scoring-config';
import { calculateOpportunityScore, calculateContentWeights, determinePrimaryContentType } from './scoringCalculation';
import { checkContentSafety } from './vision/safetyUtils';
import { validateVisionData } from './vision/dataValidation';
import { getImageAnalysisStatus } from './vision/statusUtils';
import { getMockVisionData } from './vision/mockVisionData';
import { VisionApiOptions } from './vision/visionTypes';

/**
 * VisionScoring namespace containing all vision scoring related functions
 */
export const VisionScoring = {
  /**
   * Analyze an image using our scoring service
   */
  analyzeImage: async (
    imageFile: File, 
    options: VisionApiOptions = {}
  ): Promise<VisionApiData> => {
    try {
      return await analyzeImageWithVision(imageFile, options);
    } catch (error) {
      console.error("Error in VisionScoring.analyzeImage:", error);
      // Return safe fallback data instead of throwing
      return {
        labels: [],
        objects: [],
        landmarks: [],
        colors: [],
        safeSearch: {
          adult: 'UNKNOWN',
          violence: 'UNKNOWN',
          racy: 'UNKNOWN'
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },
  
  /**
   * Calculate opportunity score based on vision data
   */
  calculateScore: (
    visionData: VisionApiData | null,
    scoringConfig: ScoringConfig = DEFAULT_SCORING_CONFIG
  ): number => {
    try {
      return calculateOpportunityScore(visionData, scoringConfig);
    } catch (error) {
      console.error("Error in VisionScoring.calculateScore:", error);
      // Return safe fallback score
      return scoringConfig.weights.baseScore;
    }
  },
  
  /**
   * Check if image contains inappropriate content based on safeSearch
   */
  checkSafety: (visionData: VisionApiData | null): boolean => {
    try {
      return checkContentSafety(visionData);
    } catch (error) {
      console.error("Error in VisionScoring.checkSafety:", error);
      // Assume safe by default on error
      return true;
    }
  },
  
  /**
   * Validate vision data for critical fields and completeness
   */
  validateData: (visionData: VisionApiData | null): {
    isValid: boolean;
    missingFields: string[];
    hasSafetyData: boolean;
  } => {
    try {
      return validateVisionData(visionData);
    } catch (error) {
      console.error("Error in VisionScoring.validateData:", error);
      // Return safe fallback validation result
      return {
        isValid: false,
        missingFields: ['error during validation'],
        hasSafetyData: false
      };
    }
  },
  
  /**
   * Get environment status for image analysis features
   */
  getStatus: () => {
    try {
      return getImageAnalysisStatus();
    } catch (error) {
      console.error("Error in VisionScoring.getStatus:", error);
      // Return safe fallback status
      return {
        available: false,
        usingEdgeFunctions: false,
        usingRealScoring: false,
        inTestMode: isDevelopmentMode(),
        environment: 'unknown'
      };
    }
  },
  
  /**
   * Get mock vision data for development and testing
   */
  getMockData: getMockVisionData
};

/**
 * Analyze an image using our scoring service
 * @deprecated Use VisionScoring.analyzeImage instead
 */
export const analyzeImageWithVision = async (
  imageFile: File, 
  options: VisionApiOptions = {}
): Promise<VisionApiData> => {
  const startTime = performance.now();
  
  try {
    if (!imageFile) {
      throw new Error('No image file provided');
    }
    
    const { debugInfo = isDevelopmentMode() } = options;
    
    // Log analysis attempt in dev mode
    if (debugInfo) {
      const envSummary = getEnvSummary();
      console.log(
        `[Vision API] Analyzing image: ${imageFile.name} (${imageFile.size} bytes)`,
        `Environment: ${envSummary.env}`,
        `Using Edge Functions: ${envSummary.useEdgeFunctions}`,
        `Real Scoring Enabled: ${envSummary.useRealScoring}`,
        `Force Mock: ${options.forceMock ? 'Yes' : 'No'}`,
        `Scoring Config: ${options.scoringConfig?.model || 'default'}`
      );
    }
    
    // Call the scoring service with full options including projectId and mock flag
    const result = await scoreImage(imageFile, { 
      projectId: options.projectId, 
      userId: options.userId,
      forceMock: options.forceMock || isDevelopmentMode(),
      logTelemetry: options.logTelemetry ?? true, // Enable telemetry by default
      scoringConfig: options.scoringConfig || DEFAULT_SCORING_CONFIG,
      compareModels: options.compareModels,
      modelsToCompare: options.modelsToCompare,
      skipCache: options.skipCache,
      imageId: options.imageId
    });
    
    // Handle array results (from comparison) or single result
    const visionData = Array.isArray(result) && result.length > 0 
      ? result[0].visionData 
      : result as VisionApiData;
    
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    // Log successful analysis in dev mode
    if (debugInfo) {
      console.log(
        `[Vision API] Analysis complete in ${responseTime}ms:`,
        `Labels: ${visionData.labels?.length || 0}`,
        `Objects: ${visionData.objects?.length || 0}`,
        `Landmarks: ${visionData.landmarks?.length || 0}`,
        `Colors: ${visionData.colors?.length || 0}`,
        `Model: ${options.scoringConfig?.model || 'default'}`
      );
    }
    
    return visionData;
  } catch (error) {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);
    
    console.error("Error analyzing image:", error);
    
    // Only show toast in non-dev mode to avoid excessive notifications during development
    if (!isDevelopmentMode()) {
      toast({
        variant: "destructive",
        title: "Metadata Analysis Failed",
        description: "We couldn't extract image metadata. Using basic scoring instead."
      });
    }
    
    // Log error details in dev mode
    if (isDevelopmentMode()) {
      console.error("[Vision API] Analysis error details:", error);
    }
    
    // Return default structure with required fields for graceful fallback
    return {
      labels: [],
      colors: [],
      objects: [],
      landmarks: [],
      safeSearch: {
        adult: "UNLIKELY",
        violence: "UNLIKELY",
        racy: "UNLIKELY"
      }
    };
  }
};

// Export types for clearer developer experience
export type { VisionApiData, VisionApiOptions };

// Re-export functions from modules for backward compatibility
export { checkContentSafety } from './vision/safetyUtils';
export { validateVisionData } from './vision/dataValidation';
export { getImageAnalysisStatus } from './vision/statusUtils';
export { calculateOpportunityScore, calculateContentWeights, determinePrimaryContentType } from './scoringCalculation';
