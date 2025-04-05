import { useState, useCallback, useEffect } from 'react';

// Define the structure of a prompt history item
export interface PromptHistoryItem {
  id: string;
  prompt: string;
  modelId: string;
  success: boolean;
  imageUrl?: string;
  favorite: boolean;
  createdAt: string;
}

// Hook to manage prompt history
export const usePromptHistory = (contextId?: string) => {
  const [promptHistory, setPromptHistory] = useState<PromptHistoryItem[]>([]);

  // Load prompt history from local storage on mount
  useEffect(() => {
    const storageKey = `promptHistory-${contextId || 'global'}`;
    const storedHistory = localStorage.getItem(storageKey);
    if (storedHistory) {
      setPromptHistory(JSON.parse(storedHistory));
    }
  }, [contextId]);

  // Save prompt history to local storage whenever it changes
  useEffect(() => {
    const storageKey = `promptHistory-${contextId || 'global'}`;
    localStorage.setItem(storageKey, JSON.stringify(promptHistory));
  }, [promptHistory, contextId]);

  // Function to toggle the favorite status of a prompt
  const toggleFavorite = useCallback((itemId: string) => {
    setPromptHistory(prevHistory => 
      prevHistory.map(item => 
        item.id === itemId 
          ? { ...item, favorite: !item.favorite } // Changed from isFavorite to favorite
          : item
      )
    );
    
    // Get the updated item
    const updatedItem = promptHistory.find(item => item.id === itemId);
    if (updatedItem) {
      // Update in storage
      const storageKey = `promptHistory-${contextId || 'global'}`;
      const storageData = localStorage.getItem(storageKey);
      if (storageData) {
        const storedHistory = JSON.parse(storageData);
        const updatedHistory = storedHistory.map((item: PromptHistoryItem) => 
          item.id === itemId
            ? { ...item, favorite: !item.favorite } // Changed from isFavorite to favorite
            : item
        );
        localStorage.setItem(storageKey, JSON.stringify(updatedHistory));
      }
    }
  }, [promptHistory, contextId]);

  // Function to remove a prompt from the history
  const removePromptFromHistory = useCallback((itemId: string) => {
    setPromptHistory(prevHistory => prevHistory.filter(item => item.id !== itemId));
  }, []);

  // Function to clear the entire prompt history
  const clearPromptHistory = useCallback(() => {
    setPromptHistory([]);
    const storageKey = `promptHistory-${contextId || 'global'}`;
    localStorage.removeItem(storageKey);
  }, [contextId]);

  // Function to save a new prompt to the history
  const savePromptToHistory = useCallback((
    prompt: string, 
    modelId: string,
    success: boolean = true,
    imageUrl?: string
  ): PromptHistoryItem => {
    const newPrompt: Omit<PromptHistoryItem, 'id' | 'createdAt'> = {
      prompt,
      modelId,
      success,
      imageUrl,
      favorite: false
    };

    const newItem: PromptHistoryItem = {
      id: `prompt-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      ...newPrompt,
      createdAt: new Date().toISOString()
    };

    setPromptHistory(prevHistory => [newItem, ...prevHistory]);
    return newItem;
  }, []);

  return {
    promptHistory,
    savePromptToHistory,
    removePromptFromHistory,
    clearPromptHistory,
    toggleFavorite
  };
};
