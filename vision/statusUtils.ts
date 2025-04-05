
import { getEnvSummary } from '@/utils/envValidation';

/**
 * Get environment status for image analysis features
 */
export const getImageAnalysisStatus = () => {
  const envSummary = getEnvSummary();
  
  return {
    available: envSummary.supportsAnalysis,
    usingEdgeFunctions: envSummary.useEdgeFunctions,
    usingRealScoring: envSummary.useRealScoring,
    inTestMode: envSummary.testEdgeFunction,
    environment: envSummary.env
  };
};
