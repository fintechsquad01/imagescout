import { OneClickVideo } from '@/components/image-scout/OneClickVideo';
import { PlatformTemplates, PlatformTemplate } from '@/components/image-scout/PlatformTemplates';
import { useState } from 'react';

// Main page component for the enhanced ImageScout application
export default function EnhancedImageScoutPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<PlatformTemplate | null>(null);
  const [createdVideos, setCreatedVideos] = useState<{url: string, thumbnail: string}[]>([]);
  const [activeTab, setActiveTab] = useState<'templates' | 'videos'>('templates');

  const handleTemplateSelect = (template: PlatformTemplate) => {
    setSelectedTemplate(template);
    setActiveTab('videos');
  };

  const handleVideoCreated = (videoUrl: string, thumbnailUrl: string) => {
    setCreatedVideos(prev => [...prev, {url: videoUrl, thumbnail: thumbnailUrl}]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">ImageScout</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Create viral content with one click. Analyze, transform, and optimize your images for maximum engagement.
        </p>
      </header>

      <div className="tabs flex border-b mb-6">
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'templates' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('templates')}
        >
          Platform Templates
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'videos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('videos')}
        >
          Video Creation
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {activeTab === 'templates' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <PlatformTemplates 
              onSelectTemplate={handleTemplateSelect}
              initialPlatform="instagram"
            />
          </div>
        )}
        
        {activeTab === 'videos' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <OneClickVideo 
              onVideoCreated={handleVideoCreated}
            />
            
            {selectedTemplate && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="font-medium mb-2">Selected Template: {selectedTemplate.name}</h3>
                <p className="text-sm mb-2">{selectedTemplate.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-blue-100 rounded">
                    <span className="font-medium">Platform:</span> {selectedTemplate.platform}
                  </div>
                  <div className="p-2 bg-blue-100 rounded">
                    <span className="font-medium">Aspect Ratio:</span> {selectedTemplate.aspectRatio}
                  </div>
                  <div className="p-2 bg-blue-100 rounded">
                    <span className="font-medium">Resolution:</span> {selectedTemplate.resolution}
                  </div>
                  {selectedTemplate.videoDuration && (
                    <div className="p-2 bg-blue-100 rounded">
                      <span className="font-medium">Duration:</span> {selectedTemplate.videoDuration}s
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg">
              <div className="text-xl font-bold text-blue-600 mb-2">1</div>
              <h3 className="font-medium mb-2">Select a Template</h3>
              <p className="text-sm text-gray-600">
                Choose from pre-configured templates optimized for different platforms and content types.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="text-xl font-bold text-blue-600 mb-2">2</div>
              <h3 className="font-medium mb-2">Upload Your Images</h3>
              <p className="text-sm text-gray-600">
                Upload multiple images at once for batch processing and transformation.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="text-xl font-bold text-blue-600 mb-2">3</div>
              <h3 className="font-medium mb-2">Create Videos with One Click</h3>
              <p className="text-sm text-gray-600">
                Transform your images into engaging videos optimized for your selected platform.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">One-Click Video Creation</h3>
              <p className="text-sm text-gray-600">
                Transform static images into engaging videos with a single click.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Batch Processing</h3>
              <p className="text-sm text-gray-600">
                Process multiple images simultaneously for maximum efficiency.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Platform Templates</h3>
              <p className="text-sm text-gray-600">
                Pre-configured settings optimized for different platforms and content types.
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">AI-Powered Analysis</h3>
              <p className="text-sm text-gray-600">
                Advanced image analysis for virality prediction and optimization recommendations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
