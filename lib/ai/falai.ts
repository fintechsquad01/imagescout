import { isDevelopmentMode } from '@/utils/devMode';

// Types for Fal.ai API
export interface FalAiVideoOptions {
  imageUrl?: string;
  imageBase64?: string;
  motionType: 'zoom' | 'pan' | 'parallax' | 'ken-burns' | 'subtle';
  duration: number; // in seconds
  focusPoints?: string[];
  transitionStyle?: 'smooth' | 'bounce' | 'ease' | 'linear';
  audioTrack?: string;
  outputFormat?: 'mp4' | 'gif';
  resolution?: '720p' | '1080p';
  apiKey?: string;
  mockResponse?: boolean;
}

export interface FalAiVideoResult {
  success: boolean;
  error?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  metadata: {
    processingTime: number;
    model: string;
    duration: number;
    resolution: string;
    fileSize?: number;
  };
}

// Mock data for development mode
const getMockVideoResult = (options: FalAiVideoOptions): FalAiVideoResult => {
  // Generate a random video URL for development
  const videoId = Math.floor(Math.random() * 1000000);
  
  return {
    success: true,
    videoUrl: `https://storage.googleapis.com/falai-mock-videos/video-${videoId}.mp4`,
    thumbnailUrl: `https://storage.googleapis.com/falai-mock-videos/thumb-${videoId}.jpg`,
    metadata: {
      processingTime: Math.floor(Math.random() * 3000) + 2000,
      model: 'image-to-video-v1',
      duration: options.duration,
      resolution: options.resolution || '720p',
      fileSize: Math.floor(Math.random() * 5000000) + 1000000
    }
  };
};

/**
 * Transform an image into a video using Fal.ai
 */
export const createVideoFromImage = async (
  options: FalAiVideoOptions
): Promise<FalAiVideoResult> => {
  const startTime = performance.now();
  
  // Use mock response in development mode or if explicitly requested
  if (isDevelopmentMode() || options.mockResponse) {
    console.log('[Fal.ai] Using mock response for development');
    
    // Add artificial delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const mockResult = getMockVideoResult(options);
    return mockResult;
  }
  
  try {
    // Get API key from options or environment
    const apiKey = options.apiKey || process.env.FALAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Fal.ai API key is required');
    }
    
    if (!options.imageUrl && !options.imageBase64) {
      throw new Error('Either imageUrl or imageBase64 is required');
    }
    
    // Construct the API request
    const requestBody = {
      image: options.imageUrl || `data:image/jpeg;base64,${options.imageBase64}`,
      motion_type: options.motionType,
      duration: options.duration,
      focus_points: options.focusPoints || [],
      transition_style: options.transitionStyle || 'smooth',
      audio_track: options.audioTrack,
      output_format: options.outputFormat || 'mp4',
      resolution: options.resolution || '720p'
    };
    
    // Make API request to Fal.ai
    const response = await fetch('https://api.fal.ai/image-to-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Fal.ai API error: ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.video_url) {
      throw new Error('No video URL in Fal.ai response');
    }
    
    const endTime = performance.now();
    const processingTime = Math.round(endTime - startTime);
    
    return {
      success: true,
      videoUrl: data.video_url,
      thumbnailUrl: data.thumbnail_url,
      metadata: {
        processingTime,
        model: data.model || 'image-to-video-v1',
        duration: options.duration,
        resolution: options.resolution || '720p',
        fileSize: data.file_size
      }
    };
    
  } catch (error) {
    console.error('[Fal.ai] Video creation error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      metadata: {
        processingTime: Math.round(performance.now() - startTime),
        model: 'image-to-video-v1',
        duration: options.duration,
        resolution: options.resolution || '720p'
      }
    };
  }
};

/**
 * Transform an image for a specific platform using Fal.ai
 */
export const optimizeImageForPlatform = async (
  imageUrl: string,
  platform: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter',
  apiKey?: string
): Promise<string> => {
  // In development mode, return a mock URL
  if (isDevelopmentMode()) {
    console.log(`[Fal.ai] Using mock response for ${platform} optimization`);
    
    // Add artificial delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Return the original URL with a query parameter to simulate optimization
    return `${imageUrl}?platform=${platform}&optimized=true`;
  }
  
  try {
    // Get API key from options or environment
    const falApiKey = apiKey || process.env.FALAI_API_KEY;
    
    if (!falApiKey) {
      throw new Error('Fal.ai API key is required');
    }
    
    // Platform-specific parameters
    const platformParams: Record<string, any> = {
      instagram: {
        aspect_ratio: '1:1',
        enhance_quality: true,
        optimize_for_feed: true
      },
      tiktok: {
        aspect_ratio: '9:16',
        enhance_quality: true,
        optimize_for_mobile: true
      },
      youtube: {
        aspect_ratio: '16:9',
        enhance_quality: true,
        optimize_for_thumbnails: true
      },
      linkedin: {
        aspect_ratio: '1.91:1',
        enhance_quality: true,
        optimize_for_professional: true
      },
      twitter: {
        aspect_ratio: '16:9',
        enhance_quality: true,
        optimize_for_timeline: true
      }
    };
    
    // Construct the API request
    const requestBody = {
      image: imageUrl,
      ...platformParams[platform]
    };
    
    // Make API request to Fal.ai
    const response = await fetch('https://api.fal.ai/image-optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${falApiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Fal.ai API error: ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.image_url) {
      throw new Error('No image URL in Fal.ai response');
    }
    
    return data.image_url;
    
  } catch (error) {
    console.error(`[Fal.ai] ${platform} optimization error:`, error);
    
    // Return original URL on error
    return imageUrl;
  }
};
