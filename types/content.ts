
// Add or ensure RenderNetResponse is exported from this file
export interface RenderNetResponse {
  id: string;
  model: string;
  status: 'success' | 'error' | 'pending';
  cached?: boolean;
  error?: string;
  imageUrl?: string;
  prompt?: string;
  // Add createdAt to resolve the build errors in renderNetApi and renderNetUtils
  createdAt?: string;
  // Add other properties that might be needed
  endpoint?: string;
  apiKey?: string;
}

// RenderNetConfig type definition
export interface RenderNetConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  prompt?: string;
  systemPrompt?: string;
  imageId?: string;
  projectId?: string;
  userId?: string;
  // Add properties to resolve build errors
  endpoint?: string;
  apiKey?: string;
  skipCache?: boolean;
}

// Helper functions for prompt history mapping
export const mapPromptHistoryFromSupabase = (data: any): PromptHistoryItem => {
  return {
    id: data.id || '',
    prompt: data.prompt || '',
    model: data.model || '',
    createdAt: data.created_at || new Date().toISOString(),
    userId: data.user_id,
    projectId: data.project_id,
    imageId: data.image_id,
    result: data.result,
    metadata: data.metadata || {},
    favorite: data.favorite || false,
    tags: data.tags || [],
    modelUsed: data.model_used || data.model || '',
    imageUrl: data.image_url || '',
    success: data.success === undefined ? true : data.success
  };
};

export const mapPromptHistoryToSupabase = (item: Omit<PromptHistoryItem, "id" | "createdAt">) => {
  return {
    prompt: item.prompt,
    model: item.model,
    user_id: item.userId,
    project_id: item.projectId,
    image_id: item.imageId,
    result: item.result,
    metadata: item.metadata || {},
    favorite: item.favorite || false,
    tags: item.tags || [],
    model_used: item.modelUsed || item.model,
    image_url: item.imageUrl || '',
    success: item.success === undefined ? true : item.success
  };
};

// ContentSuggestion interface update to include required fields
export interface ContentSuggestion {
  id: string;
  text: string;
  type: string;
  score?: number;
  metadata?: {
    model?: string;
    prompt?: string;
    temperature?: number;
    tokens?: number;
  };
  createdAt?: string;
  selected?: boolean;
  title?: string;
  description?: string;
  platforms?: string[];
  prompt?: string;
  test?: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description?: string;
  capabilities?: string[];
  maxTokens?: number;
  contextWindow?: number;
  pricing?: {
    input?: number;
    output?: number;
    unit?: string;
  };
  available: boolean;
  version?: string;
  releaseDate?: string;
  category?: 'text' | 'image' | 'audio' | 'multimodal';
  features?: string[];
  icon?: string;
  explanation?: string;
  suitableFor?: string[];
}

export interface PromptHistoryItem {
  id: string;
  prompt: string;
  model: string;
  createdAt: string;
  userId?: string;
  projectId?: string;
  imageId?: string;
  result?: string;
  metadata?: any;
  favorite?: boolean;
  tags?: string[];
  modelUsed?: string;
  imageUrl?: string;
  success?: boolean;
}
