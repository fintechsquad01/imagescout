
import React, { useState } from 'react';
import { useProject } from '@/context/ProjectContext';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { availableModels } from '@/data/aiModels';
import BatchScoring from '@/components/scoring/BatchScoring';
import DevNav from '@/components/dev/DevNav';
import { isDevelopmentMode } from '@/utils/devMode';

const BatchScoringPage: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState(availableModels[0]?.id || 'default-model');
  const [prompt, setPrompt] = useState('Generate a creative description of this image');
  const [skipCache, setSkipCache] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { currentProject } = useProject();
  
  const handleModelChange = (value: string) => {
    setSelectedModel(value);
  };
  
  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
  };
  
  const handleSkipCacheChange = (checked: boolean) => {
    setSkipCache(checked);
  };
  
  const handleReset = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto p-4 md:p-8 space-y-8">
        {isDevelopmentMode() && <DevNav className="mb-6" />}
        
        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Batch Image Scoring</CardTitle>
              <CardDescription>
                Test the scoring infrastructure with multiple images at once
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="model">Scoring Model</Label>
                  <Select value={selectedModel} onValueChange={handleModelChange}>
                    <SelectTrigger id="model">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map(model => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt Template</Label>
                  <Input
                    id="prompt"
                    value={prompt}
                    onChange={handlePromptChange}
                    placeholder="Enter prompt template"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="skip-cache"
                  checked={skipCache}
                  onCheckedChange={handleSkipCacheChange}
                />
                <Label htmlFor="skip-cache">Skip cache (force fresh scoring)</Label>
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleReset}
              >
                Reset Batch
              </Button>
            </CardContent>
          </Card>
          
          <div key={refreshKey}>
            <BatchScoring 
              modelId={selectedModel}
              prompt={prompt}
              skipCache={skipCache}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchScoringPage;
