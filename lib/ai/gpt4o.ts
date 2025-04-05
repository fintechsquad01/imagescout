import { isDevelopmentMode } from '@/utils/devMode';

// Types for GPT-4o API
export interface GPT4oAnalysisOptions {
  imageUrl?: string;
  imageBase64?: string;
  analysisType: 'viral' | 'repurpose' | 'platform' | 'comprehensive';
  platform?: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter';
  targetAudience?: string;
  stylePreference?: string;
  apiKey?: string;
  mockResponse?: boolean;
}

export interface GPT4oAnalysisResult {
  success: boolean;
  error?: string;
  viralityScore?: number;
  aestheticScore?: number;
  repurposeScore?: number;
  analysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
  };
  recommendations: {
    composition: string[];
    styling: string[];
    platformSpecific: Record<string, string[]>;
    videoTransformation?: {
      motionType: string;
      focusPoints: string[];
      transitionStyle: string;
      audioSuggestions: string[];
    };
  };
  metadata: {
    processingTime: number;
    model: string;
    promptTokens: number;
    completionTokens: number;
  };
}

// Mock data for development mode
const getMockAnalysisResult = (options: GPT4oAnalysisOptions): GPT4oAnalysisResult => {
  const platforms = ['instagram', 'tiktok', 'youtube', 'linkedin', 'twitter'];
  const platformSpecific: Record<string, string[]> = {};
  
  platforms.forEach(platform => {
    platformSpecific[platform] = [
      `${platform.charAt(0).toUpperCase() + platform.slice(1)} recommendation 1`,
      `${platform.charAt(0).toUpperCase() + platform.slice(1)} recommendation 2`,
    ];
  });

  return {
    success: true,
    viralityScore: Math.floor(Math.random() * 40) + 60, // 60-100
    aestheticScore: Math.floor(Math.random() * 40) + 60, // 60-100
    repurposeScore: Math.floor(Math.random() * 40) + 60, // 60-100
    analysis: {
      strengths: [
        'Strong color contrast creates visual interest',
        'Rule of thirds composition draws attention to focal point',
        'Luxury elements are prominently featured'
      ],
      weaknesses: [
        'Background is slightly cluttered',
        'Lighting could be improved for better mood',
        'Text overlay positioning could be optimized'
      ],
      opportunities: [
        'Add subtle motion to create more engaging content',
        'Crop for vertical format to maximize screen real estate on mobile',
        'Enhance luxury feel with color grading'
      ]
    },
    recommendations: {
      composition: [
        'Crop to 4:5 ratio for Instagram feed',
        'Adjust framing to emphasize luxury elements',
        'Create negative space for text overlay'
      ],
      styling: [
        'Apply warm tone filter to enhance luxury feel',
        'Increase contrast by 10-15%',
        'Soften background to create depth'
      ],
      platformSpecific,
      videoTransformation: {
        motionType: 'subtle zoom',
        focusPoints: ['center right object', 'bottom left detail'],
        transitionStyle: 'smooth fade',
        audioSuggestions: ['ambient luxury', 'soft piano']
      }
    },
    metadata: {
      processingTime: Math.floor(Math.random() * 1000) + 500,
      model: 'gpt-4o',
      promptTokens: Math.floor(Math.random() * 500) + 500,
      completionTokens: Math.floor(Math.random() * 1000) + 500
    }
  };
};

/**
 * Analyze an image using GPT-4o vision capabilities
 */
