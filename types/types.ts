
// This file is kept for backward compatibility
// New code should import from the specific type files

import { 
  ScoredImage as ScoringImage,
  ScoringOptions, 
  ModelComparisonResult, 
  ModelComparisonResultWithCache,
  ScoreCacheEntry,
  CachedStatus, 
  ScoreCacheLog, 
  ScoringErrorEntry, 
  ScoringLogFilters
} from './scoring';
import { VisionApiData as VisionData, VisionApiOptions } from './vision';
import { ContentSuggestion, AIModel, RenderNetResponse, PromptHistoryItem } from './content';
import { FeedbackFormData, FeedbackData } from './feedback';
import { PlanType, getSafePlanType, getPlanDisplayName } from './ui';
import { 
  Project, ImageFile, RoleType, UploadStats, 
  UploadLogPayload, GenerationLogPayload 
} from './project';

// Ensure compatibility by using the same interface from scoring.ts
export interface ScoredImage extends ScoringImage {
  // No need to override properties since they match now
}

// Re-export all types for backwards compatibility
export type {
  VisionData as VisionApiData,
  VisionApiOptions,
  ContentSuggestion,
  AIModel,
  RenderNetResponse,
  PromptHistoryItem,
  FeedbackFormData,
  FeedbackData,
  Project,
  ImageFile,
  RoleType,
  UploadStats,
  UploadLogPayload,
  GenerationLogPayload,
  ScoringOptions,
  ModelComparisonResult,
  ModelComparisonResultWithCache,
  ScoreCacheEntry,
  CachedStatus,
  ScoreCacheLog,
  ScoringErrorEntry,
  ScoringLogFilters
};

export { PlanType, getSafePlanType, getPlanDisplayName };
