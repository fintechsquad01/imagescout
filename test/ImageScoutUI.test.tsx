import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageScoutUI } from '../src/components/image-scout/ImageScoutUI';

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
          instagram: ['Square format', 'High contrast'],
          tiktok: ['Vertical format', 'Add motion'],
          youtube: ['16:9 ratio', 'Thumbnail optimization'],
          linkedin: ['Professional tone', 'Clean background'],
          twitter: ['High contrast', 'Bold elements']
        }
      },
      transformedContent: {
        optimizedImageUrl: 'https://example.com/optimized.jpg',
        videoUrl: 'https://example.com/video.mp4',
        thumbnailUrl: 'https://example.com/thumbnail.jpg'
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

describe('ImageScoutUI Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders the upload section correctly', () => {
    render(<ImageScoutUI />);
    
    expect(screen.getByText('Image Scout')).toBeInTheDocument();
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze image/i })).toBeDisabled();
  });
  
  it('enables the analyze button when an image is selected', async () => {
    render(<ImageScoutUI />);
    
    const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Upload Image');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /analyze image/i })).not.toBeDisabled();
    });
  });
  
  it('shows loading state during analysis', async () => {
    render(<ImageScoutUI />);
    
    const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Upload Image');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    const analyzeButton = screen.getByRole('button', { name: /analyze image/i });
    fireEvent.click(analyzeButton);
    
    expect(screen.getByRole('button', { name: /analyzing/i })).toBeInTheDocument();
  });
  
  it('displays analysis results after successful analysis', async () => {
    render(<ImageScoutUI />);
    
    const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Upload Image');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    const analyzeButton = screen.getByRole('button', { name: /analyze image/i });
    fireEvent.click(analyzeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Analysis Results')).toBeInTheDocument();
      expect(screen.getByText('84')).toBeInTheDocument(); // Overall score
      expect(screen.getByText('Strengths')).toBeInTheDocument();
      expect(screen.getByText('Good composition')).toBeInTheDocument();
    });
  });
  
  it('calls onAnalysisComplete callback with results', async () => {
    const mockCallback = vi.fn();
    render(<ImageScoutUI onAnalysisComplete={mockCallback} />);
    
    const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Upload Image');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    const analyzeButton = screen.getByRole('button', { name: /analyze image/i });
    fireEvent.click(analyzeButton);
    
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalled();
      expect(mockCallback.mock.calls[0][0].success).toBe(true);
    });
  });
  
  it('shows platform-specific recommendations', async () => {
    render(<ImageScoutUI initialPlatform="instagram" />);
    
    const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Upload Image');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    const analyzeButton = screen.getByRole('button', { name: /analyze image/i });
    fireEvent.click(analyzeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Instagram Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Square format')).toBeInTheDocument();
    });
  });
});
