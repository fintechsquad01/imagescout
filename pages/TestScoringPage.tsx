
import React, { useState } from 'react';
import { useProject, TEST_PROJECT_ID } from '@/context/ProjectContext';
import { toast } from '@/components/ui/use-toast';
import { scoreImage } from '@/services/imageScoring';
import { ModelComparisonResultWithCache } from '@/types/scoring';
import { ScoringConfig } from '@/types/scoring-config';

// Sample models for testing
const DEFAULT_TEST_MODELS: ScoringConfig[] = [
  {
    id: 'model1',
    model: 'general-v1',
    version: '1.0',
    weights: {
      labels: 1.0,
      objects: 1.2,
      landmarks: 1.5,
      colors: 0.8,
      baseScore: 10,
      maxScore: 100
    },
    prompt_template: "Analyze the image",
    is_active: true
  },
  {
    id: 'model2',
    model: 'detailed-v1',
    version: '1.1',
    weights: {
      labels: 1.2,
      objects: 1.5,
      landmarks: 2.0,
      colors: 1.0,
      baseScore: 15,
      maxScore: 100
    },
    prompt_template: "Analyze the image in detail",
    is_active: true
  }
];

const TestScoringPage: React.FC = () => {
  const [comparisonResults, setComparisonResults] = useState<ModelComparisonResultWithCache[]>([]);
  const [isMockEnabled, setIsMockEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { currentProject } = useProject();
  const [modelsToCompare, setModelsToCompare] = useState(DEFAULT_TEST_MODELS);
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    setIsLoading(true);
    
    try {
      // Score the image with multiple models for comparison
      const results = await scoreImage(file, {
        projectId: currentProject?.id || TEST_PROJECT_ID,
        forceMock: isMockEnabled,
        compareModels: true,
        modelsToCompare,
      });
      
      setComparisonResults(results);
      
      toast({
        title: "Image scored successfully",
        description: `Compared ${results.length} different scoring models.`,
      });
    } catch (error) {
      console.error("Error scoring image:", error);
      toast({
        variant: "destructive",
        title: "Scoring failed",
        description: "There was an error scoring the image. Check the console for details."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Scoring Models</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">Upload an image to test</h2>
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <p className="mb-2 text-sm text-gray-500">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-500">PNG, JPG or WEBP</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            onChange={handleFileUpload} 
            accept="image/png, image/jpeg, image/webp"
            disabled={isLoading}
          />
        </label>
      </div>
      
      <div className="mb-6">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isMockEnabled}
            onChange={(e) => setIsMockEnabled(e.target.checked)}
            className="form-checkbox h-5 w-5 text-blue-600"
          />
          <span>Use mock data (faster for testing)</span>
        </label>
      </div>
      
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Analyzing image with multiple models...</p>
        </div>
      )}
      
      {!isLoading && comparisonResults.length > 0 && (
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">Scoring Model Comparison</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Labels</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Objects</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cached</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comparisonResults.map((result, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.modelName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.score}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.visionData?.labels?.length || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.visionData?.objects?.length || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.version}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.cached ? 'Yes' : 'No'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestScoringPage;
