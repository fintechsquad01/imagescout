import React, { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import ImageUploader from '@/components/ImageUploader';
import ProjectSelector from '@/components/ProjectSelector';
import UploadTracker from '@/components/dashboard/UploadTracker';
import ImageDashboard from '@/components/dashboard/ImageDashboard';
import EmptyState from '@/components/dashboard/EmptyState';
import AppFooter from '@/components/dashboard/AppFooter';
import DevNav from '@/components/dev/DevNav';
import { useProject, TEST_PROJECT_ID } from '@/context/ProjectContext';
import { ScoredImage, ContentSuggestion, AIModel, ImageFile, VisionApiOptions } from '@/types/types';
import { availableModels } from '@/data/aiModels';
import { useSupabaseLogger } from '@/hooks/useSupabaseLogger';
import { VisionScoring, analyzeImageWithVision } from '@/utils/visionApi';
import { calculateOpportunityScore } from '@/utils/scoringCalculation';
import { usePromptGenerator } from '@/hooks/usePromptGenerator';
import { isDevelopmentMode } from '@/utils/devMode';
import { generatePromptFromMetadata } from '@/utils/mockData';

const Index: React.FC<{ onToggleExperimentalMode?: (enabled: boolean) => void }> = ({ 
  onToggleExperimentalMode 
}) => {
  const [scoredImages, setScoredImages] = useState<ScoredImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<ScoredImage | null>(null);
  const [contentSuggestions, setContentSuggestions] = useState<ContentSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ContentSuggestion | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [experimentalMode, setExperimentalMode] = useState(
    localStorage.getItem('experimentalMode') === 'true'
  );
  const [uploadStats, setUploadStats] = useState({
    dailyUploads: 0,
    maxUploads: 50,
    remainingUploads: 50
  });
  
  const { currentProject } = useProject();
  const { logImageUpload, dailyUploads, maxDailyUploads, remainingUploads } = useSupabaseLogger();
  
  useEffect(() => {
    const storedImages = localStorage.getItem('scoredImages');
    if (storedImages) {
      setScoredImages(JSON.parse(storedImages));
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('scoredImages', JSON.stringify(scoredImages));
  }, [scoredImages]);
  
  useEffect(() => {
    if (currentProject) {
      setUploadStats({
        dailyUploads,
        maxUploads: maxDailyUploads,
        remainingUploads
      });
    }
  }, [currentProject, dailyUploads, maxDailyUploads, remainingUploads]);

  useEffect(() => {
    // Progress simulation
    if (isUploading) {
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 200);
      
      return () => clearInterval(interval);
    } else {
      setUploadProgress(0);
    }
  }, [isUploading]);
  
  const handleImagesSelected = async (newImages: ImageFile[]) => {
    if (!currentProject) {
      toast({
        variant: "destructive",
        title: "No project selected",
        description: "Please select a project before uploading images."
      });
      return;
    }
    
    setIsUploading(true);
    setIsLoading(true);
    
    try {
      const scoredImagesPromises = newImages.map(async (image) => {
        const options: VisionApiOptions = { 
          projectId: currentProject.id,
          test: currentProject.id === TEST_PROJECT_ID || currentProject.test === true
        };
        
        const visionData = await analyzeImageWithVision(image, options);
        
        const opportunityScore = calculateOpportunityScore(visionData, null);
        
        return {
          id: image.id,
          url: image.preview,
          thumbnailUrl: image.preview,
          src: image.preview, // Add for backward compatibility
          fileName: image.name, // Add for backward compatibility
          width: 800,
          height: 600,
          size: image.size,
          file: image,
          projectId: currentProject.id,
          format: image.type,
          lastModified: image.lastModified,
          name: image.name,
          uploadDate: new Date().toISOString(),
          visionData: visionData,
          opportunityScore: opportunityScore,
          score: opportunityScore, // Add for backward compatibility
          test: currentProject.id === TEST_PROJECT_ID || currentProject.test === true
        };
      });
      
      const newScoredImages = await Promise.all(scoredImagesPromises);
      
      setScoredImages((prevImages) => [...prevImages, ...newScoredImages]);
      
      await logImageUpload(newImages.length);
      
      if (newScoredImages.length > 0) {
        setSelectedImage(newScoredImages[0]);
      }
      
      toast({
        title: "Images uploaded",
        description: `${newImages.length} images uploaded and analyzed successfully.`
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was an error uploading the images. Please try again."
      });
    } finally {
      setIsUploading(false);
      setIsLoading(false);
    }
  };
  
  const handleSelectImage = async (image: ScoredImage) => {
    setSelectedImage(image);
    
    if (image.visionData) {
      setIsSuggestionsLoading(true);
      try {
        // Generate content suggestions using the metadata
        const mockSuggestions: ContentSuggestion[] = [
          {
            id: '1',
            title: 'Social Media Post',
            description: 'Engaging post for Instagram and Facebook',
            platforms: ['instagram', 'facebook'],
            prompt: generatePromptFromMetadata(image.visionData, 'social', 'casual'),
            test: image.test,
            text: 'Social media post content', // Add required field
            type: 'social' // Add required field
          },
          {
            id: '2',
            title: 'Product Description',
            description: 'Detailed product description for e-commerce',
            platforms: ['website', 'amazon'],
            prompt: generatePromptFromMetadata(image.visionData, 'advertise', 'professional'),
            test: image.test,
            text: 'Product description content', // Add required field
            type: 'product' // Add required field
          }
        ];
        
        setContentSuggestions(mockSuggestions);
      } catch (error) {
        console.error("Error generating content suggestions:", error);
        toast({
          variant: "destructive",
          title: "Suggestions failed",
          description: "Failed to generate content suggestions. Please try again."
        });
      } finally {
        setIsSuggestionsLoading(false);
      }
    } else {
      console.warn("No vision data available for content suggestions");
      setContentSuggestions([]);
    }
  };
  
  const handleRemoveImage = (imageId: string) => {
    setScoredImages((prevImages) => prevImages.filter((image) => image.id !== imageId));
    
    if (selectedImage && selectedImage.id === imageId) {
      setSelectedImage(null);
      setContentSuggestions([]);
    }
  };
  
  const handleSelectSuggestion = (suggestion: ContentSuggestion) => {
    setSelectedSuggestion(suggestion);
  };
  
  const handleToggleExperimentalMode = (enabled: boolean) => {
    setExperimentalMode(enabled);
    if (onToggleExperimentalMode) {
      onToggleExperimentalMode(enabled);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onToggleExperimentalMode={handleToggleExperimentalMode}
      />
      
      <div className="container mx-auto p-4 md:p-8 space-y-8">
        <ProjectSelector />

        {isDevelopmentMode() && <DevNav className="mb-6" />}

        {isUploading && (
          <UploadTracker
            uploadProgress={uploadProgress}
            estimatedTimeRemaining={15}
            dailyUploads={uploadStats.dailyUploads}
            maxUploads={uploadStats.maxUploads}
            remainingUploads={uploadStats.remainingUploads}
          />
        )}
        
        {isLoading && !scoredImages.length ? (
          <EmptyState 
            onImagesSelected={handleImagesSelected}
          />
        ) : (
          <ImageDashboard
            isLoading={isLoading}
            scoredImages={scoredImages}
            selectedImage={selectedImage}
            contentSuggestions={contentSuggestions}
            selectedSuggestion={selectedSuggestion}
            isSuggestionsLoading={isSuggestionsLoading}
            availableModels={availableModels}
            onSelectImage={handleSelectImage}
            onRemoveImage={handleRemoveImage}
            onSelectSuggestion={handleSelectSuggestion}
          />
        )}

        <ImageUploader
          isUploading={isUploading}
          onImagesSelected={handleImagesSelected}
          maxImages={uploadStats.remainingUploads}
        />
        
        <AppFooter />
      </div>
    </div>
  );
};

export default Index;
