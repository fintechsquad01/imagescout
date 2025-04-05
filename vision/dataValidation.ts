
import { VisionApiData } from '@/types/vision';

/**
 * Validate vision data for critical fields and completeness
 */
export const validateVisionData = (visionData: VisionApiData | null): {
  isValid: boolean;
  missingFields: string[];
  hasSafetyData: boolean;
} => {
  if (!visionData) {
    return {
      isValid: false,
      missingFields: ['entire visionData object'],
      hasSafetyData: false
    };
  }
  
  const missingFields = [];
  
  if (!Array.isArray(visionData.labels)) missingFields.push('labels');
  if (!Array.isArray(visionData.objects)) missingFields.push('objects');
  if (!Array.isArray(visionData.landmarks)) missingFields.push('landmarks');
  if (!Array.isArray(visionData.colors)) missingFields.push('colors');
  
  const hasSafetyData = !!visionData.safeSearch;
  if (!hasSafetyData) missingFields.push('safeSearch');
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
    hasSafetyData
  };
};
