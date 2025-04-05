
import { useState, useEffect } from 'react';
import { VisionApiData } from '@/types/vision';
import { ScoredImage } from '@/types/scoring';
import { ContentSuggestion } from '@/types/content';
import { generatePromptFromMetadata } from '@/utils/mockData';

/**
 * Hook for generating and managing prompts based on image metadata
 */
export const usePromptGenerator = (
  selectedImage?: ScoredImage,
  selectedSuggestion?: ContentSuggestion | null,
  selectedTone: string = 'neutral',
  selectedIntent: string = 'describe'
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [isCustomPrompt, setIsCustomPrompt] = useState<boolean>(false);
  
  // Generate a prompt when the inputs change
  useEffect(() => {
    if (selectedImage?.visionData) {
      generatePrompt(selectedImage.visionData, selectedIntent, selectedTone)
        .then(newPrompt => {
          setPrompt(newPrompt);
          setIsCustomPrompt(false);
        })
        .catch(err => {
          console.error("Error auto-generating prompt:", err);
        });
    } else if (selectedSuggestion?.prompt) {
      setPrompt(selectedSuggestion.prompt);
      setIsCustomPrompt(false);
    }
  }, [selectedImage, selectedSuggestion, selectedTone, selectedIntent]);
  
  /**
   * Generate a prompt for a specific intent and tone based on vision data
   */
  const generatePrompt = async (
    visionData: VisionApiData | undefined,
    intent: string = 'describe',
    tone: string = 'neutral'
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // For now, use the mock implementation
      // In production, this would call an API endpoint
      const generatedPrompt = generatePromptFromMetadata(visionData, intent, tone);
      return generatedPrompt;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate prompt';
      setError(errorMessage);
      console.error("Error generating prompt:", err);
      return "Unable to generate prompt from the provided image data.";
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Update the prompt manually (makes it custom)
   */
  const updatePrompt = (newPrompt: string) => {
    setPrompt(newPrompt);
    setIsCustomPrompt(true);
  };
  
  /**
   * Reset the prompt to auto-generated
   */
  const resetPrompt = () => {
    if (selectedImage?.visionData) {
      generatePrompt(selectedImage.visionData, selectedIntent, selectedTone)
        .then(newPrompt => {
          setPrompt(newPrompt);
          setIsCustomPrompt(false);
        });
    } else if (selectedSuggestion?.prompt) {
      setPrompt(selectedSuggestion.prompt);
      setIsCustomPrompt(false);
    } else {
      setPrompt("");
      setIsCustomPrompt(false);
    }
  };
  
  return {
    prompt,
    isCustomPrompt,
    updatePrompt,
    resetPrompt,
    generatePrompt,
    isLoading,
    error
  };
};