export const analyzeImageWithGPT4o = async (
  options: GPT4oAnalysisOptions
): Promise<GPT4oAnalysisResult> => {
  const startTime = performance.now();
  
  // Use mock response in development mode or if explicitly requested
  if (isDevelopmentMode() || options.mockResponse) {
    console.log('[GPT-4o] Using mock response for development');
    
    // Add artificial delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const mockResult = getMockAnalysisResult(options);
    return mockResult;
  }
  
  try {
    // Get API key from options or environment
    const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    if (!options.imageUrl && !options.imageBase64) {
      throw new Error('Either imageUrl or imageBase64 is required');
    }
    
    // Construct the prompt based on analysis type and platform
    let systemPrompt = 'You are an expert in visual content analysis specializing in luxury lifestyle content.';
    let userPrompt = 'Analyze this image for:';
    
    if (options.analysisType === 'viral') {
      userPrompt += ' viral potential, aesthetic quality, and engagement factors.';
    } else if (options.analysisType === 'repurpose') {
      userPrompt += ' repurposing opportunities, transformation suggestions, and format adaptations.';
    } else if (options.analysisType === 'platform') {
      userPrompt += ` optimization for ${options.platform || 'social media'} including format, style, and platform-specific best practices.`;
    } else {
      userPrompt += ' comprehensive analysis including viral potential, repurposing opportunities, and platform optimization.';
    }
    
    if (options.targetAudience) {
      userPrompt += ` Target audience: ${options.targetAudience}.`;
    }
    
    if (options.stylePreference) {
      userPrompt += ` Style preference: ${options.stylePreference}.`;
    }
    
    // Construct the API request
    const requestBody = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            options.imageUrl 
              ? { type: 'image_url', image_url: { url: options.imageUrl } }
              : { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${options.imageBase64}` } }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.2
    };
    
    // Make API request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in GPT-4o response');
    }
    
    // Process the response to extract structured data
    // This is a simplified version - in production we would use a more robust parsing approach
    const endTime = performance.now();
    const processingTime = Math.round(endTime - startTime);
    
    // Parse the content into structured data
    // In a real implementation, we would use a more robust parsing approach
    // For now, we'll return a partially structured response with the raw content
    
    // Extract scores using regex patterns
    const viralityMatch = content.match(/virality[^\d]*(\d+)/i);
    const aestheticMatch = content.match(/aesthetic[^\d]*(\d+)/i);
    const repurposeMatch = content.match(/repurpos[^\d]*(\d+)/i);
    
    // Extract sections using regex patterns
    const strengthsMatch = content.match(/strengths?[:\n]+([\s\S]*?)(?=weaknesses?[:\n]+|opportunities?[:\n]+|recommendations?[:\n]+|$)/i);
    const weaknessesMatch = content.match(/weaknesses?[:\n]+([\s\S]*?)(?=strengths?[:\n]+|opportunities?[:\n]+|recommendations?[:\n]+|$)/i);
    const opportunitiesMatch = content.match(/opportunities?[:\n]+([\s\S]*?)(?=strengths?[:\n]+|weaknesses?[:\n]+|recommendations?[:\n]+|$)/i);
    
    // Extract recommendations
    const recommendationsMatch = content.match(/recommendations?[:\n]+([\s\S]*?)(?=conclusion|summary|$)/i);
    
    // Parse bullet points into arrays
    const parseList = (text?: string): string[] => {
      if (!text) return [];
      return text
        .split(/\n/)
        .map(line => line.replace(/^[•\-\*\s]+/, '').trim())
        .filter(line => line.length > 0);
    };
    
    return {
      success: true,
      viralityScore: viralityMatch ? parseInt(viralityMatch[1], 10) : undefined,
      aestheticScore: aestheticMatch ? parseInt(aestheticMatch[1], 10) : undefined,
      repurposeScore: repurposeMatch ? parseInt(repurposeMatch[1], 10) : undefined,
      analysis: {
        strengths: parseList(strengthsMatch?.[1]),
        weaknesses: parseList(weaknessesMatch?.[1]),
        opportunities: parseList(opportunitiesMatch?.[1])
      },
      recommendations: {
        composition: parseList(recommendationsMatch?.[1]),
        styling: [],
        platformSpecific: {}
      },
      metadata: {
        processingTime,
        model: 'gpt-4o',
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0
      }
    };
    
  } catch (error) {
    console.error('[GPT-4o] Analysis error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      analysis: {
        strengths: [],
        weaknesses: [],
        opportunities: []
      },
      recommendations: {
        composition: [],
        styling: [],
        platformSpecific: {}
      },
      metadata: {
        processingTime: Math.round(performance.now() - startTime),
        model: 'gpt-4o',
        promptTokens: 0,
        completionTokens: 0
      }
    };
  }
};
