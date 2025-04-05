import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useImageScoutAnalysis } from '../src/hooks/useImageScoutAnalysis';

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

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('useImageScoutAnalysis Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('initializes with default values', () => {
    const { result } = renderHook(() => useImageScoutAnalysis());
    
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.platform).toBe('instagram');
    expect(result.current.createVideo).toBe(false);
    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.analysisResult).toBeNull();
    expect(result.current.error).toBeNull();
  });
  
  it('updates state when file is selected', () => {
    const { result } = renderHook(() => useImageScoutAnalysis());
    
    const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file] } };
    
    act(() => {
      result.current.handleFileChange(event as any);
    });
    
    expect(result.current.selectedFile).toBe(file);
    expect(result.current.previewUrl).toBe('mock-url');
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
  });
  
  it('performs analysis when handleAnalyze is called', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useImageScoutAnalysis());
    
    const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    
    act(() => {
      result.current.setSelectedFile(file);
    });
    
    act(() => {
      result.current.handleAnalyze();
    });
    
    expect(result.current.isAnalyzing).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.isAnalyzing).toBe(false);
    expect(result.current.analysisResult).not.toBeNull();
    expect(result.current.analysisResult?.success).toBe(true);
  });
  
  it('calls onAnalysisComplete callback with results', async () => {
    const mockCallback = vi.fn();
    const { result, waitForNextUpdate } = renderHook(() => 
      useImageScoutAnalysis({ onAnalysisComplete: mockCallback })
    );
    
    const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    
    act(() => {
      result.current.setSelectedFile(file);
    });
    
    act(() => {
      result.current.handleAnalyze();
    });
    
    await waitForNextUpdate();
    
    expect(mockCallback).toHaveBeenCalled();
    expect(mockCallback.mock.calls[0][0].success).toBe(true);
  });
  
  it('auto-analyzes when autoAnalyze is true', async () => {
    const { result, waitForNextUpdate } = renderHook(() => 
      useImageScoutAnalysis({ autoAnalyze: true })
    );
    
    const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [file] } };
    
    act(() => {
      result.current.handleFileChange(event as any);
    });
    
    // Wait for the setTimeout in the hook
    await new Promise(resolve => setTimeout(resolve, 200));
    
    await waitForNextUpdate();
    
    expect(result.current.analysisResult).not.toBeNull();
    expect(result.current.analysisResult?.success).toBe(true);
  });
  
  it('resets state when resetAnalysis is called', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useImageScoutAnalysis());
    
    const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    
    act(() => {
      result.current.setSelectedFile(file);
    });
    
    act(() => {
      result.current.handleAnalyze();
    });
    
    await waitForNextUpdate();
    
    expect(result.current.analysisResult).not.toBeNull();
    
    act(() => {
      result.current.resetAnalysis();
    });
    
    expect(result.current.selectedFile).toBeNull();
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.analysisResult).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
