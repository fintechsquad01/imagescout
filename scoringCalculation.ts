
import { VisionApiData } from '@/types/vision';

/**
 * Calculate the opportunity score based on vision data and scoring configuration
 * 
 * @param visionData Vision API analysis results
 * @param scoringConfig Scoring model configuration with weights
 * @returns Numerical score
 */
export function calculateOpportunityScore(
  visionData: VisionApiData | null | undefined, 
  scoringConfig: any | null | undefined
): number {
  if (!visionData || !scoringConfig) {
    return 0;
  }

  // Default weights if configuration is incomplete
  const weights = scoringConfig.weights || {
    baseScore: 10,
    labels: 1,
    objects: 1,
    landmarks: 1,
    colors: 1,
    maxScore: 100
  };

  // Calculate component scores
  const baseScore = weights.baseScore || 0;
  const labelScore = Math.min((visionData.labels?.length || 0) * weights.labels, 25);
  const objectScore = Math.min((visionData.objects?.length || 0) * weights.objects, 20);
  const landmarkScore = (visionData.landmarks?.length || 0) * weights.landmarks;
  const colorScore = Math.min((visionData.colors?.length || 0) * weights.colors, 15);

  // Calculate total score with cap at maxScore
  let totalScore = baseScore + labelScore + objectScore + landmarkScore + colorScore;
  totalScore = Math.min(totalScore, weights.maxScore || 100);
  totalScore = Math.max(0, totalScore); // Ensure non-negative

  return Math.round(totalScore);
}

/**
 * Calculate weights for different content aspects based on vision data
 * 
 * @param visionData Vision API analysis results
 * @returns Object with weights for different content aspects
 */
export function calculateContentWeights(visionData: VisionApiData | null | undefined): Record<string, number> {
  if (!visionData) {
    return {
      descriptive: 0.5,
      technical: 0.5,
      emotional: 0.5,
      locationBased: 0.5
    };
  }

  // Calculate descriptive weight based on labels and objects
  const descriptive = Math.min(
    0.9, 
    0.3 + ((visionData.labels?.length || 0) * 0.05)
  );

  // Calculate technical weight based on objects
  const technical = Math.min(
    0.8,
    0.2 + ((visionData.objects?.length || 0) * 0.06)
  );

  // Calculate emotional weight based on faces and colors
  const hasFaces = (visionData.faces?.length || 0) > 0;
  const emotional = Math.min(
    0.85,
    0.3 + (hasFaces ? 0.3 : 0) + ((visionData.colors?.length || 0) * 0.04)
  );

  // Calculate location weight based on landmarks
  const locationBased = Math.min(
    0.8,
    0.1 + ((visionData.landmarks?.length || 0) * 0.15)
  );

  return {
    descriptive,
    technical,
    emotional,
    locationBased
  };
}

/**
 * Determine primary content type based on vision data
 * 
 * @param visionData Vision API analysis results
 * @returns Primary content type as string
 */
export function determinePrimaryContentType(visionData: VisionApiData | null | undefined): string {
  if (!visionData) {
    return 'descriptive';
  }

  // Get content weights
  const weights = calculateContentWeights(visionData);
  
  // Find the content type with the highest weight
  const contentTypes = Object.keys(weights);
  const primaryType = contentTypes.reduce((a, b) => {
    return weights[a] > weights[b] ? a : b;
  });
  
  return primaryType;
}
