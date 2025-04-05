
/**
 * Type definitions and utility functions for interacting with the score-image Edge Function
 */

// Type definitions for Edge Function requests and responses
export interface RequestData {
  image: string; // base64 encoded image
  metadata: {
    filename: string;
    width: number;
    height: number;
    size: number;
    type: string;
    projectId?: string;
    userId?: string;
  };
  test_mode?: boolean; // Flag for test requests
}

export interface VisionApiData {
  labels: string[];
  colors: string[];
  objects: string[];
  landmarks: string[];
  safeSearch: {
    adult: string;
    violence: string;
    racy: string;
  };
}

/**
 * Generate deterministic mock vision data based on filename
 * Used for testing and development without API calls
 */
export function generateMockVisionData(filename: string): VisionApiData {
  // Use filename to generate deterministic but varied mock data
  const hash = filename.split('').reduce((a, b) => {
    return a + b.charCodeAt(0);
  }, 0);
  
  const mockLabelSets = [
    ['person', 'outdoor', 'nature', 'landscape', 'mountain'],
    ['dog', 'animal', 'pet', 'mammal', 'canine'],
    ['food', 'meal', 'restaurant', 'cuisine', 'dish'],
    ['building', 'architecture', 'urban', 'city', 'skyline'],
    ['beach', 'ocean', 'water', 'sand', 'coast']
  ];
  
  const mockColors = [
    ['rgb(42, 75, 153)', 'rgb(89, 156, 231)', 'rgb(235, 245, 251)'],
    ['rgb(67, 122, 50)', 'rgb(120, 173, 59)', 'rgb(238, 240, 214)'],
    ['rgb(153, 42, 42)', 'rgb(231, 89, 89)', 'rgb(251, 235, 235)'],
    ['rgb(42, 42, 42)', 'rgb(120, 120, 120)', 'rgb(200, 200, 200)'],
    ['rgb(201, 148, 21)', 'rgb(247, 202, 24)', 'rgb(253, 235, 180)']
  ];
  
  const setIndex = hash % mockLabelSets.length;
  
  return {
    labels: mockLabelSets[setIndex],
    colors: mockColors[setIndex],
    objects: mockLabelSets[setIndex].slice(0, 2),
    landmarks: [],
    safeSearch: {
      adult: 'VERY_UNLIKELY',
      violence: 'UNLIKELY',
      racy: 'UNLIKELY'
    }
  };
}

/**
 * Create a test payload for the score-image Edge Function
 */
export function createTestPayload(
  base64Data: string,
  metadata: {
    filename: string;
    width: number;
    height: number;
    size: number;
    type: string;
    projectId?: string;
    userId?: string;
  }
): RequestData {
  return {
    image: base64Data,
    metadata,
    test_mode: true
  };
}
