import { useState, useCallback } from 'react';
import { useProject } from '@/context/ProjectContext';
import { useSupabaseLogger } from '@/hooks/useSupabaseLogger';
import { usePromptHistory } from '@/hooks/usePromptHistory';
import { generateImage } from '@/utils/renderNetApi';
import { RenderNetResponse, RenderNetConfig } from '@/types/content';
import { useToast } from '@/components/ui/use-toast';
import { createGenerationLogPayload } from '@/types/project';
import { 
  createErrorResponse, 
  parseRenderNetResponse, 
  createRenderNetConfig,
  createGenerationLogEntry,
  simplifyPrompt,
  downloadGeneratedImage
} from '@/utils/renderNetUtils';

export const useRenderNet = (imageId: string) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [generationResult, setGenerationResult] = useState<RenderNetResponse | null>(null);
  const [fallbackPrompt, setFallbackPrompt] = useState<string>('');
  
  const { currentProject } = useProject();
  const { logGenerationResult } = useSupabaseLogger();
  const { savePromptToHistory } = usePromptHistory(imageId);
  const { toast } = useToast();
  
  const generateContent = useCallback(async (
    prompt: string, 
    modelId: string, 
    config?: RenderNetConfig
  ): Promise<RenderNetResponse | undefined> => {
    if (!imageId) {
      toast({
        title: "Error",
        description: "Missing image ID. Please try again.",
        variant: "destructive"
      });
      return undefined;
    }
    
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt.",
        variant: "destructive"
      });
      return undefined;
    }
    
    setIsGenerating(true);
    let startTime = Date.now();
    
    try {
      // Create simplified prompt for potential fallback
      setFallbackPrompt(simplifyPrompt(prompt));
      
      // Prepare API config
      const apiConfig = createRenderNetConfig(config || { model: modelId });
      
      // Generate image
      const result = await generateImage(prompt, modelId, apiConfig);
      
      setGenerationResult(result);
      
      // Log the generation result
      const logPayload = createGenerationLogPayload({
        imageId,
        projectId: currentProject?.id || 'default',
        prompt,
        model: modelId,
        success: result.status === 'success',
        executionTime: Date.now() - startTime,
        error: result.error
      });
      
      logGenerationResult(logPayload);
      
      // Handle success/failure and save prompt history
      if (result.status === 'success') {
        savePromptToHistory(prompt, modelId, true, result.imageUrl);
        
        toast({
          title: "Generation Complete",
          description: "Your image has been generated successfully."
        });
      } else {
        savePromptToHistory(prompt, modelId, false);
        
        toast({
          title: "Generation Failed",
          description: result.error || "Unknown error occurred.",
          variant: "destructive"
        });
      }
      
      return result;
      
    } catch (error) {
      console.error("Error in generateContent:", error);
      
      // Create standardized error response
      const errorResult = createErrorResponse(prompt, modelId, error);
      setGenerationResult(errorResult);
      
      // Log error result
      const errorLogPayload = createGenerationLogPayload({
        imageId,
        projectId: currentProject?.id || 'default',
        prompt,
        model: modelId,
        success: false,
        error: errorResult.error
      });
      
      logGenerationResult(errorLogPayload);
      savePromptToHistory(prompt, modelId, false);
      
      toast({
        title: "Generation Error",
        description: errorResult.error || "An unexpected error occurred.",
        variant: "destructive"
      });
      
      return errorResult;
      
    } finally {
      setIsGenerating(false);
    }
  }, [imageId, logGenerationResult, savePromptToHistory, currentProject, toast]);
  
  const retryWithFallbackPrompt = useCallback(async (modelId: string): Promise<RenderNetResponse | undefined> => {
    if (!fallbackPrompt || !imageId) {
      return undefined;
    }
    
    setIsRetrying(true);
    let startTime = Date.now();
    
    try {
      // Create API config for retry
      const apiConfig = createRenderNetConfig({ model: modelId });
      
      // Generate with simplified prompt
      const result = await generateImage(fallbackPrompt, modelId, apiConfig);
      
      setGenerationResult(result);
      
      // Log retry result
      const retryLogPayload = createGenerationLogPayload({
        imageId,
        projectId: currentProject?.id || 'default',
        prompt: fallbackPrompt,
        model: modelId,
        success: result.status === 'success',
        executionTime: Date.now() - startTime,
        error: result.error
      });
      
      logGenerationResult(retryLogPayload);
      
      // Handle success/failure and save prompt history
      if (result.status === 'success') {
        savePromptToHistory(fallbackPrompt, modelId, true, result.imageUrl);
        
        toast({
          title: "Retry Successful",
          description: "Your image has been generated with the simplified prompt."
        });
      } else {
        savePromptToHistory(fallbackPrompt, modelId, false);
        
        toast({
          title: "Retry Failed",
          description: result.error || "Unknown error occurred even with simplified prompt.",
          variant: "destructive"
        });
      }
      
      return result;
      
    } catch (error) {
      console.error("Error in retryWithFallbackPrompt:", error);
      
      // Create standardized error response for retry
      const errorResult = createErrorResponse(fallbackPrompt, modelId, error, 'error-retry');
      setGenerationResult(errorResult);
      
      // Log retry error
      const retryErrorPayload = createGenerationLogPayload({
        imageId,
        projectId: currentProject?.id || 'default',
        prompt: fallbackPrompt,
        model: modelId,
        success: false,
        error: errorResult.error
      });
      
      logGenerationResult(retryErrorPayload);
      savePromptToHistory(fallbackPrompt, modelId, false);
      
      toast({
        title: "Retry Error",
        description: "The simplified prompt also failed. Please try a different approach.",
        variant: "destructive"
      });
      
      return errorResult;
      
    } finally {
      setIsRetrying(false);
    }
  }, [fallbackPrompt, imageId, logGenerationResult, savePromptToHistory, currentProject, toast]);
  
  const updateFallbackPrompt = useCallback((newPrompt: string) => {
    setFallbackPrompt(newPrompt);
  }, []);
  
  const downloadImage = useCallback(() => {
    downloadGeneratedImage(generationResult?.imageUrl);
    
    toast({
      title: "Download Started",
      description: "Your image is being downloaded"
    });
  }, [generationResult?.imageUrl, toast]);
  
  return {
    isGenerating,
    isRetrying,
    generationResult,
    fallbackPrompt,
    generateContent,
    retryWithFallbackPrompt,
    updateFallbackPrompt,
    downloadImage
  };
};
