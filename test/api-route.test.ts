import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../src/app/api/image-scout/route';

// Mock the pipeline module
vi.mock('../src/lib/ai/pipeline', () => ({
  analyzeAndTransformImage: vi.fn().mockImplementation(() => {
    return Promise.resolve({
      success: true,
      viralityScore: 85,
      aestheticScore: 78,
      repurposeScore: 92,
      overallScore: 84,
      analysis: {
        strengths: ['Good composition', 'Strong colors'],
        weaknesses: ['Slightly blurry', 'Distracting background'],
        opportunities: ['Crop tighter', 'Add motion'],
        contentType: 'lifestyle',
        dominantColors: ['blue', 'gold'],
        detectedObjects: ['person', 'watch', 'car'],
        safetyStatus: 'safe'
      },
      recommendations: {
        composition: ['Rule of thirds', 'Focus on subject'],
        styling: ['Increase contrast', 'Warm filter'],
        platformSpecific: {
          instagram: ['Square format', 'High contrast']
        }
      },
      metadata: {
        processingTime: 1500,
        imageSize: 1024000,
        imageFormat: 'image/jpeg',
        aiModelsUsed: ['GPT-4o', 'Vision API', 'Fal.ai']
      }
    });
  })
}));

// Mock global objects
global.File = vi.fn().mockImplementation((content, filename, options) => ({
  content,
  name: filename,
  ...options
}));

global.Blob = vi.fn().mockImplementation((content, options) => ({
  content,
  ...options
}));

global.atob = vi.fn().mockImplementation((str) => str);

describe('Image Scout API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should handle imageUrl requests', async () => {
    const request = new Request('https://example.com/api/image-scout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageUrl: 'https://example.com/image.jpg',
        platform: 'instagram',
        createVideo: true
      })
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.viralityScore).toBe(85);
    expect(data.analysis.strengths).toContain('Good composition');
  });
  
  it('should handle imageBase64 requests', async () => {
    const request = new Request('https://example.com/api/image-scout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBase64: 'base64encodedimage',
        platform: 'tiktok'
      })
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
  
  it('should return 400 when no image is provided', async () => {
    const request = new Request('https://example.com/api/image-scout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        platform: 'instagram'
      })
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
  
  it('should handle errors gracefully', async () => {
    // Mock analyzeAndTransformImage to throw an error
    vi.mocked(analyzeAndTransformImage).mockRejectedValueOnce(new Error('Test error'));
    
    const request = new Request('https://example.com/api/image-scout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageUrl: 'https://example.com/image.jpg'
      })
    });
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });
});
