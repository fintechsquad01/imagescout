
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from "@/components/theme-provider"
import { ProjectProvider } from '@/context/ProjectContext';
import { SupabaseProvider } from '@/context/SupabaseContext';
import { UserProvider } from '@/context/UserContext';
import { MobileNav } from '@/components/MobileNav';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { isDevelopmentMode } from '@/utils/devMode';
import { TestDataGenerator } from '@/components/dev/TestDataGenerator';
import Index from '@/pages/Index';
import BillingPage from '@/pages/BillingPage';
import TestScoringPage from '@/pages/TestScoringPage';
import FeedbackReviewPage from '@/pages/admin/FeedbackReviewPage';
import ScoringLogsPage from '@/pages/admin/ScoringLogsPage';
import ScoringAnalyticsPage from '@/pages/admin/ScoringAnalyticsPage';
import NotFound from '@/pages/NotFound';

const App = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Set initial value
    handleResize();

    // Listen for window resize events
    window.addEventListener('resize', handleResize);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SupabaseProvider>
        <UserProvider>
          <ProjectProvider>
            <div className="flex h-screen antialiased bg-background">
              {isMobile ? (
                <>
                  <MobileNav showSidebar={showSidebar} setShowSidebar={setShowSidebar} />
                  <div className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-40 transform ${showSidebar ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
                    <AdminSidebar />
                  </div>
                </>
              ) : (
                <aside className="w-64 border-r border-border flex-shrink-0 h-full">
                  <AdminSidebar />
                </aside>
              )}

              <main className="flex-1 p-4 overflow-y-auto">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="/test-scoring" element={<TestScoringPage />} />
                  <Route path="/admin/feedback" element={<FeedbackReviewPage />} />
                  <Route path="/admin/scoring-logs" element={<ScoringLogsPage />} />
                  <Route path="/admin/test-scoring" element={<TestScoringPage />} />
                  <Route path="/admin/scoring-analytics" element={<ScoringAnalyticsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
            <Toaster />
            {isDevelopmentMode() && <TestDataGenerator />}
          </ProjectProvider>
        </UserProvider>
      </SupabaseProvider>
    </ThemeProvider>
  );
};

export default App;
