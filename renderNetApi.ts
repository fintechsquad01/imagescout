
import { supabase } from '@/lib/supabase';
import { isDevelopmentMode } from '@/utils/devMode';
import { RenderNetConfig, RenderNetResponse } from '@/types/content';

// Default endpoint if not configured
const DEFAULT_ENDPOINT = 'https://api.rendernetai.com/v1/generate';

// Generate content using RenderNet API
export const generateImage = async (
  prompt: string, 
  modelId: string,
  config?: RenderNetConfig
): Promise<RenderNetResponse> => {
  const endpoint = config?.endpoint || process.env.RENDER_NET_ENDPOINT || DEFAULT_ENDPOINT;
  const apiKey = config?.apiKey || process.env.RENDER_NET_API_KEY;
  
  // For development mode, return a mock response
  if (isDevelopmentMode() || !apiKey) {
    console.log('Development mode or missing API key, returning mock response');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate failure 15% of the time
    const shouldFail = Math.random() < 0.15;
    
    if (shouldFail) {
      return {
        id: `mock-${Date.now()}`,
        prompt,
        imageUrl: '',
        model: modelId,
        error: 'Simulated API failure',
        status: 'error',
        createdAt: new Date().toISOString(),
        cached: false
      };
    }
    
    // Return mock success response
    return {
      id: `mock-${Date.now()}`,
      prompt,
      imageUrl: `https://picsum.photos/seed/${Date.now()}/800/600`,
      model: modelId,
      status: 'success',
      createdAt: new Date().toISOString(),
      cached: Math.random() > 0.7 // 30% chance of being cached
    };
  }
  
  try {
    // Make API request to RenderNet
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        prompt,
        model: modelId,
        // Additional params can be added here
      })
    });
    
    // Check if response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error('RenderNet API error:', errorText);
      
      return {
        id: `error-${Date.now()}`,
        prompt,
        imageUrl: '',
        model: modelId,
        error: `API Error: ${response.status} - ${errorText}`,
        status: 'error',
        createdAt: new Date().toISOString(),
        cached: false
      };
    }
    
    // Parse response
    const data = await response.json();
    
    // Return formatted response
    return {
      id: data.id || `gen-${Date.now()}`,
      prompt,
      imageUrl: data.image_url || data.url || '',
      model: modelId,
      status: data.status || 'success',
      createdAt: new Date().toISOString(),
      cached: Boolean(data.cached)
    };
  } catch (error) {
    console.error('RenderNet API request failed:', error);
    
    return {
      id: `error-${Date.now()}`,
      prompt,
      imageUrl: '',
      model: modelId,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'error',
      createdAt: new Date().toISOString(),
      cached: false
    };
  }
};
