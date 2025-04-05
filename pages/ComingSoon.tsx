
import React from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { CalendarClock, Sparkles, ArrowLeft } from 'lucide-react';
import AppFooter from '@/components/dashboard/AppFooter';

const ComingSoon: React.FC = () => {
  // Toggle back to main app
  const handleBackToMain = () => {
    localStorage.setItem('experimentalMode', 'false');
    window.location.reload();
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-secondary/30">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl flex flex-col items-center justify-center">
        <div className="text-center max-w-xl mx-auto">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <CalendarClock className="h-8 w-8 text-primary" />
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary" />
              New Features Coming Soon
            </span>
          </h1>
          
          <p className="text-muted-foreground text-lg mb-8">
            We're working on some exciting new features for the AI Content Repurposing Studio. 
            Check back soon for more ways to transform your content.
          </p>
          
          <div className="bg-card border rounded-lg p-6 shadow-lg mb-8">
            <h2 className="text-lg font-medium mb-3">What's Coming Next</h2>
            <ul className="space-y-3 text-left">
              <li className="flex items-start gap-2">
                <div className="bg-primary/20 rounded-full p-1 mt-0.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <span>Multi-format content generation across platforms</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-primary/20 rounded-full p-1 mt-0.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <span>Integrated content scheduling and publishing</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="bg-primary/20 rounded-full p-1 mt-0.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
                <span>Advanced analytics and performance tracking</span>
              </li>
            </ul>
          </div>
          
          <Button
            onClick={handleBackToMain}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Main App
          </Button>
        </div>
      </main>
      
      <AppFooter />
    </div>
  );
};

export default ComingSoon;
