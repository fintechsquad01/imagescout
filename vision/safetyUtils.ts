
import { VisionApiData } from '@/types/vision';

/**
 * Check if image contains inappropriate content based on safeSearch
 */
export const checkContentSafety = (visionData: VisionApiData | null): boolean => {
  if (!visionData || !visionData.safeSearch) return true;
  
  const { adult, violence, racy } = visionData.safeSearch;
  
  // Check for high likelihood ratings in any safety category
  const unsafeRatings = ['LIKELY', 'VERY_LIKELY'];
  
  return !(
    unsafeRatings.includes(adult ?? '') || 
    unsafeRatings.includes(violence ?? '') || 
    unsafeRatings.includes(racy ?? '')
  );
};
