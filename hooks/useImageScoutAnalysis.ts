import { analyzeAndTransformImage, ImageScoutAnalysisResult } from '@/lib/ai/pipeline';
import { useState, useEffect } from 'react';

// Types for the hook parameters and return values
interface UseImageScoutAnalysisParams {
  initialPlatform?: 'instagram' | 'tiktok' | 'youtube' | 'linkedin' | 'twitter';
  autoAnalyze?: boolean;
  onAnalysisComplete?: (result: ImageScoutAnalysisResult) => void;
}

interface UseImageScoutAnalysisReturn {
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  previewUrl: string | null;
  platform: string;
  setPlatform: (platform: string) => void;
  createVideo: boolean;
  setCreateVideo: (createVideo: boolean) => void;
  isAnalyzing: boolean;
  analysisResult: ImageScoutAnalysisResult | null;
  error: string | null;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleAnalyze: () => Promise<void>;
  resetAnalysis: () => void;
}

/**
 * Custom hook for handling ImageScout analysis functionality
 */
export const useImageScoutAnalysis = ({
  initialPlatform = 'instagram',
  autoAnalyze = false,
  onAnalysisComplete
}: UseImageScoutAnalysisParams = {}): UseImageScoutAnalysisReturn => {
  // State for the analysis
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string>(initialPlatform);
  const [createVideo, setCreateVideo] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<ImageScoutAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
      setError(null);
      
      // Auto-analyze if enabled
      if (autoAnalyze) {
        setTimeout(() => {
          handleAnalyze();
        }, 100);
      }
    }
  };

  // Handle analysis submission
  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select an image to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeAndTransformImage({
        imageFile: selectedFile,
        platform: platform as any,
        createVideo,
        videoDuration: 6,
        motionType: 'subtle',
        optimizeForPlatform: true
      });

      setAnalysisResult(result);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset analysis
  const resetAnalysis = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setError(null);
  };

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return {
    selectedFile,
    setSelectedFile,
    previewUrl,
    platform,
    setPlatform,
    createVideo,
    setCreateVideo,
    isAnalyzing,
    analysisResult,
    error,
    handleFileChange,
    handleAnalyze,
    resetAnalysis
  };
};
