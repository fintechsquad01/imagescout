import { analyzeAndTransformImage } from '@/lib/ai/pipeline';
import { ImageScoutUI } from '@/components/image-scout/ImageScoutUI';
import { useState } from 'react';

// Main page component for the ImageScout application
export default function ImageScoutPage() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalysisComplete = (result: any) => {
    setAnalysisResult(result);
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">ImageScout</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Analyze and optimize your images for social media virality. Get insights on composition, 
          aesthetics, and platform-specific recommendations.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <ImageScoutUI 
            onAnalysisComplete={handleAnalysisComplete}
            initialPlatform="instagram"
            showVideoOption={true}
          />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg">
              <div className="text-xl font-bold text-blue-600 mb-2">1</div>
              <h3 className="font-medium mb-2">Upload Your Image</h3>
              <p className="text-sm text-gray-600">
                Upload any image you want to analyze and optimize for social media.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="text-xl font-bold text-blue-600 mb-2">2</div>
              <h3 className="font-medium mb-2">AI Analysis</h3>
              <p className="text-sm text-gray-600">
                Our AI analyzes your image for composition, aesthetics, and viral potential.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="text-xl font-bold text-blue-600 mb-2">3</div>
              <h3 className="font-medium mb-2">Get Recommendations</h3>
              <p className="text-sm text-gray-600">
                Receive platform-specific recommendations and optimized content for maximum engagement.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Virality Score</h3>
              <p className="text-sm text-gray-600">
                Get a numerical score predicting how likely your image is to go viral.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Platform Optimization</h3>
              <p className="text-sm text-gray-600">
                Specific recommendations for Instagram, TikTok, Twitter, and more.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Video Creation</h3>
              <p className="text-sm text-gray-600">
                Transform static images into engaging video content automatically.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">AI-Powered Insights</h3>
              <p className="text-sm text-gray-600">
                Leveraging GPT-4o and advanced vision AI for deep content analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
