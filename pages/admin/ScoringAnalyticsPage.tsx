
import React from 'react';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { Loader2 } from 'lucide-react';
import { isDevelopmentMode } from '@/utils/devMode';
import ScoringAnalyticsDashboard from '@/components/admin/feedback/ScoringAnalyticsDashboard';
import TestDataGenerator from '@/components/dev/TestDataGenerator';

const ScoringAnalyticsPage = () => {
  const { isAuthorized, isLoading: roleLoading } = useRoleCheck(['admin', 'internal']);

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized && !isDevelopmentMode()) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] p-6">
        <h1 className="text-2xl font-bold mb-4">Unauthorized Access</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <ScoringAnalyticsDashboard />
      {isDevelopmentMode() && <TestDataGenerator />}
    </div>
  );
};

export default ScoringAnalyticsPage;
