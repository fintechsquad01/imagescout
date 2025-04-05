import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeImageWithGPT4o } from '../src/lib/ai/gpt4o';
import { createVideoFromImage, optimizeImageForPlatform } from '../src/lib/ai/falai';
import { analyzeAndTransformImage } from '../src/lib/ai/pipeline';

// Mock the dependencies
vi.mock('../src/lib/ai/gpt4o', () => ({
  analyzeImageWithGPT4o: vi.fn()
}));

vi.mock('../src/lib/ai/falai', () => ({
  createVideoFromImage: vi.fn(),
  optimizeImageForPlatform: vi.fn()
}));

vi.mock('../src/utils/visionApi', () => ({
  VisionScoring: {
    analyzeImage: vi.fn(),
    checkSafety: vi.fn()
  }
}));

describe('ImageScout Pipeline', () => {
  const mockFile = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
  
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup mock implementations
    vi.mocked(analyzeImageWithGPT4o).mockResolvedValue({
      success: true,
      viralityScore: 85,
      aestheticScore: 78,
      repurposeScore: 92,
      analysis: {
        strengths: ['Good composition', 'Strong colors'],
        weaknesses: ['Slightly blurry', 'Distracting background'],
        opportunities: ['Crop tighter', 'Add motion']
      },
      recommendations: {
        composition: ['Rule of thirds', 'Focus on subject'],
        styling: ['Increase contrast', 'Warm filter'],
        platformSpecific: {
          instagram: ['Square format', 'High contrast'],
          tiktok: ['Vertical format', 'Add motion']
        },
        videoTransformation: {
          motionType: 'zoom',
          focusPoints: ['center'],
          transitionStyle: 'smooth',
          audioSuggestions: ['ambient']
        }
      },
      metadata: {
        processingTime: 1200,
        model: 'gpt-4o',
        promptTokens: 500,
        completionTokens: 800
      }
    });
    
    vi.mocked(createVideoFromImage).mockResolvedValue({
      success: true,
      videoUrl: 'https://example.com/video.mp4',
      thumbnailUrl: 'https://example.com/thumbnail.jpg',
      metadata: {
        processingTime: 2500,
        model: 'image-to-video-v1',
        duration: 6,
        resolution: '720p'
      }
    });
    
    vi.mocked(optimizeImageForPlatform).mockResolvedValue('https://example.com/optimized.jpg');
  });
  
  it('should analyze an image and return comprehensive results', async () => {
    const result = await analyzeAndTransformImage({
      imageFile: mockFile,
      platform: 'instagram',
      createVideo: false
    });
    
    expect(result.success).toBe(true);
    expect(result.viralityScore).toBeDefined();
    expect(result.aestheticScore).toBeDefined();
    expect(result.repurposeScore).toBeDefined();
    expect(result.overallScore).toBeDefined();
    expect(result.analysis.strengths.length).toBeGreaterThan(0);
    expect(result.recommendations.composition.length).toBeGreaterThan(0);
  });
  
  it('should create video when requested', async () => {
    const result = await analyzeAndTransformImage({
      imageFile: mockFile,
      platform: 'tiktok',
      createVideo: true,
      videoDuration: 6,
      motionType: 'zoom'
    });
    
    expect(result.success).toBe(true);
    expect(result.transformedContent).toBeDefined();
    expect(result.transformedContent?.videoUrl).toBeDefined();
    expect(createVideoFromImage).toHaveBeenCalled();
  });
  
  it('should optimize for platform when requested', async () => {
    const result = await analyzeAndTransformImage({
      imageFile: mockFile,
      platform: 'instagram',
      optimizeForPlatform: true
    });
    
    expect(result.success).toBe(true);
    expect(result.transformedContent).toBeDefined();
    expect(result.transformedContent?.optimizedImageUrl).toBeDefined();
    expect(optimizeImageForPlatform).toHaveBeenCalled();
  });
  
  it('should handle errors gracefully', async () => {
    vi.mocked(analyzeImageWithGPT4o).mockRejectedValue(new Error('Test error'));
    
    const result = await analyzeAndTransformImage({
      imageFile: mockFile,
      platform: 'instagram'
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.viralityScore).toBe(0);
  });
});
