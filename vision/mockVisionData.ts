
import { VisionApiData } from '@/types/vision';

/**
 * Get mock vision data for development and testing
 */
export const getMockVisionData = (): VisionApiData => {
  return {
    labels: [
      'Technology',
      'Computer',
      'Electronic device',
      'Laptop',
      'Display device'
    ],
    objects: [
      'Laptop',
      'Screen',
      'Keyboard'
    ],
    landmarks: [],
    colors: [
      'rgb(42, 75, 153)',
      'rgb(89, 156, 231)',
      'rgb(24, 23, 19)'
    ],
    safeSearch: {
      adult: 'VERY_UNLIKELY',
      violence: 'VERY_UNLIKELY',
      racy: 'VERY_UNLIKELY'
    }
  };
};
