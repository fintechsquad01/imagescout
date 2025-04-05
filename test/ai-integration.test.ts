import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeImageWithGPT4o } from '../src/lib/ai/gpt4o';
import { createVideoFromImage } from '../src/lib/ai/falai';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('AI Integration Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Setup mock fetch implementation
    global.fetch.mockImplementation((url) => {
      if (url.includes('openai.com')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            choices: [{
              message: {
                content: `
                  Virality Score: 85
                  Aesthetic Score: 78
                  
                  Strengths:
                  - Strong color contrast creates visual interest
                  - Rule of thirds composition draws attention to focal point
                  - Luxury elements are prominently featured
                  
                  Weaknesses:
                  - Background is slightly cluttered
                  - Lighting could be improved for better mood
                  - Text overlay positioning could be optimized
                  
                  Opportunities:
                  - Add subtle motion to create more engaging content
                  - Crop for vertical format to maximize screen real estate on mobile
                  - Enhance luxury feel with color grading
                `
              }
            }],
            usage: {
              prompt_tokens: 650,
              completion_tokens: 850
            }
          })
        });
      } else if (url.includes('fal.ai')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            video_url: 'https://example.com/video.mp4',
            thumbnail_url: 'https://example.com/thumbnail.jpg',
            model: 'image-to-video-v1',
            file_size: 2500000
          })
        });
      }
      
      return Promise.reject(new Error('Unknown API endpoint'));
    });
  });
  
  it('analyzeImageWithGPT4o should process image and return structured analysis', async () => {
    const result = await analyzeImageWithGPT4o({
      imageUrl: 'https://example.com/image.jpg',
      analysisType: 'comprehensive',
      platform: 'instagram',
      mockResponse: false
    });
    
    expect(result.success).toBe(true);
    expect(result.viralityScore).toBe(85);
    expect(result.analysis.strengths.length).toBeGreaterThan(0);
    expect(result.analysis.weaknesses.length).toBeGreaterThan(0);
    expect(result.analysis.opportunities.length).toBeGreaterThan(0);
    expect(result.metadata.promptTokens).toBe(650);
    expect(result.metadata.completionTokens).toBe(850);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': expect.stringContaining('Bearer ')
        })
      })
    );
  });
  
  it('createVideoFromImage should transform image into video', async () => {
    const result = await createVideoFromImage({
      imageUrl: 'https://example.com/image.jpg',
      motionType: 'zoom',
      duration: 6,
      mockResponse: false
    });
    
    expect(result.success).toBe(true);
    expect(result.videoUrl).toBe('https://example.com/video.mp4');
    expect(result.thumbnailUrl).toBe('https://example.com/thumbnail.jpg');
    expect(result.metadata.model).toBe('image-to-video-v1');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.fal.ai/image-to-video',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': expect.stringContaining('Bearer ')
        })
      })
    );
  });
  
  it('should handle API errors gracefully', async () => {
    // Override fetch mock for error case
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad request')
      })
    );
    
    const result = await analyzeImageWithGPT4o({
      imageUrl: 'https://example.com/image.jpg',
      analysisType: 'viral',
      mockResponse: false
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
  
  it('should use mock responses in development mode', async () => {
    // Mock isDevelopmentMode to return true
    vi.mock('../src/utils/devMode', () => ({
      isDevelopmentMode: () => true
    }));
    
    const result = await createVideoFromImage({
      imageUrl: 'https://example.com/image.jpg',
      motionType: 'zoom',
      duration: 6
    });
    
    expect(result.success).toBe(true);
    expect(result.videoUrl).toBeDefined();
    expect(result.metadata.model).toBe('image-to-video-v1');
    // Verify fetch was not called (using mock data instead)
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
