import { analyzeImageWithGPT4o } from '@/lib/ai/gpt4o';
import { createVideoFromImage, optimizeImageForPlatform } from '@/lib/ai/falai';
import { VisionScoring } from '@/utils/visionApi';
import { isDevelopmentMode } from '@/utils/devMode';

// Types for the integrated pipeline
export interface ImageScoutAnalysisOptions {
  imageFile: File;
  imageUrl?: string;
  platform?: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter';
  createVideo?: boolean;
  videoDuration?: number;
  motionType?: 'zoom' | 'pan' | 'parallax' | 'ken-burns' | 'subtle';
  targetAudience?: string;
  stylePreference?: string;
  optimizeForPlatform?: boolean;
  userId?: string;
  projectId?: string;
}

export interface ImageScoutAnalysisResult {
  success: boolean;
  error?: string;
  
  // Scores
  viralityScore: number;
  aestheticScore: number;
  repurposeScore: number;
  overallScore: number;
  
  // Analysis
  analysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    contentType: string;
    dominantColors: string[];
    detectedObjects: string[];
    safetyStatus: 'safe' | 'warning' | 'unsafe';
  };
  
  // Recommendations
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
  
  // Transformed content
  transformedContent?: {
    optimizedImageUrl?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
  };
  
  // Metadata
  metadata: {
    processingTime: number;
    imageSize: number;
    imageFormat: string;
    aiModelsUsed: string[];
  };
}

/**
 * Comprehensive image analysis and transformation pipeline for ImageScout
 */
export const analyzeAndTransformImage = async (
  options: ImageScoutAnalysisOptions
): Promise<ImageScoutAnalysisResult> => {
  const startTime = performance.now();
  
  try {
    // Step 1: Basic image validation
    if (!options.imageFile && !options.imageUrl) {
      throw new Error('Either imageFile or imageUrl is required');
    }
    
    // Step 2: Convert image to base64 if needed for API calls
    let imageBase64: string | undefined;
    let imageUrl = options.imageUrl;
    
    if (options.imageFile && !imageUrl) {
      imageBase64 = await fileToBase64(options.imageFile);
      
      // Create a temporary URL for the file
      imageUrl = URL.createObjectURL(options.imageFile);
    }
    
    // Step 3: Run basic vision analysis using existing pipeline
    console.log('[ImageScout] Starting basic vision analysis');
    const visionData = await VisionScoring.analyzeImage(options.imageFile, {
      projectId: options.projectId,
      userId: options.userId,
      forceMock: isDevelopmentMode()
    });
    
    // Step 4: Run enhanced analysis with GPT-4o
    console.log('[ImageScout] Starting GPT-4o analysis');
    const gpt4oResult = await analyzeImageWithGPT4o({
      imageUrl,
      imageBase64,
      analysisType: 'comprehensive',
      platform: options.platform,
      targetAudience: options.targetAudience,
      stylePreference: options.stylePreference,
      mockResponse: isDevelopmentMode()
    });
    
    // Step 5: Transform content if requested
    let transformedContent = {};
    
    // Optimize image for platform if requested
    if (options.optimizeForPlatform && options.platform && imageUrl) {
      console.log(`[ImageScout] Optimizing image for ${options.platform}`);
      const optimizedImageUrl = await optimizeImageForPlatform(
        imageUrl,
        options.platform
      );
      
      transformedContent = {
        ...transformedContent,
        optimizedImageUrl
      };
    }
    
    // Create video if requested
    if (options.createVideo && imageUrl) {
      console.log('[ImageScout] Creating video from image');
      const videoResult = await createVideoFromImage({
        imageUrl,
        motionType: options.motionType || 'subtle',
        duration: options.videoDuration || 6,
        focusPoints: gpt4oResult.recommendations.videoTransformation?.focusPoints,
        transitionStyle: 'smooth',
        mockResponse: isDevelopmentMode()
      });
      
      if (videoResult.success) {
        transformedContent = {
          ...transformedContent,
          videoUrl: videoResult.videoUrl,
          thumbnailUrl: videoResult.thumbnailUrl
        };
      }
    }
    
    // Step 6: Calculate final scores
    const visionScore = visionData.score || 70;
    const gpt4oViralityScore = gpt4oResult.viralityScore || 70;
    const gpt4oAestheticScore = gpt4oResult.aestheticScore || 70;
    const gpt4oRepurposeScore = gpt4oResult.repurposeScore || 70;
    
    // Weighted average of scores
    const overallScore = Math.round(
      (visionScore * 0.3) + 
      (gpt4oViralityScore * 0.3) + 
      (gpt4oAestheticScore * 0.2) + 
      (gpt4oRepurposeScore * 0.2)
    );
    
    // Step 7: Compile final result
    const endTime = performance.now();
    const processingTime = Math.round(endTime - startTime);
    
    return {
      success: true,
      viralityScore: gpt4oViralityScore,
      aestheticScore: gpt4oAestheticScore,
      repurposeScore: gpt4oRepurposeScore,
      overallScore,
      
      analysis: {
        strengths: gpt4oResult.analysis.strengths,
        weaknesses: gpt4oResult.analysis.weaknesses,
        opportunities: gpt4oResult.analysis.opportunities,
        contentType: visionData.contentType || 'unknown',
        dominantColors: visionData.colors?.map(c => c.name) || [],
        detectedObjects: visionData.objects?.map(o => o.name) || [],
        safetyStatus: VisionScoring.checkSafety(visionData) ? 'safe' : 'warning'
      },
      
      recommendations: {
        composition: gpt4oResult.recommendations.composition,
        styling: gpt4oResult.recommendations.styling,
        platformSpecific: gpt4oResult.recommendations.platformSpecific,
        videoTransformation: gpt4oResult.recommendations.videoTransformation
      },
      
      transformedContent: Object.keys(transformedContent).length > 0 
        ? transformedContent 
        : undefined,
      
      metadata: {
        processingTime,
        imageSize: options.imageFile?.size || 0,
        imageFormat: options.imageFile?.type || 'unknown',
        aiModelsUsed: ['GPT-4o', 'Vision API', 'Fal.ai']
      }
    };
    
  } catch (error) {
    console.error('[ImageScout] Analysis pipeline error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      viralityScore: 0,
      aestheticScore: 0,
      repurposeScore: 0,
      overallScore: 0,
      
      analysis: {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        contentType: 'unknown',
        dominantColors: [],
        detectedObjects: [],
        safetyStatus: 'warning'
      },
      
      recommendations: {
        composition: [],
        styling: [],
        platformSpecific: {}
      },
      
      metadata: {
        processingTime: Math.round(performance.now() - startTime),
        imageSize: options.imageFile?.size || 0,
        imageFormat: options.imageFile?.type || 'unknown',
        aiModelsUsed: []
      }
    };
  }
};

/**
 * Convert a File object to base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};
