
import { VisionApiData } from '@/types/vision';

// Re-export the types from the central types file
export type { VisionApiData };

// Vision API options
export interface VisionApiOptions {
  projectId?: string;
  userId?: string;
  forceMock?: boolean;
  logTelemetry?: boolean;
  debugInfo?: boolean;
  scoringConfig?: any;
  compareModels?: boolean;
  modelsToCompare?: any[];
  skipCache?: boolean;
  imageId?: string;
  test?: boolean;
}
