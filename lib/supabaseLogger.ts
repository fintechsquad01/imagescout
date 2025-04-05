
// Re-export all logging functions from their respective modules
export { logImageUpload, getUploadStats } from './logger/uploadLogger';
export { logGenerationResult, logToSupabase, logPromptHistory } from './logger/generationLogger';
export { getCurrentUserProjects, createProject } from './logger/projectLogger';
export { handleLoggingError, sanitizePayload, getSupabaseClient, getCurrentUserId } from './logger/loggerUtils';

// Additional type re-exports for convenience
export type { 
  GenerationLogPayload, 
  UploadLogPayload, 
  UploadStats 
} from '@/types/project';

export type {
  PromptHistoryItem
} from '@/types/content';

export type {
  ScoringFeedbackPayload,
  ScoringFeedbackItem,
  ScoringExportItem
} from '@/types/feedback';

// Note: This file serves as a centralized hub for importing logging functions
// while allowing the actual implementation to be split into smaller, focused files
