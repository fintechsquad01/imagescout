// This file contains bug fixes and refinements based on test results

import { analyzeAndTransformImage } from '@/lib/ai/pipeline';

// Fix for error handling in the pipeline
export const enhancedAnalyzeAndTransform = async (params) => {
  try {
    // Add timeout handling to prevent long-running requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Analysis timed out after 30 seconds')), 30000);
    });
    
    const analysisPromise = analyzeAndTransformImage(params);
    const result = await Promise.race([analysisPromise, timeoutPromise]);
    
    // Ensure all required fields are present in the response
    return {
      success: true,
      viralityScore: result.viralityScore || 0,
      aestheticScore: result.aestheticScore || 0,
      repurposeScore: result.repurposeScore || 0,
      overallScore: result.overallScore || 0,
      analysis: {
        strengths: result.analysis?.strengths || [],
        weaknesses: result.analysis?.weaknesses || [],
        opportunities: result.analysis?.opportunities || [],
        contentType: result.analysis?.contentType || 'unknown',
        dominantColors: result.analysis?.dominantColors || [],
        detectedObjects: result.analysis?.detectedObjects || [],
        safetyStatus: result.analysis?.safetyStatus || 'unknown'
      },
      recommendations: {
        composition: result.recommendations?.composition || [],
        styling: result.recommendations?.styling || [],
        platformSpecific: result.recommendations?.platformSpecific || {
          instagram: [],
          tiktok: [],
          youtube: [],
          linkedin: [],
          twitter: []
        }
      },
      transformedContent: result.transformedContent || null,
      metadata: {
        processingTime: result.metadata?.processingTime || 0,
        imageSize: result.metadata?.imageSize || 0,
        imageFormat: result.metadata?.imageFormat || 'unknown',
        aiModelsUsed: result.metadata?.aiModelsUsed || []
      }
    };
  } catch (error) {
    console.error('Enhanced analysis error:', error);
    
    // Return a structured error response
    return {
      success: false,
      error: error.message || 'An unknown error occurred during analysis',
      viralityScore: 0,
      aestheticScore: 0,
      repurposeScore: 0,
      overallScore: 0,
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
        processingTime: 0,
        errorType: error.name,
        errorTimestamp: new Date().toISOString()
      }
    };
  }
};

// Fix for image format handling
export const validateAndProcessImage = async (imageFile, imageUrl) => {
  try {
    // Validate image file if provided
    if (imageFile) {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      
      if (!validTypes.includes(imageFile.type)) {
        throw new Error('Unsupported image format. Please use JPEG, PNG, WebP, or GIF.');
      }
      
      const fileSizeInMB = imageFile.size / (1024 * 1024);
      if (fileSizeInMB > 10) {
        throw new Error('Image size exceeds 10MB limit. Please use a smaller image.');
      }
    }
    
    // Validate image URL if provided
    if (imageUrl && !imageUrl.match(/^https?:\/\/.+\.(jpeg|jpg|png|webp|gif)(\?.*)?$/i)) {
      throw new Error('Invalid image URL. Please provide a direct link to a JPEG, PNG, WebP, or GIF image.');
    }
    
    return {
      success: true,
      imageFile,
      imageUrl
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Fix for platform-specific optimization
export const getPlatformDefaults = (platform) => {
  const defaults = {
    instagram: {
      aspectRatio: '1:1',
      recommendedResolution: '1080x1080',
      captionLength: 2200,
      hashtagCount: 30,
      videoMaxDuration: 60
    },
    tiktok: {
      aspectRatio: '9:16',
      recommendedResolution: '1080x1920',
      captionLength: 150,
      hashtagCount: 5,
      videoMaxDuration: 60
    },
    youtube: {
      aspectRatio: '16:9',
      recommendedResolution: '1920x1080',
      captionLength: 5000,
      hashtagCount: 15,
      videoMaxDuration: 60
    },
    linkedin: {
      aspectRatio: '1.91:1',
      recommendedResolution: '1200x627',
      captionLength: 3000,
      hashtagCount: 5,
      videoMaxDuration: 10
    },
    twitter: {
      aspectRatio: '16:9',
      recommendedResolution: '1200x675',
      captionLength: 280,
      hashtagCount: 2,
      videoMaxDuration: 140
    }
  };
  
  return defaults[platform] || defaults.instagram;
};
