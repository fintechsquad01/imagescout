
import React, { useEffect } from 'react';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import BillingSettings from '@/components/billing/BillingSettings';
import UnauthorizedAccess from '@/components/admin/UnauthorizedAccess';
import Header from '@/components/Header';
import AppFooter from '@/components/dashboard/AppFooter';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { isDevelopmentMode, logDevModeBypass } from '@/utils/devMode';
import DevModeBanner from '@/components/dev/DevModeBanner';
import DevModeIndicator from '@/components/dev/DevModeIndicator';

const BillingPage: React.FC = () => {
  // Only allow authenticated users to view the billing page
  const { isAuthorized, isLoading } = useRoleCheck(['user', 'beta', 'internal', 'admin']);
  const { isFeatureEnabled, isLoading: flagsLoading } = useFeatureFlags();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    // Development mode notice
    if (isDevelopmentMode()) {
      logDevModeBypass('billing page access');
      toast.info('Development mode: Billing page is accessible regardless of role or feature flags', {
        duration: 5000,
        id: 'dev-mode-billing',
        description: 'Role and feature flag checks are bypassed locally'
      });
    }
    
    // Handle error cases in the URL params
    const error = searchParams.get('error');
    const errorType = searchParams.get('error_type');
    
    if (error) {
      console.error('[Stripe Billing] Error returned:', error, 'Type:', errorType);
      toast.error(
        error === 'canceled' 
          ? 'Checkout was canceled' 
          : `Payment error: ${error}. Please try again later.`
      );
    }
    
    // Handle success cases
    const success = searchParams.get('success');
    if (success === 'true') {
      const successMessage = searchParams.get('message') || 'Subscription updated successfully!';
      toast.success(successMessage);
    }
  }, [searchParams]);

  if (isLoading || flagsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // In development mode, allow access regardless of authorization
  if (!isAuthorized && !isDevelopmentMode()) {
    return <UnauthorizedAccess />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {isDevelopmentMode() && (
          <DevModeBanner 
            context="Billing page" 
            showDetails={true} 
            className="mb-6"
          />
        )}
        <BillingSettings className="max-w-5xl mx-auto" />
      </main>
      <AppFooter />
      {isDevelopmentMode() && <DevModeIndicator />}
    </div>
  );
};

export default BillingPage;
