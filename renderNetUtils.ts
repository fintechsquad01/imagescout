import { RenderNetConfig, RenderNetResponse } from '@/types/content';

// Helper to create a standardized error response
export const createErrorResponse = (
  prompt: string,
  modelId: string,
  error: unknown,
  prefix: string = 'error'
): RenderNetResponse => {
  return {
    id: `${prefix}-${Date.now()}`,
    prompt,
    imageUrl: '',
    model: modelId,
    error: error instanceof Error ? error.message : 'Unknown error',
    status: 'error',
    createdAt: new Date().toISOString(),
    cached: false
  };
};

// Parse and normalize API response data
export const parseRenderNetResponse = (
  data: any, 
  prompt: string, 
  modelId: string
): RenderNetResponse => {
  return {
    id: data.id || `gen-${Date.now()}`,
    prompt,
    imageUrl: data.image_url || data.url || '',
    model: modelId,
    status: data.status || 'success',
    createdAt: new Date().toISOString(),
    cached: Boolean(data.cached)
  };
};

// Create config for render net API
export const createRenderNetConfig = (
  config?: Partial<RenderNetConfig>,
  defaults: Partial<RenderNetConfig> = {}
): RenderNetConfig => {
  // Ensure model is required and has a default
  return {
    model: (config?.model || defaults.model || 'default-model'), // Ensure model is always defined
    temperature: config?.temperature || defaults.temperature || 0.7,
    maxTokens: config?.maxTokens || defaults.maxTokens || 1024,
    prompt: config?.prompt || defaults.prompt,
    systemPrompt: config?.systemPrompt || defaults.systemPrompt,
    imageId: config?.imageId || defaults.imageId,
    projectId: config?.projectId || defaults.projectId,
    userId: config?.userId || defaults.userId,
    endpoint: config?.endpoint || defaults.endpoint,
    apiKey: config?.apiKey || defaults.apiKey,
    skipCache: config?.skipCache || defaults.skipCache || false
  };
};

// Simple utility to create a generation log payload
export const createGenerationLogEntry = (
  imageId: string,
  projectId: string,
  prompt: string,
  model: string,
  result: RenderNetResponse,
  startTime?: number
) => {
  const executionTime = startTime ? Date.now() - startTime : undefined;
  
  return {
    imageId,
    projectId,
    prompt,
    model,
    success: result.status === 'success',
    executionTime,
    error: result.error
  };
};

// Simplify a prompt by removing style instructions and details
export const simplifyPrompt = (prompt: string): string => {
  const withoutStyle = prompt.replace(/in (the style of|a|an) [^,.]+[,.]?/gi, '');
  const withoutDetails = withoutStyle.replace(/with [^,.]+[,.]?/gi, '');
  const words = withoutDetails.split(' ');
  const simplified = words.slice(0, Math.min(15, words.length)).join(' ');
  return simplified.trim() || prompt.trim();
};

// Helper for downloading images
export const downloadGeneratedImage = (imageUrl: string | undefined): void => {
  if (!imageUrl) {
    return;
  }
  
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = `generated-image-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
