
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  userId?: string;
  isDefault?: boolean;
  test?: boolean;
  status?: string;  // Add status field
}

export type RoleType = 'admin' | 'user' | 'internal' | 'tester' | 'guest';

export interface UploadStats {
  dailyUploads: number;
  maxUploads: number;
  remainingUploads: number;
  maxDailyUploads?: number; // Added for compatibility
}

export interface UploadLogPayload {
  userId?: string;
  projectId: string;
  count: number;
  imageIds?: string[];
  test?: boolean;
  image_count?: number; // For compatibility
  project_id?: string; // For compatibility
}

export interface ImageFile extends File {
  preview: string;
  id: string;
}

export interface GenerationLogPayload {
  userId?: string;
  projectId: string;
  imageId: string;
  prompt: string;
  model: string;
  success: boolean;
  executionTime?: number;  // Make executionTime explicitly optional
  error?: string;
  test?: boolean;
  // Legacy compatibility fields
  image_id?: string;
  project_id?: string;
  model_used?: string;
  prompt_used?: string;
  retry_used?: boolean;
  result_url?: string;
  error_message?: string;
  duration?: number; // For backward compatibility
}

// Create a utility function to safely create GenerationLogPayload with optional fields
export function createGenerationLogPayload(data: Omit<GenerationLogPayload, 'executionTime'> & { executionTime?: number }): GenerationLogPayload {
  const payload: GenerationLogPayload = {
    userId: data.userId,
    projectId: data.projectId,
    imageId: data.imageId,
    prompt: data.prompt,
    model: data.model,
    success: data.success,
    error: data.error,
    test: data.test,
    // Include legacy fields if provided
    image_id: data.image_id,
    project_id: data.project_id,
    model_used: data.model_used,
    prompt_used: data.prompt_used,
    retry_used: data.retry_used,
    result_url: data.result_url,
    error_message: data.error_message
  };
  
  // Only add executionTime if it's present
  if (typeof data.executionTime === 'number') {
    payload.executionTime = data.executionTime;
  }
  
  return payload;
}

// Mapping functions for Supabase 
export function mapGenerationLogToSupabase(data: GenerationLogPayload): any {
  return {
    user_id: data.userId,
    project_id: data.projectId || data.project_id,
    image_id: data.imageId || data.image_id,
    prompt: data.prompt || data.prompt_used,
    model: data.model || data.model_used,
    success: data.success,
    execution_time: data.executionTime,  // Add mapping for executionTime
    error: data.error || data.error_message,
    result_url: data.result_url,
    retry_used: data.retry_used,
    test: data.test
  };
}

export function mapProjectFromSupabase(data: any): Project {
  return {
    id: data.id,
    name: data.name,
    description: data.description,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    userId: data.user_id,
    isDefault: data.is_default,
    test: data.test
  };
}

export function mapProjectToSupabase(data: Partial<Project>): any {
  return {
    name: data.name,
    description: data.description,
    user_id: data.userId,
    is_default: data.isDefault,
    test: data.test
  };
}
