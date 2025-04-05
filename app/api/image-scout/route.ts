import { analyzeAndTransformImage } from '@/lib/ai/pipeline';
import { useState } from 'react';

// Types for the API route request and response
export interface ImageScoutApiRequest {
  imageUrl?: string;
  imageBase64?: string;
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

// API route handler for image analysis
export async function POST(request: Request) {
  try {
    // Parse the request body
    const requestData: ImageScoutApiRequest = await request.json();
    
    // Validate required fields
    if (!requestData.imageUrl && !requestData.imageBase64) {
      return new Response(
        JSON.stringify({ 
          error: 'Either imageUrl or imageBase64 is required' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Convert base64 to File object if provided
    let imageFile: File | undefined;
    if (requestData.imageBase64) {
      const byteString = atob(requestData.imageBase64);
      const mimeType = 'image/jpeg'; // Assume JPEG if not specified
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      const blob = new Blob([ab], { type: mimeType });
      imageFile = new File([blob], 'uploaded-image.jpg', { type: mimeType });
    }
    
    // Analyze the image
    const result = await analyzeAndTransformImage({
      imageFile: imageFile as File,
      imageUrl: requestData.imageUrl,
      platform: requestData.platform,
      createVideo: requestData.createVideo,
      videoDuration: requestData.videoDuration || 6,
      motionType: requestData.motionType || 'subtle',
      targetAudience: requestData.targetAudience,
      stylePreference: requestData.stylePreference,
      optimizeForPlatform: requestData.optimizeForPlatform,
      userId: requestData.userId,
      projectId: requestData.projectId
    });
    
    // Return the analysis result
    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('API route error:', error);
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        success: false
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
